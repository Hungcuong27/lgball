from flask import Flask, request, jsonify
from flask_cors import CORS
import sys
import os

from models import add_card, get_collection, get_history, create_user, get_user, get_referrals, add_transaction, get_transactions, add_open_history, get_open_history, increase_balance, decrease_balance
import random
import time
from ton_utils import send_ton_onchain
import requests
from bson import ObjectId
from pymongo import MongoClient
from config import MONGO_URI, DB_NAME

app = Flask(__name__)
CORS(app)

# Test endpoint
@app.route('/api/test', methods=['GET'])
def test():
    return jsonify({'status': 'ok', 'message': 'API is working!'})

def api_response(func):
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except Exception as e:
            print("[ERROR]", e)
            return jsonify({'error': str(e)}), 500
    wrapper.__name__ = func.__name__
    return wrapper

def convert_objectid(obj):
    if isinstance(obj, list):
        return [convert_objectid(item) for item in obj]
    if isinstance(obj, dict):
        return {k: convert_objectid(v) for k, v in obj.items()}
    if isinstance(obj, ObjectId):
        return str(obj)
    return obj

@app.route('/api/user', methods=['POST'])
@api_response
def api_create_user():
    data = request.json
    print(f"[DEBUG] data: {data}")
    address = data.get('address')
    referrer = data.get('referrer')
    user = create_user(address, referrer)
    return jsonify(convert_objectid(user))

@app.route('/api/user', methods=['GET'])
@api_response
def api_get_user():
    address = request.args.get('address')
    user = get_user(address)
    return jsonify(convert_objectid(user))

@app.route('/api/referrals', methods=['GET'])
@api_response
def api_get_referrals():
    address = request.args.get('address')
    refs = get_referrals(address)
    return jsonify(convert_objectid(refs))

@app.route('/api/deposit', methods=['POST'])
@api_response
def api_deposit():
    data = request.json
    print ("data :" , data)
    address = data.get('address')
    amount = float(data.get('amount'))
    tx_hash = data.get('tx_hash')
    if not tx_hash:
        return jsonify({'error': 'Thiếu mã giao dịch (tx_hash)'}), 400
    # Bỏ xác thực blockchain, chỉ lưu vào DB
    tx = add_transaction(address, 'deposit', amount, status='success')
    increase_balance(address, amount)
    return jsonify(tx)

@app.route('/api/withdraw', methods=['POST'])
@api_response
def api_withdraw():
    data = request.json
    address = data.get('address')
    amount = float(data.get('amount'))
    # TODO: kiểm tra số dư thực tế trước khi rút
    tx_result = send_ton_onchain(address, amount)
    tx_hash = tx_result.get('tx_hash') if isinstance(tx_result, dict) else str(tx_result)
    # Lưu lịch sử rút, cập nhật số dư
    add_transaction(address, 'withdraw', amount, status='success')
    decrease_balance(address, amount)
    return jsonify({'status': 'success', 'tx_hash': tx_hash})

@app.route('/api/transactions', methods=['GET'])
@api_response
def api_get_transactions():
    address = request.args.get('address')
    txs = get_transactions(address)
    return jsonify(convert_objectid(txs))

@app.route('/api/open-history', methods=['GET'])
@api_response
def api_get_open_history():
    address = request.args.get('address')
    history = get_open_history(address)
    return jsonify(convert_objectid(history))

@app.route('/api/open-chest', methods=['POST'])
@api_response
def open_chest():
    data = request.json
    address = data.get('address')
    chest_type = data.get('chest_type')
    # Lấy danh sách player card theo chest_type từ DB
    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]
    player_cards_col = db['player_cards']
    cards = list(player_cards_col.find({'ball_type': chest_type}))
    if not cards:
        return jsonify({'error': 'No player cards found for this chest type'}), 400
    # Random theo tỷ lệ rate
    total_rate = sum(c.get('rate', 0) for c in cards)
    r = random.uniform(0, total_rate)
    acc = 0
    selected = cards[-1]
    for c in cards:
        acc += c.get('rate', 0)
        if r <= acc:
            selected = c
            break
    timestamp = int(time.time())
    # Lấy user và kiểm tra balance
    user = get_user(address)
    price = selected.get('price', 0.5)
    if not user or user.get('balance', 0) < price:
        return jsonify({'error': 'Không đủ TON để mở bóng'}), 400
    decrease_balance(address, price)
    # Lưu lịch sử
    add_card(address, selected.get('rarity', ''), chest_type, selected.get('reward', 0), timestamp)
    add_open_history(address, chest_type, selected.get('name', ''), selected.get('reward', 0))
    return jsonify({
        'player_card': selected.get('name', ''),
        'image': selected.get('image', ''),
        'card_type': selected.get('rarity', ''),
        'reward': selected.get('reward', 0),
        'timestamp': timestamp
    })

@app.route('/api/collection', methods=['GET'])
@api_response
def collection():
    address = request.args.get('address')
    result = get_collection(address)
    return jsonify(convert_objectid(result))

@app.route('/api/history', methods=['GET'])
@api_response
def history():
    address = request.args.get('address')
    result = get_history(address)
    return jsonify(convert_objectid(result))

# Vercel serverless function handler
def handler(request, context):
    return app(request, context)

# For local development
if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True) 