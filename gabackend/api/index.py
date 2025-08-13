from flask import Flask, request, jsonify
from flask_cors import CORS
import sys
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta

from models import add_card, get_collection, get_history, create_user, get_user, get_referrals, add_transaction, get_transactions, add_open_history, get_open_history, increase_balance, decrease_balance, get_referral_commissions, users_col, encode_referral_uuid, add_checkin, get_checkin_history, get_daily_ton_history, db

# Function để decode UUID về wallet address
def decode_referral_uuid(uuid):
    """
    Decode referral UUID về wallet address tương ứng bằng cách so khớp
    với giá trị encode_referral_uuid(address) trong tập người dùng hiện tại.
    """
    if not uuid:
        return None
    # Trường hợp đặc biệt: admin
    if uuid == 'admin':
        return 'admin'
    try:
        # Chỉ lấy trường address để tối ưu
        for user in users_col.find({}, { 'address': 1 }):
            address = user.get('address')
            if not address:
                continue
            if encode_referral_uuid(address) == uuid:
                return address
    except Exception as e:
        print(f"[ERROR] decode_referral_uuid: {e}")
    return None

import random
import time
from ton_utils import send_ton_onchain
import requests
from bson import ObjectId
from pymongo import MongoClient

load_dotenv()
MONGO_URI = os.environ.get('MONGO_URI', '')
DB_NAME = os.environ.get('DB_NAME', 'gacha_game')

app = Flask(__name__)
CORS(app)

# Test endpoint
@app.route('/api/test', methods=['GET'])
def test():
    return jsonify({'status': 'ok', 'message': 'API is working!'})

