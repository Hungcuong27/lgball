from pymongo import MongoClient
import os
import time
from dotenv import load_dotenv

load_dotenv()
MONGO_URI = os.environ.get('MONGO_URI', '')
DB_NAME = os.environ.get('DB_NAME', 'gacha_game')

client = MongoClient(MONGO_URI)
db = client[DB_NAME]

# User collection
users_col = db['users']
# Tạo index đảm bảo mỗi address là duy nhất
try:
    users_col.create_index('address', unique=True)
except Exception as e:
    # Index might already exist; soft log
    pass
# Card collection
cards_col = db['cards']
# History collection
history_col = db['history']
# Transactions collection
transactions_col = db['transactions']
# Open history collection
open_history_col = db['open_history']

def encode_referral_uuid(address: str) -> str:
    """Encode địa chỉ ví thành mã referral 8 ký tự ổn định."""
    if not address:
        return ''
    hash_val = 0
    for i in range(len(address)):
        char = ord(address[i])
        hash_val = ((hash_val << 5) - hash_val) + char
        hash_val = hash_val & hash_val
    chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    result = ''
    current_hash = abs(hash_val)
    for i in range(8):
        result += chars[current_hash % len(chars)]
        current_hash = current_hash // len(chars)
        if current_hash == 0:
            current_hash = abs(hash_val + i * 31)
    return result

def add_card(address, card_type, ball_type, reward, timestamp, price):
    """Add card to user collection and update ton_daily"""
    # Lưu vào collection
    users_col.update_one(
        {'address': address},
        {
            '$inc': {f'collection.{card_type}': 1},  # Loại bỏ ton_daily = reward để tách biệt ball và ton
        },
        upsert=True
    )
    
    # Lưu vào history
    history_col.insert_one({
        'address': address,
        'card_type': card_type,
        'ball_type': ball_type,
        'ton_added': reward,  # Thay đổi từ ball_added thành ton_added
        'timestamp': timestamp,
        'type': 'ball_opening'  # Thêm type để phân biệt
    })
    
    # Cập nhật ton_daily của user (tăng lên theo giá trị thẻ)
    users_col.update_one(
        {'address': address},
        {'$inc': {'ton_daily': reward}}  # Tăng ton_daily theo reward của thẻ
    )
    
    # Tính commission cho referrer (10% của price của bóng)
    user = get_user(address)
    if user and user.get('referrer') and price:
        referrer_commission = price * 0.10  # 10% commission dựa trên price của bóng
        
        # Cộng commission trực tiếp vào balance của referrer
        users_col.update_one(
            {'address': user['referrer']},
            {'$inc': {'balance': referrer_commission, 'referral_earnings': referrer_commission}}
        )
        
        # Lưu lịch sử commission
        add_referral_commission(user['referrer'], address, referrer_commission, timestamp, ball_type, price)
    
    return history_col.find_one({'address': address, 'ball_type': ball_type, 'timestamp': timestamp})

def get_collection(address):
    user = users_col.find_one({'address': address})
    if not user:
        return {'Legend': 0, 'Epic': 0, 'Rare': 0, 'Common': 0, 'total_reward': 0}
    return user.get('collection', {'Legend': 0, 'Epic': 0, 'Rare': 0, 'Common': 0, 'total_reward': 0})

def get_history(address, limit=20):
    return list(history_col.find({'address': address}).sort('timestamp', -1).limit(limit))

# User & Referral

