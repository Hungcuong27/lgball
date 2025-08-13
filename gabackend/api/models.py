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
    # Có thể index đã tồn tại; log mềm
    print(f"[DEBUG] create_index address unique: {e}")
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

def add_card(address, card_type, chest_type, reward, timestamp, price=None):
    card = {
        'address': address,
        'card_type': card_type,
        'chest_type': chest_type,
        'reward': reward,
        'timestamp': timestamp
    }
    cards_col.insert_one(card)
    history_col.insert_one(card)
    users_col.update_one(
        {'address': address},
        {'$inc': {f'collection.{card_type}': 1, 'ton_daily': reward}},
        upsert=True
    )
    
    # Tính commission cho referrer (10% của price của bóng)
    user = get_user(address)
    if user and user.get('referrer') and price:
        referrer_commission = price * 0.10  # 10% commission dựa trên price của bóng
        users_col.update_one(
            {'address': user['referrer']},
            {'$inc': {'balance': referrer_commission, 'referral_earnings': referrer_commission}}
        )
        # Lưu lịch sử commission
        add_referral_commission(user['referrer'], address, referrer_commission, timestamp, chest_type, price)
    
    return card

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
            'balance': 0  # Thêm trường balance mặc định là 0
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

def add_transaction(address, tx_type, amount, status='pending'):
    tx = {
        'address': address,
        'type': tx_type,  # 'deposit' hoặc 'withdraw'
        'amount': amount,
        'status': status,
        'timestamp': int(time.time())
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
        'reward': reward,
        'timestamp': int(time.time())
    }
    open_history_col.insert_one(entry)
    return entry

def get_open_history(address):
    return list(open_history_col.find({'address': address}).sort('timestamp', -1))

def decrease_balance(address, amount):
    users_col.update_one({'address': address}, {'$inc': {'balance': -amount}})

def increase_balance(address, amount):
    users_col.update_one({'address': address}, {'$inc': {'balance': amount}})

# Checkin system
def add_checkin(address, reward=100):
    """Thêm checkin mới cho user - mỗi ngày một lần"""
    checkin_record = {
        'address': address,
        'reward': reward,
        'timestamp': int(time.time())
    }
    
    # Tạo collection checkins nếu chưa có
    if 'checkins' not in db.list_collection_names():
        db.create_collection('checkins')
    
    # Kiểm tra xem user đã checkin hôm nay chưa
    today_start = int(time.time()) - (int(time.time()) % 86400)  # 00:00:00 hôm nay
    today_end = today_start + 86400  # 23:59:59 hôm nay
    
    existing_checkin = db['checkins'].find_one({
        'address': address,
        'timestamp': {'$gte': today_start, '$lt': today_end}
    })
    
    if existing_checkin:
        return None, "Đã checkin hôm nay"
    
    # Thêm checkin mới
    db['checkins'].insert_one(checkin_record)
    
    # Tính toán checkin_day và cập nhật collection
    from datetime import datetime, timedelta
    
    current_time = int(time.time())
    now = datetime.utcnow()
    
    # Tính thứ 2 của tuần hiện tại (00:00:00)
    monday = now - timedelta(days=now.weekday())
    monday_start = int(monday.replace(hour=0, minute=0, second=0, microsecond=0).timestamp())
    
    # Lấy tất cả checkins của user trong tuần hiện tại
    week_checkins = list(db['checkins'].find({
        'address': address,
        'timestamp': {'$gte': monday_start}
    }).sort('timestamp', 1))
    
    # Kiểm tra xem có bỏ lỡ ngày nào không
    checkin_day = 1  # Mặc định bắt đầu từ ngày 1
    
    if len(week_checkins) > 1:
        # Kiểm tra xem các checkin có liên tiếp không
        for i in range(1, len(week_checkins)):
            prev_checkin = week_checkins[i-1]
            curr_checkin = week_checkins[i]
            
            # Tính số ngày giữa 2 checkin
            days_diff = (curr_checkin['timestamp'] - prev_checkin['timestamp']) // 86400
            
            if days_diff > 1:
                # Nếu bỏ lỡ 1 ngày trở lên, reset về ngày 1
                checkin_day = 1
                break
            else:
                # Nếu liên tiếp, tăng ngày
                checkin_day = i + 1
        else:
            # Nếu tất cả đều liên tiếp
            checkin_day = len(week_checkins)
    elif len(week_checkins) == 1:
        # Chỉ có 1 checkin trong tuần
        checkin_day = 1
    
    # Cập nhật collection với ball reward và thông tin checkin
    # Sử dụng upsert để tạo collection nếu chưa có
    users_col.update_one(
        {'address': address},
        {
            '$inc': {
                'collection.ball': reward,  # Cộng ball vào collection.ball
                'ton_daily': reward  # Cộng ball vào ton_daily (để tính daily TON reward)
            },
            '$set': {
                'collection.checkin_day': checkin_day,
                'collection.last_checkin_date': datetime.utcfromtimestamp(current_time).strftime('%Y-%m-%d')
            }
        },
        upsert=True  # Tạo document nếu chưa có
    )
    
    return checkin_record, "Checkin thành công"

