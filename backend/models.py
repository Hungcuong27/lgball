from pymongo import MongoClient
from config import MONGO_URI, DB_NAME
import time

client = MongoClient(MONGO_URI)
db = client[DB_NAME]

# User collection
users_col = db['users']
# Card collection
cards_col = db['cards']
# History collection
history_col = db['history']
# Transactions collection
transactions_col = db['transactions']
# Open history collection
open_history_col = db['open_history']

def add_card(address, card_type, chest_type, reward, timestamp):
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
    user = users_col.find_one({'address': address})
    if not user:
        users_col.insert_one({
            'address': address,
            'referrer': referrer,
            'ton_daily': 0,
            'ton_withdrawn': 0,
            'created_at': int(time.time()),
            'balance': 0  # Thêm trường balance mặc định là 0
        })
    return users_col.find_one({'address': address})

def get_user(address):
    return users_col.find_one({'address': address})

def get_referrals(address):
    return list(users_col.find({'referrer': address}))

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