def create_user(address, referrer=None):
    # Nếu address là raw 0:..., giữ nguyên như FE đã gửi, nhưng referral_uuid sẽ dựa trên địa chỉ user-friendly ở backend API khác
    user = users_col.find_one({'address': address})
    if not user:
        # Tạo user mới với cả address (raw) và friendly_address
        user_data = {
            'address': address,
            'referrer': referrer,
            'referral_uuid': encode_referral_uuid(address),
            'ton_daily': 0,
            'ton_withdrawn': 0,
            'referral_earnings': 0,  # Thêm trường thu nhập từ referral
            'created_at': int(time.time()),
            'balance': 0,  # Thêm trường balance mặc định là 0
            'collection': {
                'ball': 0,  # Khởi tạo ball mặc định là 0
                'checkin_day': 1,  # Khởi tạo checkin_day mặc định là 1
                'last_checkin_date': '',  # Khởi tạo last_checkin_date rỗng
                'Legend': 0,
                'Epic': 0,
                'Rare': 0,
                'Common': 0
            }
        }
        
        # Luôn tạo friendly_address: convert nếu raw, giữ nguyên nếu đã user-friendly
        if address.startswith('0:'):
            try:
                import requests
                response = requests.get(f'https://toncenter.com/api/v3/addressBook?address={address}')
                if response.status_code == 200:
                    data_response = response.json()
                    if address in data_response and data_response[address].get('user_friendly'):
                        user_data['friendly_address'] = data_response[address]['user_friendly']
            except Exception as e:
                pass
        else:
            # Nếu address đã là user-friendly format, dùng làm friendly_address
            user_data['friendly_address'] = address
        
        users_col.insert_one(user_data)
        return users_col.find_one({'address': address})

    # Backfill referrer nếu trước đó null và lần này có cung cấp
    if referrer and not user.get('referrer') and referrer != address:
        users_col.update_one({'address': address}, {'$set': {'referrer': referrer}})
        user = users_col.find_one({'address': address})

    # Backfill referral_uuid nếu thiếu
    if not user.get('referral_uuid'):
        users_col.update_one({'address': address}, {'$set': {'referral_uuid': encode_referral_uuid(address)}})
        user = users_col.find_one({'address': address})
    
    # Backfill friendly_address nếu thiếu
    if not user.get('friendly_address'):
        if address.startswith('0:'):
            try:
                import requests
                response = requests.get(f'https://toncenter.com/api/v3/addressBook?address={address}')
                if response.status_code == 200:
                    data_response = response.json()
                    if address in data_response and data_response[address].get('user_friendly'):
                        users_col.update_one({'address': address}, {'$set': {'friendly_address': data_response[address]['user_friendly']}})
                        user = users_col.find_one({'address': address})
            except Exception as e:
                pass
        else:
            # Nếu address đã là user-friendly, dùng làm friendly_address
            users_col.update_one({'address': address}, {'$set': {'friendly_address': address}})
            user = users_col.find_one({'address': address})
    
    return user

def get_user(address):
    return users_col.find_one({'address': address})

def get_referrals(address):
    referrals = list(users_col.find({'referrer': address}))
    # Thêm thông tin chi tiết cho mỗi referral
    for ref in referrals:
        # Tính tổng thu nhập từ referral
        total_earned = ref.get('referral_earnings', 0)
        ref['total_earned'] = total_earned
        ref['joined_at'] = ref.get('created_at', 0)
        # Thêm friendly_address nếu có
        if ref.get('friendly_address'):
            ref['friendly_address'] = ref['friendly_address']
    return referrals

def add_referral_commission(referrer_address, referred_address, commission_amount, timestamp, chest_type=None, price=None):
    """Lưu lịch sử commission cho referrer"""
    commission_record = {
        'referrer_address': referrer_address,
        'referred_address': referred_address,
        'commission_amount': commission_amount,
        'timestamp': timestamp,
        'chest_type': chest_type,  # Loại bóng được mở
        'price': price  # Giá của bóng
    }
    # Tạo collection mới cho referral commissions nếu chưa có
    if 'referral_commissions' not in db.list_collection_names():
        db.create_collection('referral_commissions')
    db['referral_commissions'].insert_one(commission_record)
    return commission_record