def get_checkin_history(address, limit=30):
    """Lấy lịch sử checkin của user"""
    if 'checkins' not in db.list_collection_names():
        return []
    
    checkins = list(db['checkins'].find({'address': address}).sort('timestamp', -1).limit(limit))
    
    # Tính toán streak và thống kê
    if checkins:
        # Sắp xếp theo thời gian tăng dần để tính streak
        sorted_checkins = sorted(checkins, key=lambda x: x['timestamp'])
        current_streak = 0
        longest_streak = 0
        temp_streak = 0
        
        # Tính toán ngày trong tuần cho mỗi checkin
        for checkin in sorted_checkins:
            try:
                # Tính thứ 2 của tuần chứa checkin này
                checkin_time = checkin['timestamp']
                checkin_date = datetime.utcfromtimestamp(checkin_time)
                monday = checkin_date - timedelta(days=checkin_date.weekday())
                monday_start = int(monday.replace(hour=0, minute=0, second=0, microsecond=0).timestamp())
                
                # Tính ngày trong tuần (1-7, với 1 = thứ 2)
                days_since_monday = (checkin_time - monday_start) // 86400
                day = days_since_monday + 1
                
                # Thêm thông tin ngày trong tuần vào checkin
                checkin['week_day'] = day
                checkin['week_start'] = monday_start
            except Exception as e:
                print(f"Error calculating week day for checkin: {e}")
                checkin['week_day'] = 1
                checkin['week_start'] = 0
        
        # Tính current streak (từ checkin gần nhất)
        if sorted_checkins:
            latest_checkin = sorted_checkins[-1]
            latest_timestamp = latest_checkin['timestamp']
            today_start = int(time.time()) - (int(time.time()) % 86400)
            
            if latest_timestamp >= today_start:
                # Nếu checkin hôm nay, tính streak từ hôm qua
                current_streak = 1
                for i in range(len(sorted_checkins) - 2, -1, -1):
                    curr_timestamp = sorted_checkins[i]['timestamp']
                    prev_timestamp = sorted_checkins[i-1]['timestamp'] if i > 0 else curr_timestamp
                    days_diff = (curr_timestamp - prev_timestamp) // 86400
                    if days_diff == 1:
                        current_streak += 1
                    else:
                        break
            else:
                current_streak = 0
        
        # Thêm thông tin streak vào mỗi checkin
        for checkin in checkins:
            checkin['current_streak'] = current_streak
            checkin['longest_streak'] = longest_streak
    
    return checkins

def get_daily_ton_history(address, limit=30):
    """Lấy lịch sử daily TON của user"""
    if 'checkins' not in db.list_collection_names():
        return []
    
    # Lấy tất cả checkins của user
    all_checkins = list(db['checkins'].find({'address': address}).sort('timestamp', -1))
    
    # Nhóm theo ngày và tính tổng TON mỗi ngày
    daily_ton = {}
    for checkin in all_checkins:
        timestamp = checkin['timestamp']
        day_start = timestamp - (timestamp % 86400)  # 00:00:00 của ngày đó
        day_key = day_start
        
        if day_key not in daily_ton:
            daily_ton[day_key] = {
                'date': day_key,
                'total_ton': 0,
                'checkin_count': 0
            }
        
        daily_ton[day_key]['total_ton'] += checkin['reward']
        daily_ton[day_key]['checkin_count'] += 1
    
    # Chuyển thành list và sắp xếp theo ngày mới nhất
    daily_ton_list = list(daily_ton.values())
    daily_ton_list.sort(key=lambda x: x['date'], reverse=True)
    
    # Giới hạn số lượng kết quả
    return daily_ton_list[:limit] 