@app.route('/api/test-daily-ton', methods=['GET'])
def test_daily_ton():
    """Test endpoint để kiểm tra daily TON history API"""
    try:
        address = request.args.get('address', 'test')
        print(f"[TEST] Testing daily TON history for address: {address}")
        
        # Kiểm tra collections
        collections = db.list_collection_names()
        print(f"[TEST] Available collections: {collections}")
        
        # Kiểm tra user
        user = get_user(address) if address != 'test' else None
        print(f"[TEST] User found: {user is not None}")
        
        # Kiểm tra daily_ton_claims collection
        if 'daily_ton_claims' in collections:
            claims_count = db['daily_ton_claims'].count_documents({})
            print(f"[TEST] daily_ton_claims count: {claims_count}")
        else:
            print("[TEST] daily_ton_claims collection does not exist")
        
        # Kiểm tra checkins collection
        if 'checkins' in collections:
            checkins_count = db['checkins'].count_documents({})
            print(f"[TEST] checkins count: {checkins_count}")
        else:
            print("[TEST] checkins collection does not exist")
        
        return jsonify({
            'status': 'ok',
            'message': 'Test completed',
            'collections': collections,
            'user_exists': user is not None,
            'daily_ton_claims_count': db['daily_ton_claims'].count_documents({}) if 'daily_ton_claims' in collections else 0,
            'checkins_count': db['checkins'].count_documents({}) if 'checkins' in collections else 0
        })
        
    except Exception as e:
        print(f"[TEST ERROR] {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

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
    raw_address = data.get('address')
    # Hỗ trợ cả key 'ref' và 'referrer' từ frontend
    referrer_uuid = data.get('referrer') or data.get('ref') or request.args.get('ref')  # Có thể là UUID hoặc wallet address
    
    # Sử dụng raw_address làm address chính (backend sẽ tự xử lý friendly_address)
    address = raw_address
    
    # Nếu referrer là UUID, decode để lấy wallet address
    if referrer_uuid and len(referrer_uuid) == 8:  # UUID có 8 ký tự
        referrer = decode_referral_uuid(referrer_uuid)
    elif referrer_uuid == 'admin':  # Xử lý trường hợp admin
        # Tìm user có address là admin hoặc tạo admin user
        admin_user = users_col.find_one({'address': 'admin'})
        if not admin_user:
            # Tạo admin user nếu chưa có
            users_col.insert_one({
                'address': 'admin',
                'referrer': None,
                'ton_daily': 0,
                'ton_withdrawn': 0,
                'referral_earnings': 0,
                'created_at': int(time.time()),
                'balance': 0
            })
        referrer = 'admin'
    else:
        referrer = referrer_uuid  # Nếu không phải UUID, giữ nguyên
    
    user = create_user(address, referrer)
    return jsonify(convert_objectid(user))

@app.route('/api/resolve-ref', methods=['GET'])
@api_response
def api_resolve_ref():
    """Trả về địa chỉ người giới thiệu từ mã ref (UUID) hoặc địa chỉ trực tiếp.

    Query params:
      - ref hoặc uuid: mã ref 8 ký tự hoặc 'admin' hoặc địa chỉ ví
    """
    ref_param = request.args.get('ref') or request.args.get('uuid')
    if not ref_param:
        return jsonify({'error': 'Missing ref or uuid parameter'}), 400

    # Xử lý giá trị truyền vào
    if ref_param == 'admin':
        ref_address = 'admin'
    elif len(ref_param) == 8:
        ref_address = decode_referral_uuid(ref_param)
    else:
        # Có thể người dùng truyền thẳng địa chỉ ví
        ref_address = ref_param

    if not ref_address:
        return jsonify({'found': False}), 404

    # Thử lấy thông tin user nếu có
    user = get_user(ref_address)
    response = {
        'found': True,
        'address': ref_address,
        'referral_uuid': 'admin' if ref_address == 'admin' else encode_referral_uuid(ref_address),
        'display_address': ref_address
    }
    # Không ép trả toàn bộ user vì có thể nhạy cảm; frontend chỉ cần hiển thị
    return jsonify(convert_objectid(response))

@app.route('/api/user', methods=['GET'])
@api_response
def api_get_user():
    address = request.args.get('address')
    # Nhận ref/uuid từ query để backfill khi user đã tồn tại
    incoming_ref = request.args.get('ref') or request.args.get('referrer')
    
    # Tìm user bằng address gốc (backend sẽ tự xử lý friendly_address)
    user = get_user(address)
    # Backfill referrer nếu có ref trên URL và user chưa có referrer
    if user and incoming_ref and not user.get('referrer'):
        decoded_ref = None
        if incoming_ref == 'admin':
            decoded_ref = 'admin'
        elif len(incoming_ref) == 8:
            decoded_ref = decode_referral_uuid(incoming_ref)
        else:
            decoded_ref = incoming_ref

        # Không cho tự ref
        if decoded_ref and decoded_ref != address:
            try:
                users_col.update_one({'_id': user['_id']}, {'$set': {'referrer': decoded_ref}})
                user = get_user(address)
            except Exception as e:
                print(f"[ERROR] backfill referrer in GET /api/user: {e}")
    if user:
        # Thêm UUID vào response và đồng bộ DB nếu cần
        expected_uuid = encode_referral_uuid(address)
        user['referral_uuid'] = expected_uuid
        user['display_address'] = user.get('friendly_address', address)
        
        try:
            if user.get('referral_uuid') != expected_uuid:
                users_col.update_one({'_id': user['_id']}, {'$set': {'referral_uuid': expected_uuid}})
                user = get_user(address)
                user['referral_uuid'] = expected_uuid
        except Exception as e:
            print(f"[ERROR] sync referral_uuid in GET /api/user: {e}")
        # Nếu có người giới thiệu, thêm referrer_uuid để tiện hiển thị
        try:
            if user.get('referrer'):
                if user['referrer'] == 'admin':
                    user['referrer_uuid'] = 'admin'
                else:
                    user['referrer_uuid'] = encode_referral_uuid(user['referrer'])
        except Exception as e:
            print(f"[ERROR] compute referrer_uuid: {e}")
    return jsonify(convert_objectid(user))

@app.route('/api/referrals', methods=['GET'])
@api_response
def api_get_referrals():
    address = request.args.get('address')
    refs = get_referrals(address)
    
    # Thêm referral_link vào response
    response_data = {
        'referrals': refs,
        'referral_link': None
    }
    
    if address:
        # Lấy user để có referral_uuid
        user = get_user(address)
        if user and user.get('referral_uuid'):
            response_data['referral_link'] = f"https://t.me/LegendballBot/legendball?startapp={user['referral_uuid']}"
    
    return jsonify(convert_objectid(response_data))

@app.route('/api/referral-commissions', methods=['GET'])
@api_response
def api_get_referral_commissions():
    address = request.args.get('address')
    commissions = get_referral_commissions(address)
    return jsonify(convert_objectid(commissions))

@app.route('/api/referral-uuid', methods=['GET'])
@api_response
def api_get_referral_uuid():
    address = request.args.get('address')
    if not address:
        return jsonify({'error': 'Missing address parameter'}), 400

    # Sử dụng address gốc (raw) để tạo UUID, giữ nguyên logic hiện tại
    uuid = encode_referral_uuid(address)
    
    # Lấy user để có friendly_address
    user = get_user(address)
    response_data = {'address': address, 'referral_uuid': uuid}
    if user and user.get('friendly_address'):
        response_data['friendly_address'] = user['friendly_address']

    return jsonify(response_data)

@app.route('/api/referral-link', methods=['GET'])
@api_response
def api_get_referral_link():
    """Tạo referral link hoàn chỉnh cho user"""
    address = request.args.get('address')
    if not address:
        return jsonify({'error': 'Missing address parameter'}), 400

    # Lấy user để có friendly_address và referral_uuid
    user = get_user(address)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    # Tạo referral link
    referral_uuid = user.get('referral_uuid')
    if not referral_uuid:
        # Nếu chưa có referral_uuid, tạo mới
        referral_uuid = encode_referral_uuid(address)
        users_col.update_one({'_id': user['_id']}, {'$set': {'referral_uuid': referral_uuid}})
        user['referral_uuid'] = referral_uuid

    referral_link = f"https://t.me/LegendballBot/legendball?startapp={referral_uuid}"
    
    response_data = {
        'referral_link': referral_link,
        'referral_uuid': referral_uuid,
        'address': address,
        'friendly_address': user.get('friendly_address', address)
    }

    return jsonify(response_data)

@app.route('/api/format-address', methods=['GET'])
@api_response
def api_format_address():
    address = request.args.get('address')
    if not address:
        return jsonify({'error': 'Address parameter is required'}), 400
    
    try:
        # Nếu địa chỉ đã ở dạng user-friendly
        if address.startswith('UQ') or address.startswith('EQ') or address.startswith('0Q'):
            return jsonify({'formatted_address': address})
        
        # Nếu là địa chỉ raw (0:...), chuyển đổi sang user-friendly
        if address.startswith('0:'):
            # Sử dụng API của TON để chuyển đổi
            import requests
            try:
                print(f"[DEBUG] Calling TON API for address: {address}")
                response = requests.get(f'https://toncenter.com/api/v3/addressBook?address={address}')
                print(f"[DEBUG] TON API response status: {response.status_code}")
                
                if response.status_code == 200:
                    data = response.json()
                    print(f"[DEBUG] TON API response data: {data}")
                    
                    if address in data and data[address].get('user_friendly'):
                        user_friendly = data[address]['user_friendly']
                        print(f"[DEBUG] Extracted user-friendly address: {user_friendly}")
                        return jsonify({'formatted_address': user_friendly})
                    else:
                        print(f"[DEBUG] Address not found in response or no user_friendly field")
                else:
                    print(f"[DEBUG] TON API failed with status: {response.status_code}")
                    
            except Exception as api_error:
                print(f"TON API error: {api_error}")
            
            # Fallback: trả về địa chỉ gốc nếu API fail
            print(f"[DEBUG] Using fallback address: {address}")
            return jsonify({'formatted_address': address})
        
        return jsonify({'formatted_address': address})
    except Exception as e:
        print(f"Error formatting address: {e}")
        return jsonify({'formatted_address': address})  # Fallback to original

@app.route('/api/update-user-address', methods=['POST'])
@api_response
def api_update_user_address():
    data = request.json
    raw_address = data.get('raw_address')
    user_friendly_address = data.get('user_friendly_address')
    
    print(f"[DEBUG] Updating user address - Raw: {raw_address}, User-friendly: {user_friendly_address}")
    
    if not raw_address or not user_friendly_address:
        return jsonify({'error': 'Both raw_address and user_friendly_address are required'}), 400
    
    try:
        # Kiểm tra xem user có tồn tại không
        existing_user = users_col.find_one({'address': raw_address})
        print(f"[DEBUG] Existing user: {existing_user}")
        
        if existing_user:
            # Cập nhật user trong database với user-friendly address
            result = users_col.update_one(
                {'address': raw_address},
                {'$set': {'user_friendly_address': user_friendly_address}}
            )
            
            print(f"[DEBUG] Update result - Modified count: {result.modified_count}")
            
            if result.modified_count > 0:
                return jsonify({'status': 'success', 'message': 'User address updated successfully'})
            else:
                return jsonify({'status': 'success', 'message': 'User found but no changes made'})
        else:
            # Nếu user chưa tồn tại, tạo mới với user-friendly address
            print(f"[DEBUG] User not found, creating new user with user-friendly address")
            new_user = {
                'address': raw_address,
                'user_friendly_address': user_friendly_address,
                'balance': 0,
                'ton_daily': 0,
                'total_withdrawn': 0,
                'created_at': int(time.time())
            }
            result = users_col.insert_one(new_user)
            print(f"[DEBUG] Created new user with ID: {result.inserted_id}")
            return jsonify({'status': 'success', 'message': 'New user created with user-friendly address'})
            
    except Exception as e:
        print(f"Error updating user address: {e}")
        return jsonify({'error': f'Failed to update user address: {str(e)}'}), 500

@app.route('/api/deposit', methods=['POST'])
@api_response
def api_deposit():
    data = request.json

    address = data.get('address')  # Sử dụng address gốc từ frontend
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
    address = data.get('address')  # Sử dụng address gốc từ frontend
    amount = float(data.get('amount'))
    
    try:
        # Kiểm tra số dư trước khi rút
        user = get_user(address)
        
        if not user or user.get('balance', 0) < amount:
            return jsonify({'error': 'Không đủ TON để rút'}), 400
        
        # Tạo bản ghi withdraw với status pending và trừ balance ngay
        tx = add_transaction(address, 'withdraw', amount, status='pending')
        decrease_balance(address, amount)
        
        return jsonify({'status': 'success', 'message': 'Withdraw request created successfully'})
        
    except Exception as e:
        print(f"Withdraw error: {e}")
        return jsonify({'error': f'Withdraw failed: {str(e)}'}), 500

@app.route('/api/transactions', methods=['GET'])
@api_response
def api_get_transactions():
    address = request.args.get('address')  # Sử dụng address gốc từ frontend
    
    txs = get_transactions(address)
    return jsonify(convert_objectid(txs))

@app.route('/api/open-history', methods=['GET'])
@api_response
def api_get_open_history():
    address = request.args.get('address')  # Sử dụng address gốc từ frontend
    
    history = get_open_history(address)
    return jsonify(convert_objectid(history))

@app.route('/api/open-chest', methods=['POST'])
@api_response
def open_chest():
    data = request.json
    address = data.get('address')  # Sử dụng address gốc từ frontend
    chest_type = data.get('chest_type')
    

    # Lấy danh sách player card theo chest_type từ DB
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
    add_card(address, selected.get('rarity', ''), chest_type, selected.get('reward', 0), timestamp, price)
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
    address = request.args.get('address')  # Sử dụng address gốc từ frontend
    
    result = get_collection(address)
    return jsonify(convert_objectid(result))

@app.route('/api/history', methods=['GET'])
@api_response
def history():
    address = request.args.get('address')  # Sử dụng address gốc từ frontend
    
    result = get_history(address)
    return jsonify(convert_objectid(result))


TOKEN = "8491577098:AAEVnbn6DFVKz5v3CHTFdQFiCv8LIYvKnDI"
URL = f"https://api.telegram.org/bot{TOKEN}"
@app.route('/api/lgball-telebot', methods=['GET' , 'POST'])
@api_response
def webhook():
    data = request.get_json()

    if "message" in data:
        chat_id = data["message"]["chat"]["id"]

        message = (
            "🌟 Welcome to *Legendball*!\n\n"
            "🕹️ A brand new P2E experience awaits you.\n"
            "🚀 Click the button below to start the game!"
        )

        keyboard = {
            "inline_keyboard": [
                [
                    {
                        "text": "🎮 Start Game",
                        "web_app": {
                            "url": "https://t.me/LegendballBot/legendball"
                        }
                    }
                        ]
            ]
        }

        payload = {
            "chat_id": chat_id,
            "text": message,
            "parse_mode": "Markdown",
            "reply_markup": keyboard
        }

        requests.post(f"{URL}/sendMessage", json=payload)

    return f"oke", 200

# Checkin system
@app.route('/api/checkin', methods=['POST'])
@api_response
def checkin():
    """API để user checkin hàng ngày - mỗi ngày một lần"""
    try:
        data = request.json
        address = data.get('address')
        
        print(f"[DEBUG] checkin called with address: {address}")
        
        if not address:
            return jsonify({'error': 'Address is required'}), 400
        
        # Kiểm tra user có tồn tại không
        user = get_user(address)
        if not user:
            print(f"[DEBUG] User not found for address: {address}")
            return jsonify({'error': 'User not found'}), 404
        
        print(f"[DEBUG] User found: {user.get('address')}")
        
        # Thực hiện checkin
        checkin_result, message = add_checkin(address)
        
        if checkin_result is None:
            print(f"[DEBUG] Checkin failed: {message}")
            return jsonify({'error': message, 'ok': False}), 400
        
        print(f"[DEBUG] Checkin successful: {checkin_result}")
        
        # Lấy thông tin user cập nhật
        updated_user = get_user(address)
        
        # Lấy thông tin từ collection
        collection = updated_user.get('collection', {})
        checkin_day = collection.get('checkin_day', 1)
        last_checkin_date = collection.get('last_checkin_date', '')
        total_ball = collection.get('ball', 0)
        
        print(f"[DEBUG] Updated user info - checkin_day: {checkin_day}, total_ball: {total_ball}")
        
        return jsonify({
            'ok': True,
            'message': message,
            'checkin_day': checkin_day,
            'last_checkin_date': last_checkin_date,
            'ball_added': checkin_result['reward'],
            'total_ball': total_ball
        })
        
    except Exception as e:
        print(f"[ERROR] Error in checkin API: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Internal server error', 'message': str(e)}), 500

@app.route('/api/checkin-history', methods=['GET'])
@api_response
def checkin_history():
    """API để lấy lịch sử checkin của user"""
    try:
        address = request.args.get('address')
        
        if not address:
            return jsonify({'error': 'Address parameter is required'}), 400
        
        # Kiểm tra user có tồn tại không
        user = get_user(address)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Lấy lịch sử checkin
        checkins = get_checkin_history(address)
        
        # Chuyển đổi format cho frontend
        formatted_checkins = []
        for checkin in checkins:
            try:
                # Sử dụng week_day đã được tính toán trong get_checkin_history
                if 'week_day' in checkin:
                    day = checkin['week_day']
                else:
                    # Fallback: tính toán ngày trong tuần (1-7) dựa trên thứ 2 của tuần
                    checkin_time = checkin['timestamp']
                    checkin_date = datetime.utcfromtimestamp(checkin_time)
                    
                    # Tính thứ 2 của tuần chứa checkin này
                    monday = checkin_date - timedelta(days=checkin_date.weekday())
                    monday_start = int(monday.replace(hour=0, minute=0, second=0, microsecond=0).timestamp())
                    
                    # Tính ngày trong tuần (1-7, với 1 = thứ 2)
                    days_since_monday = (checkin_time - monday_start) // 86400
                    day = days_since_monday + 1
                
                formatted_checkins.append({
                    'day': day,
                    'ball_added': checkin['reward'],
                    'timestamp': checkin['timestamp']
                })
            except (KeyError, TypeError, ValueError) as e:
                print(f"Error processing checkin: {e}, checkin data: {checkin}")
                continue
        
        # Sắp xếp theo thời gian mới nhất
        formatted_checkins.sort(key=lambda x: x['timestamp'], reverse=True)
        
        return jsonify(formatted_checkins)
        
    except Exception as e:
        print(f"Error in checkin_history API: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Internal server error', 'message': str(e)}), 500

@app.route('/api/daily-ton-history', methods=['GET'])
@api_response
def daily_ton_history():
    """API để lấy lịch sử daily TON của user"""
    try:
        address = request.args.get('address')
        
        if not address:
            return jsonify({'error': 'Address parameter is required'}), 400
        
        # Kiểm tra user có tồn tại không
        user = get_user(address)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Lấy lịch sử checkin
        checkins = get_checkin_history(address, limit=100)
        
        # Lấy daily TON claims nếu có
        daily_ton_claims = []
        try:
            if 'daily_ton_claims' in db.list_collection_names():
                daily_ton_claims = list(db['daily_ton_claims'].find({'address': address}).sort('timestamp', -1))
        except Exception as e:
            print(f"Error accessing daily_ton_claims collection: {e}")
            daily_ton_claims = []
        
        # Chuyển đổi format cho frontend
        formatted_history = []
        
        # Thêm checkin rewards (1 ball = 0.001 TON)
        for checkin in checkins:
            try:
                if 'reward' in checkin and 'timestamp' in checkin:
                    formatted_history.append({
                        'ton_added': float(checkin['reward']) / 1000,  # Chuyển từ ball sang TON (1 ball = 0.001 TON)
                        'timestamp': checkin['timestamp'],
                        'type': 'checkin'
                    })
            except (KeyError, TypeError, ValueError) as e:
                print(f"Error processing checkin: {e}, checkin data: {checkin}")
                continue
        
        # Thêm daily TON claims
        for claim in daily_ton_claims:
            try:
                if 'ton_added' in claim and 'timestamp' in claim:
                    formatted_history.append({
                        'ton_added': float(claim['ton_added']),
                        'timestamp': claim['timestamp'],
                        'type': 'daily_claim'
                    })
            except (KeyError, TypeError, ValueError) as e:
                print(f"Error processing claim: {e}, claim data: {claim}")
                continue
        
        # Sắp xếp theo thời gian mới nhất
        formatted_history.sort(key=lambda x: x['timestamp'], reverse=True)
        
        return jsonify(formatted_history)
        
    except Exception as e:
        print(f"Error in daily_ton_history API: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Internal server error', 'message': str(e)}), 500

@app.route('/api/claim-daily-ton', methods=['POST'])
@api_response
def claim_daily_ton():
    """API để user claim daily TON reward - mỗi ngày một lần"""
    try:
        data = request.json
        address = data.get('address')
        
        print(f"[DEBUG] claim_daily_ton called with address: {address}")
        
        if not address:
            return jsonify({'error': 'Address is required'}), 400
        
        # Kiểm tra user có tồn tại không
        user = get_user(address)
        if not user:
            print(f"[DEBUG] User not found for address: {address}")
            return jsonify({'error': 'User not found'}), 404
        
        print(f"[DEBUG] User found: {user.get('address')}, ton_daily: {user.get('ton_daily', 0)}")
        
        # Kiểm tra xem user đã claim TON hôm nay chưa
        current_time = int(time.time())
        today_start = current_time - (current_time % 86400)  # 00:00:00 hôm nay
        today_end = today_start + 86400  # 23:59:59 hôm nay
        
        print(f"[DEBUG] Current time: {current_time}, today_start: {today_start}, today_end: {today_end}")
        
        # Tạo collection daily_ton_claims nếu chưa có
        try:
            if 'daily_ton_claims' not in db.list_collection_names():
                print("[DEBUG] Creating daily_ton_claims collection")
                db.create_collection('daily_ton_claims')
                print("[DEBUG] daily_ton_claims collection created successfully")
            else:
                print("[DEBUG] daily_ton_claims collection already exists")
        except Exception as e:
            print(f"[ERROR] Error creating daily_ton_claims collection: {e}")
            return jsonify({'error': 'Database error'}), 500
        
        # Kiểm tra xem đã claim hôm nay chưa
        try:
            existing_claim = db['daily_ton_claims'].find_one({
                'address': address,
                'timestamp': {'$gte': today_start, '$lt': today_end}
            })
            
            if existing_claim:
                print(f"[DEBUG] User already claimed today: {existing_claim}")
                return jsonify({'error': 'Đã claim TON hôm nay', 'ok': False}), 400
                
            print("[DEBUG] No existing claim found for today")
        except Exception as e:
            print(f"[ERROR] Error checking existing claim: {e}")
            return jsonify({'error': 'Database error'}), 500
        
        # Tính daily TON reward (dựa trên ton_daily của user)
        # Logic: 10% của ton_daily, tối thiểu 0.1 TON
        user_ton_daily = user.get('ton_daily', 0)
        daily_ton_reward = max(0.1, user_ton_daily * 0.1)  # Tối thiểu 0.1 TON
        
        print(f"[DEBUG] user_ton_daily: {user_ton_daily}, daily_ton_reward: {daily_ton_reward}")
        
        # Lưu claim record
        claim_record = {
            'address': address,
            'ton_added': daily_ton_reward,
            'timestamp': current_time,
            'user_ton_daily': user_ton_daily
        }
        
        print(f"[DEBUG] Claim record to insert: {claim_record}")
        
        try:
            result = db['daily_ton_claims'].insert_one(claim_record)
            print(f"[DEBUG] Claim record inserted with ID: {result.inserted_id}")
            claim_record['_id'] = result.inserted_id
        except Exception as e:
            print(f"[ERROR] Error inserting claim record: {e}")
            return jsonify({'error': 'Database error'}), 500
        
        # Cập nhật balance của user
        try:
            update_result = users_col.update_one(
                {'address': address},
                {'$inc': {'balance': daily_ton_reward}}
            )
            print(f"[DEBUG] Balance update result: {update_result.modified_count} documents modified")
        except Exception as e:
            print(f"[ERROR] Error updating user balance: {e}")
            # Rollback claim record nếu update balance thất bại
            try:
                db['daily_ton_claims'].delete_one({'_id': claim_record['_id']})
                print("[DEBUG] Claim record rolled back due to balance update failure")
            except:
                print("[ERROR] Failed to rollback claim record")
            return jsonify({'error': 'Database error'}), 500
        
        print(f"[DEBUG] Claim daily TON successful for {address}: {daily_ton_reward} TON")
        
        return jsonify({
            'ok': True,
            'message': 'Claim daily TON thành công',
            'ton_added': daily_ton_reward,
            'user_ton_daily': user_ton_daily
        })
        
    except Exception as e:
        print(f"[ERROR] Error in claim_daily_ton API: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Internal server error', 'message': str(e)}), 500

# Vercel serverless function handler
def handler(request, context):
    return app(request, context)

# For local development
if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True) 