def get_referral_commissions(referrer_address):
    """Lấy lịch sử commission của một referrer"""
    if 'referral_commissions' not in db.list_collection_names():
        return []
    commissions = list(db['referral_commissions'].find({'referrer_address': referrer_address}).sort('timestamp', -1))
    
    # Thêm friendly_address cho mỗi commission
    for commission in commissions:
        referred_address = commission.get('referred_address')
        if referred_address:
            # Tìm user để lấy friendly_address
            user = get_user(referred_address)
            if user and user.get('friendly_address'):
                commission['referred_friendly_address'] = user['friendly_address']
    
    return commissions

# Nạp/rút

def add_transaction(address, tx_type, amount, status='pending', real_status='pending'):
    tx = {
        'address': address,
        'type': tx_type,  # 'deposit' hoặc 'withdraw'
        'amount': amount,
        'status': status,
        'timestamp': int(time.time()),
        'real_status': real_status
    }
    transactions_col.insert_one(tx)
    return tx

def get_transactions(address):
    return list(transactions_col.find({'address': address}).sort('timestamp', -1))

# Lịch sử mở ball
def add_open_history(address, ball_type, player_card, reward):
    entry = {
        'address': address,
        'ball_type': ball_type,
        'player_card': player_card,
        'ton_added': reward,  # Thay đổi từ ball_added thành ton_added
        'timestamp': int(time.time()),
        'type': 'ball_opening'  # Thêm type để phân biệt
    }
    open_history_col.insert_one(entry)
    # Cũng lưu vào bảng history chính
    history_col.insert_one(entry)
    return entry

def get_open_history(address):
    return list(open_history_col.find({'address': address}).sort('timestamp', -1))

def decrease_balance(address, amount):
    users_col.update_one({'address': address}, {'$inc': {'balance': -amount}})

def increase_balance(address, amount):
    users_col.update_one({'address': address}, {'$inc': {'balance': amount}})

# Checkin system
def add_checkin(address, reward=None):
    """Add checkin record to checkin_history collection and update user stats"""
    from datetime import datetime, timedelta
    import time
    
    try:
        current_time = int(time.time())
        now = datetime.utcnow()
        
        # Check if user already checked in today (using local timezone)
        today_start = int(now.replace(hour=0, minute=0, second=0, microsecond=0).timestamp())
        today_end = today_start + 86400
        

        
        existing_checkin = db['checkin_history'].find_one({
            'address': address,
            'timestamp': {'$gte': today_start, '$lt': today_end}
        })
        
        if existing_checkin:
            # Return None to indicate error, not success
            return None, "Already checked in today"
        
        # Create checkin_history collection if it doesn't exist
        try:
            if 'checkin_history' not in db.list_collection_names():
                db.create_collection('checkin_history')
        except Exception as e:
            print(f"Error creating checkin_history collection: {e}")
            return None, "Failed to create collection"
        
        # Get all checkins from user, sorted by timestamp (oldest first)
        all_checkins = []
        try:
            raw_checkins = list(db['checkin_history'].find({
                'address': address
            }).sort('timestamp', 1))
            
            # Convert ObjectId to string for JSON serialization
            for checkin in raw_checkins:
                checkin['_id'] = str(checkin['_id'])
            all_checkins = raw_checkins
            
        except Exception as e:
            print(f"Error querying checkin_history: {e}")
            return None, "Failed to query checkin history"
        
        # Calculate checkin_day based on consecutive days
        # If user missed a day, they reset to Day 1
        if not all_checkins:
            # First checkin ever
            checkin_day = 1
        else:
            # Check if the last checkin was yesterday (consecutive)
            last_checkin_time = all_checkins[-1]['timestamp']
            last_checkin_date = datetime.utcfromtimestamp(last_checkin_time).date()
            yesterday = (now - timedelta(days=1)).date()
            
            if last_checkin_date == yesterday:
                # Consecutive day - continue to next day
                checkin_day = len(all_checkins) + 1
                
                # If reached Day 8, reset to Day 1
                if checkin_day > 7:
                    checkin_day = 1
            else:
                # Missed a day - reset to Day 1
                checkin_day = 1
        
        # Calculate ball reward based on day
        CHECKIN_REWARDS = [10, 15, 20, 30, 40, 60, 100]
        ball_reward = CHECKIN_REWARDS[checkin_day - 1]
        
        checkin_record = {
            'address': address,
            'ball_added': ball_reward,
            'timestamp': current_time,
            'checkin_day': checkin_day  # Add checkin_day to record for tracking
        }
        
        # Insert checkin record
        try:
            result = db['checkin_history'].insert_one(checkin_record)
            # Convert ObjectId to string for JSON serialization
            checkin_record['_id'] = str(result.inserted_id)
        except Exception as e:
            print(f"Error inserting checkin record: {e}")
            return None, "Failed to insert checkin record"
        
        # Update user stats
        try:
            users_col.update_one(
                {'address': address},
                {
                    '$inc': {
                        'collection.ball': ball_reward,
                    },
                    '$set': {
                        'collection.checkin_day': checkin_day,
                        'collection.last_checkin_date': datetime.utcfromtimestamp(current_time).strftime('%Y-%m-%d')
                    }
                },
                upsert=True
            )
        except Exception as e:
            print(f"Error updating user stats: {e}")
            # Don't return error here, checkin was successful
            # Just log the error
        
        return checkin_record, "Checkin successful"
        
    except Exception as e:
        print(f"Unexpected error in add_checkin: {e}")
        return None, "Unexpected error occurred"

