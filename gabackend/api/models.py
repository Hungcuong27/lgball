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