def get_checkin_history(address):
    """Get checkin history from checkin_history collection"""
    try:
        if 'checkin_history' not in db.list_collection_names():
            return []
        
        raw_history = list(db['checkin_history'].find({'address': address}).sort('timestamp', -1))
        
        # Convert ObjectId to string for JSON serialization
        for record in raw_history:
            record['_id'] = str(record['_id'])
        
        return raw_history
    except Exception as e:
        # Error accessing checkin_history collection
        return []

def get_daily_ton_history(address):
    """Get daily TON history from daily_ton_history collection"""
    try:
        if 'daily_ton_history' not in db.list_collection_names():
            return []
        
        raw_history = list(db['daily_ton_history'].find({'address': address}).sort('timestamp', -1))
        
        # Format TON amounts to 4 decimal places
        formatted_history = []
        for record in raw_history:
            formatted_record = record.copy()
            
            # Use ton_added field (actual field name in database)
            ton_amount = formatted_record.get('ton_added', 0)
            
            # Format TON amount to 4 decimal places
            if isinstance(ton_amount, (int, float)):
                formatted_record['ton_amount'] = round(float(ton_amount), 4)
            else:
                formatted_record['ton_amount'] = 0
            
            formatted_history.append(formatted_record)
        
        return formatted_history
    except Exception as e:
        # Error accessing daily_ton_history collection
        return [] 

def get_checkin_status(address):
    """Get current checkin status for a user - consecutive days with reset to Day 1"""
    from datetime import datetime, timedelta
    
    now = datetime.utcnow()
    
    # Get all checkins from user, sorted by timestamp (oldest first)
    all_checkins = []
    try:
        if 'checkin_history' in db.list_collection_names():
            all_checkins = list(db['checkin_history'].find({
                'address': address
            }).sort('timestamp', 1))
    except Exception as e:
        # Error accessing checkin_history collection
        all_checkins = []
    
    # Calculate current checkin day based on consecutive days
    if not all_checkins:
        # First time checkin
        current_day = 1
        is_consecutive = True
    else:
        # Check if the last checkin was yesterday (consecutive)
        last_checkin_time = all_checkins[-1]['timestamp']
        last_checkin_date = datetime.utcfromtimestamp(last_checkin_time).date()
        yesterday = (now - timedelta(days=1)).date()
        
        if last_checkin_date == yesterday:
            # Consecutive day - continue to next day
            current_day = len(all_checkins) + 1
            
            # If reached Day 8, reset to Day 1
            if current_day > 7:
                current_day = 1
                
            is_consecutive = True
        else:
            # Missed a day - reset to Day 1
            current_day = 1
            is_consecutive = False
    
    # Get user's ball balance
    user = get_user(address)
    total_ball = user.get('collection', {}).get('ball', 0) if user else 0
    
    # Calculate rewards for each day
    CHECKIN_REWARDS = [10, 15, 20, 30, 40, 60, 100]
    
    # Check if user already claimed today
    today_start = int(now.replace(hour=0, minute=0, second=0, microsecond=0).timestamp())
    today_end = today_start + 86400
    
    claimed_today = False
    try:
        if 'checkin_history' in db.list_collection_names():
            today_checkin = db['checkin_history'].find_one({
                'address': address,
                'timestamp': {'$gte': today_start, '$lt': today_end}
            })
            claimed_today = today_checkin is not None
    except Exception as e:
        print(f"Error checking today's checkin: {e}")
        claimed_today = False
    
    # Create daily status array
    daily_status = []
    for day in range(1, 8):
        day_reward = CHECKIN_REWARDS[day - 1]
        
        # Check if this specific day was claimed by checking database
        day_claimed = False
        day_available = False
        
        try:
            if 'checkin_history' in db.list_collection_names():
                # Kiểm tra xem ngày này đã được claim chưa
                # Tìm checkin record cho ngày cụ thể này
                day_checkins = list(db['checkin_history'].find({
                    'address': address
                }).sort('timestamp', 1))
                
                # Kiểm tra xem có checkin nào cho ngày này không
                for checkin in day_checkins:
                    checkin_date = datetime.utcfromtimestamp(checkin['timestamp']).date()
                    checkin_day_number = checkin.get('checkin_day', 1)
                    
                    # Nếu checkin này có checkin_day trùng với ngày hiện tại đang xét
                    if checkin_day_number == day:
                        day_claimed = True
                        break
                        
        except Exception as e:
            print(f"Error checking day {day} claim status: {e}")
            day_claimed = False
        

        
        # Day is available for claiming if:
        # 1. It's the current day AND consecutive streak is active AND not claimed yet
        # 2. OR it's day 1 when starting a new streak (can be claimed again after reset)
        if day == current_day and is_consecutive and not day_claimed:
            day_available = True
        elif day == 1 and not is_consecutive:
            # When reset to day 1, user can claim day 1 again (even if claimed before)
            day_available = True
        
        daily_status.append({
            'day': day,
            'reward': day_reward,
            'claimed': day_claimed,
            'available': day_available
        })
    
    return {
        'current_day': current_day,
        'is_consecutive': is_consecutive,
        'total_ball': total_ball,
        'daily_status': daily_status,
        'claimed_today': claimed_today,
        'last_checkin_date': datetime.utcfromtimestamp(all_checkins[-1]['timestamp']).strftime('%Y-%m-%d') if all_checkins else None
    }

def get_ton_checkin_status(address):
    """Get current TON checkin status for a user - daily TON claim status"""
    from datetime import datetime, timedelta
    
    now = datetime.utcnow()
    
    # Check if user already claimed TON today
    today_start = int(now.replace(hour=0, minute=0, second=0, microsecond=0).timestamp())
    today_end = today_start + 86400
    
    ton_claimed_today = False
    ton_amount = 0
    last_ton_claim_date = None
    
    try:
        if 'daily_ton_history' in db.list_collection_names():
            # Kiểm tra xem hôm nay đã claim TON chưa
            today_ton_claim = db['daily_ton_history'].find_one({
                'address': address,
                'timestamp': {'$gte': today_start, '$lt': today_end}
            })
            
            if today_ton_claim:
                ton_claimed_today = True
                # Format TON amount to 4 decimal places
                raw_ton_amount = today_ton_claim.get('ton_added', 0)  # Use ton_added field
                if isinstance(raw_ton_amount, (int, float)):
                    ton_amount = round(float(raw_ton_amount), 4)
                else:
                    ton_amount = 0
                last_ton_claim_date = datetime.utcfromtimestamp(today_ton_claim['timestamp']).strftime('%Y-%m-%d %H:%M:%S')
            
            # Lấy lịch sử TON claims
            ton_history = list(db['daily_ton_history'].find({
                'address': address
            }).sort('timestamp', -1))
            
            if ton_history:
                last_ton_claim_date = datetime.utcfromtimestamp(ton_history[0]['timestamp']).strftime('%Y-%m-%d %H:%M:%S')
                
    except Exception as e:
        print(f"Error checking TON checkin status: {e}")
        ton_claimed_today = False
        ton_amount = 0
        last_ton_claim_date = None
    
    # Get user's TON balance
    user = get_user(address)
    user_ton_balance = user.get('ton_balance', 0) if user else 0
    
    # Check if this is the first time user claims daily TON
    first_claim = db['daily_ton_history'].find_one({'address': address})
    is_first_claim = first_claim is None
    
    return {
        'ton_claimed_today': ton_claimed_today,
        'ton_amount': ton_amount,
        'last_ton_claim_date': last_ton_claim_date,
        'user_ton_balance': user_ton_balance,
        'can_claim_today': not ton_claimed_today,
        'is_first_claim': is_first_claim
    }

def get_wallet_summary(address):
    """Get comprehensive wallet summary for a user"""
    from datetime import datetime
    
    try:
        # Get user info
        user = get_user(address)
        if not user:
            return None
        
        # Get transactions for deposits and withdrawals
        transactions = get_transactions(address)
        
        # Calculate totals
        total_deposits = 0
        total_withdrawals = 0
        withdrawal_history = []
        
        for tx in transactions:
            if tx.get('type') == 'deposit' and tx.get('status') == 'success':
                total_deposits += tx.get('amount', 0)
            elif tx.get('type') == 'withdraw':
                total_withdrawals += tx.get('amount', 0)
                # Add to withdrawal history
                withdrawal_history.append({
                    'amount': tx.get('amount', 0),
                    'status': tx.get('real_status', 'pending'),  # Use real_status for actual status
                    'timestamp': tx.get('timestamp', 0),
                    'date': datetime.utcfromtimestamp(tx.get('timestamp', 0)).strftime('%Y-%m-%d %H:%M:%S')
                })
        
        # Get daily TON history
        daily_ton_history = get_daily_ton_history(address)
        
        # Format daily TON history
        formatted_ton_history = []
        for record in daily_ton_history:
            formatted_ton_history.append({
                'ton_amount': record.get('ton_amount', 0),
                'timestamp': record.get('timestamp', 0),
                'date': datetime.utcfromtimestamp(record.get('timestamp', 0)).strftime('%Y-%m-%d %H:%M:%S')
            })
        
        # Sort withdrawal history and daily TON history by timestamp (newest first)
        withdrawal_history.sort(key=lambda x: x['timestamp'], reverse=True)
        formatted_ton_history.sort(key=lambda x: x['timestamp'], reverse=True)
        
        # Get current balance
        current_balance = user.get('balance', 0)
        
        # Get user stats
        user_stats = {
            'ton_daily': user.get('ton_daily', 0),
            'ton_withdrawn': user.get('ton_withdrawn', 0),
            'referral_earnings': user.get('referral_earnings', 0)
        }
        
        summary = {
            'address': address,
            'current_balance': current_balance,
            'total_deposits': round(total_deposits, 4),
            'total_withdrawals': round(total_withdrawals, 4),
            'withdrawal_history': withdrawal_history[:10],  # Limit to 10 most recent
            'daily_ton_history': formatted_ton_history[:10],  # Limit to 10 most recent
            'user_stats': user_stats
        }
        
        return summary
        
    except Exception as e:
        print(f"Error getting wallet summary: {e}")
        return None 