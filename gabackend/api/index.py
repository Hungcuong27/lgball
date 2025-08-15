from flask import Flask, request, jsonify
from flask_cors import CORS
import sys
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta

from models import add_card, get_collection, get_history, create_user, get_user, get_referrals, add_transaction, get_transactions, add_open_history, get_open_history, increase_balance, decrease_balance, get_referral_commissions, users_col, encode_referral_uuid, add_checkin, get_checkin_history, get_daily_ton_history, db

# Function to decode UUID back to wallet address
def decode_referral_uuid(uuid_str):
    """Decode referral UUID to get wallet address.
    This function searches for a user in the current user set
    with the value encode_referral_uuid(address).
    """
    try:
        # Only get address field for optimization
        for user in users_col.find({}, { 'address': 1 }):
            address = user.get('address')
            if address and encode_referral_uuid(address) == uuid_str:
                return address
        return None
    except Exception as e:
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
    """Test endpoint to check daily TON history API"""
    address = request.args.get('address', 'test')
    
    # Check user
    user = get_user(address) if address != 'test' else None
    
    # Check collections
    collections = db.list_collection_names()
    
    # Check checkin_history collection
    if 'checkin_history' in collections:
        checkin_count = db['checkin_history'].count_documents({})
    else:
        checkin_count = 0
    
    # Check daily_ton_history collection
    if 'daily_ton_history' in collections:
        ton_count = db['daily_ton_history'].count_documents({})
    else:
        ton_count = 0
    
    return jsonify({
        'status': 'ok',
        'address': address,
        'user_exists': user is not None,
        'checkin_history_count': db['checkin_history'].count_documents({}) if 'checkin_history' in collections else 0,
        'daily_ton_history_count': db['daily_ton_history'].count_documents({}) if 'daily_ton_history' in collections else 0
    })

def api_response(func):
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except Exception as e:
            return jsonify({'error': 'Internal server error'}), 500
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
    data = request.get_json()
    address = data.get('address')
    
    # Support both 'ref' and 'referrer' keys from frontend
    referrer_uuid = data.get('referrer') or data.get('ref') or request.args.get('ref')  # Could be UUID or wallet address
    
    if not address:
        return jsonify({'error': 'Address is required'}), 400
    
    # If referrer is UUID, decode to get wallet address
    if referrer_uuid and len(referrer_uuid) == 8:  # UUID has 8 characters
        referrer = decode_referral_uuid(referrer_uuid)
    else:
        # Find admin user or create admin user
        admin_user = users_col.find_one({'address': 'admin'})
        if not admin_user:
            # Create admin user if not exists
            users_col.insert_one({
                'address': 'admin',
                'ton_daily': 0,
                'ton_withdrawn': 0,
                'referral_earnings': 0,
                'collection': {'Legend': 0, 'Epic': 0, 'Rare': 0, 'Common': 0, 'ball': 0},
                'checkin_day': 1,
                'last_checkin_date': '',
                'referral_uuid': encode_referral_uuid('admin'),
                'friendly_address': 'admin'
            })
        referrer = referrer_uuid  # If not UUID, keep as is
    
    user = create_user(address, referrer)
    return jsonify(convert_objectid(user))

@app.route('/api/resolve-ref', methods=['GET'])
@api_response
def api_resolve_ref():
    """Return referrer address from ref code (UUID) or direct address.
    If ref is UUID, decode and return wallet address.
    If ref is already wallet address, return as is.
    """
    ref = request.args.get('ref')
    if not ref:
        return jsonify({'error': 'Ref parameter is required'}), 400
    
    # Try to decode if it's UUID
    if len(ref) == 8:
        try:
            ref_address = decode_referral_uuid(ref)
            if ref_address:
                # Try to get user info if available
                user = get_user(ref_address)
                if user:
                    return jsonify({
                        'ref': ref,
                        'address': ref_address,
                        'friendly_address': user.get('friendly_address', ref_address)
                    })
                else:
                    return jsonify({
                        'ref': ref,
                        'address': ref_address,
                        'friendly_address': ref_address
                    })
            else:
                return jsonify({'error': 'Invalid ref code'}), 400
        except Exception as e:
            return jsonify({'error': 'Invalid ref code'}), 400
    
    # User might pass wallet address directly
    if ref.startswith('0:') or ref.startswith('EQ'):
        # Try to get user info if available
        user = get_user(ref)
        if user:
            return jsonify({
                'ref': ref,
                'address': ref,
                'friendly_address': user.get('friendly_address', ref)
            })
        else:
            return jsonify({
                'ref': ref,
                'address': ref,
                'friendly_address': ref
            })
    
    return jsonify({'error': 'Invalid ref format'}), 400

@app.route('/api/user', methods=['GET'])
@api_response
def api_get_user():
    address = request.args.get('address')
    
    # Receive ref/uuid from query to backfill when user already exists
    ref_uuid = request.args.get('ref') or request.args.get('uuid')
    
    # Find user by original address (backend will handle friendly_address automatically)
    user = get_user(address)
    
    # If user does not exist, create new
    if not user:
        user = create_user(address, ref_uuid)
    
    # Backfill referrer if there is a ref on the URL and the user does not have a referrer
    if user and ref_uuid and not user.get('referrer'):
        decoded_ref = None
        if ref_uuid == 'admin':
            decoded_ref = 'admin'
        elif len(ref_uuid) == 8:
            decoded_ref = decode_referral_uuid(ref_uuid)
        else:
            decoded_ref = ref_uuid

        # Do not allow self-referral
        if decoded_ref and decoded_ref != address:
            try:
                users_col.update_one(
                    {'address': address},
                    {'$set': {'referrer': decoded_ref}}
                )
                user['referrer'] = decoded_ref
            except Exception as e:
                # Error backfilling referrer
                pass
    
    if user:
        # Ensure collection has all necessary information
        if 'collection' not in user:
            user['collection'] = {
                'ball': 0,
                'checkin_day': 1,
                'last_checkin_date': '',
                'Legend': 0,
                'Epic': 0,
                'Rare': 0,
                'Common': 0
            }
        else:
            # Ensure necessary fields have default values
            if 'ball' not in user['collection']:
                user['collection']['ball'] = 0
            if 'checkin_day' not in user['collection']:
                user['collection']['checkin_day'] = 1
            if 'last_checkin_date' not in user['collection']:
                user['collection']['last_checkin_date'] = ''
        
        # Add UUID to response and sync DB if needed
        expected_uuid = encode_referral_uuid(address)
        user['referral_uuid'] = expected_uuid
        
        # Sync referral_uuid in DB if different
        if user.get('referral_uuid') != expected_uuid:
            try:
                users_col.update_one(
                    {'address': address},
                    {'$set': {'referral_uuid': expected_uuid}}
                )
            except Exception as e:
                # Error syncing referral_uuid
                pass
        
        # If there is a referrer, add referrer_uuid for display
        try:
            if user.get('referrer'):
                referrer_user = get_user(user['referrer'])
                if referrer_user and referrer_user.get('referral_uuid'):
                    user['referrer_uuid'] = referrer_user['referral_uuid']
        except Exception as e:
            # Error computing referrer_uuid
            pass
    return jsonify(convert_objectid(user))

@app.route('/api/referrals', methods=['GET'])
@api_response
def api_get_referrals():
    address = request.args.get('address')
    refs = get_referrals(address)
    
    # Add referral_link to response
    response_data = {
        'referrals': refs,
        'referral_link': None
    }
    
    if address:
        # Get user to have referral_uuid
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

    # Use original address (raw) to create UUID, keep current logic
    uuid = encode_referral_uuid(address)
    
    # Get user to have friendly_address
    user = get_user(address)
    response_data = {'address': address, 'referral_uuid': uuid}
    if user and user.get('friendly_address'):
        response_data['friendly_address'] = user['friendly_address']

    return jsonify(response_data)

@app.route('/api/referral-link', methods=['GET'])
@api_response
def api_get_referral_link():
    """Create a complete referral link for the user"""
    address = request.args.get('address')
    if not address:
        return jsonify({'error': 'Missing address parameter'}), 400

    # Get user to have friendly_address and referral_uuid
    user = get_user(address)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    # Create referral link
    referral_uuid = user.get('referral_uuid')
    if not referral_uuid:
        # If no referral_uuid, create new
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
        # If address is already user-friendly
        if address.startswith('UQ') or address.startswith('EQ') or address.startswith('0Q'):
            return jsonify({'formatted_address': address})
        
        # If it's a raw address (0:...), convert to user-friendly
        if address.startswith('0:'):
            # Use TON API to convert
            import requests
            try:
                response = requests.get(f'https://toncenter.com/api/v3/addressBook?address={address}')
                if response.status_code == 200:
                    data = response.json()
                    if data.get('ok') and address in data:
                        user_friendly = data[address].get('user_friendly')
                        if user_friendly:
                            return jsonify({'formatted_address': user_friendly})
                    else:
                        # TON API failed
                        pass
            except Exception as e:
                # Error formatting address
                pass
            
            # Fallback: return original address if API fails
            return jsonify({'formatted_address': address})
        
        return jsonify({'formatted_address': address})
    except Exception as e:
        # Error formatting address
        return jsonify({'formatted_address': address})  # Fallback to original

@app.route('/api/update-user-address', methods=['POST'])
@api_response
def api_update_user_address():
    data = request.json
    raw_address = data.get('raw_address')
    user_friendly_address = data.get('user_friendly_address')
    
    if not raw_address or not user_friendly_address:
        return jsonify({'error': 'Both raw_address and user_friendly_address are required'}), 400
    
    try:
        # Check if user exists
        existing_user = users_col.find_one({'address': raw_address})
        
        if existing_user:
            # Update user in database with user-friendly address
            result = users_col.update_one(
                {'address': raw_address},
                {'$set': {'friendly_address': user_friendly_address}}
            )
            
            if result.modified_count > 0:
                return jsonify({'status': 'success', 'message': 'User updated successfully'})
            else:
                return jsonify({'status': 'success', 'message': 'User found but no changes made'})
        else:
            # If user does not exist, create new with user-friendly address
            new_user = {
                'address': raw_address,
                'friendly_address': user_friendly_address,
                'ton_daily': 0,
                'ton_withdrawn': 0,
                'referral_earnings': 0,
                'collection': {'Legend': 0, 'Epic': 0, 'Rare': 0, 'Common': 0, 'ball': 0},
                'checkin_day': 1,
                'last_checkin_date': '',
                'referral_uuid': encode_referral_uuid(raw_address),
                'created_at': int(time.time()),
                'balance': 0
            }
            
            result = users_col.insert_one(new_user)
            return jsonify({'status': 'success', 'message': 'User created successfully'})
            
    except Exception as e:
        return jsonify({'error': 'Error updating user address'}), 500

@app.route('/api/deposit', methods=['POST'])
@api_response
def api_deposit():
    data = request.json

    address = data.get('address')  # Use original address from frontend
    amount = float(data.get('amount'))
    tx_hash = data.get('tx_hash')
    if not tx_hash:
        return jsonify({'error': 'Missing transaction hash (tx_hash)'}), 400
    
    # Bypass blockchain verification, just save to DB
    tx = add_transaction(address, 'deposit', amount, status='success' , real_status='success' )
    increase_balance(address, amount)
    return jsonify(tx)

@app.route('/api/withdraw', methods=['POST'])
@api_response
def api_withdraw():
    data = request.json
    address = data.get('address')  # Use original address from frontend
    amount = float(data.get('amount'))
    
    try:
        # Check balance before withdrawal
        user = get_user(address)
        
        if not user or user.get('balance', 0) < amount:
            return jsonify({'error': 'Not enough TON to withdraw'}), 400
        
        # Create withdraw record with pending status and deduct balance immediately
        add_transaction(address, 'withdraw', amount, status='success' , real_status='pending')

        decrease_balance(address, amount)
        
        # Always return success since withdrawal is handled manually
        return jsonify({
            'success': True,
            'message': 'Withdrawal successful!'
            # 'transaction': tx
        })
        
    except Exception as e:
        return jsonify({'error': 'Withdrawal failed'}), 500

@app.route('/api/transactions', methods=['GET'])
@api_response
def api_get_transactions():
    address = request.args.get('address')  # Use original address from frontend
    
    txs = get_transactions(address)
    return jsonify(convert_objectid(txs))

@app.route('/api/open-history', methods=['GET'])
@api_response
def api_get_open_history():
    address = request.args.get('address')  # Use original address from frontend
    
    # Get open history and limit to 20 most recent
    history = get_open_history(address)
    
    # Format history for frontend
    formatted_history = []
    
    # Add open history entries only
    for entry in history:
        formatted_history.append({
            'type': 'ball_opening',
            'player_card': entry.get('player_card', ''),
            'card_type': entry.get('ball_type', ''),
            'ton_reward': entry.get('ton_added', 0),  # Sử dụng ton_added từ DB
            'timestamp': entry.get('timestamp', 0),
            'date': datetime.utcfromtimestamp(entry.get('timestamp', 0)).strftime('%Y-%m-%d %H:%M:%S')
        })
    
    # Sort by timestamp (newest first) and limit to 20
    formatted_history.sort(key=lambda x: x['timestamp'], reverse=True)
    formatted_history = formatted_history[:20]
    
    return jsonify(convert_objectid(formatted_history))

@app.route('/api/open-chest', methods=['POST'])
@api_response
def open_chest():
    data = request.json
    address = data.get('address')  # Use original address from frontend
    chest_type = data.get('chest_type')
    

    # Get player card list by chest_type from DB
    player_cards_col = db['player_cards']
    cards = list(player_cards_col.find({'ball_type': chest_type}))
    if not cards:
        return jsonify({'error': 'No player cards found for this chest type'}), 400
    # Randomize by rate
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
    # Get user and check balance
    user = get_user(address)
    price = selected.get('price', 0.5)
    

    
    if not user or user.get('balance', 0) < price:
        return jsonify({'error': 'Not enough TON to open chest'}), 400
    decrease_balance(address, price)
    # Save history
    add_card(address, selected.get('rarity', ''), chest_type, selected.get('reward', 0), timestamp, price)
    add_open_history(address, chest_type, selected.get('name', ''), selected.get('reward', 0))
    
    # Get updated user info to show new ton_daily
    updated_user = get_user(address)
    
    return jsonify({
        'player_card': selected.get('name', ''),
        'image': selected.get('image', ''),
        'card_type': selected.get('rarity', ''),
        'reward': selected.get('reward', 0),
        'timestamp': timestamp,
        'new_ton_daily': updated_user.get('ton_daily', 0)  # Trả về ton_daily mới
    })

@app.route('/api/collection', methods=['GET'])
@api_response
def collection():
    address = request.args.get('address')  # Use original address from frontend
    
    result = get_collection(address)
    return jsonify(convert_objectid(result))

@app.route('/api/history', methods=['GET'])
@api_response
def history():
    address = request.args.get('address')  # Use original address from frontend
    
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
            "⚽️ Legendary Ball – a next-gen gacha game built on the TON Blockchain 🚀!\n"
            "Win matches, climb the ranks 🏆, and earn real cryptocurrency rewards 💎💰\n\n"
            "🚀 Click the button below to start the game!"
        )

        keyboard = {
            "inline_keyboard": [
                [
                    {
                        "text": "🎮 Start Game",
                        
                        "url": "https://t.me/LegendballBot/legendball"
                        
                    },
                    {
                        "text": "👥 Group chat",
                        "url": "https://t.me/+y_UbYXByP05kZjBl"
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
    """API to handle user check-in"""
    data = request.get_json()
    address = data.get('address')
    
    if not address:
        return jsonify({'error': 'Address is required'}), 400
    
    try:
        checkin_result, message = add_checkin(address)
        if checkin_result:
            # Get updated user info
            updated_user = get_user(address)
            
            # Get current checkin status
            from models import get_checkin_status
            status = get_checkin_status(address)
            
            response_data = {
                'ok': True,
                'success': True,
                'message': message,
                'checkin_result': checkin_result,
                'updated_user': updated_user,
                'checkin_day': status.get('current_day', 1),
                'last_checkin_date': status.get('last_checkin_date', ''),
                'ball_added': checkin_result.get('ball_added', 0),
                'total_ball': status.get('total_ball', 0)
            }
            
            return jsonify(convert_objectid(response_data))
        else:
            response_data = {
                'ok': False,
                'success': False,
                'message': message
            }
            
            return jsonify(convert_objectid(response_data))
    except Exception as e:

        response_data = {
            'ok': False,
            'success': False,
            'message': 'Check-in failed'
        }
        
        return jsonify(convert_objectid(response_data)), 500

@app.route('/api/checkin-history', methods=['GET'])
@api_response
def checkin_history():
    """API to get user checkin history from checkin_history collection"""
    address = request.args.get('address')
    
    if not address:
        return jsonify({'error': 'Address is required'}), 400
    
    try:
        # Check if user already checked in today
        from datetime import datetime
        import time
        
        current_time = int(time.time())
        now = datetime.utcnow()
        today_start = int(now.replace(hour=0, minute=0, second=0, microsecond=0).timestamp())
        today_end = today_start + 86400
        

        
        checkin_claimed_today = False
        try:
            existing_checkin = db['checkin_history'].find_one({
                'address': address,
                'timestamp': {'$gte': today_start, '$lt': today_end}
            })
            checkin_claimed_today = existing_checkin is not None
        except Exception as e:
            # Error checking today's checkin
            pass
        
        # Get checkin history
        checkin_history = []
        try:
            if 'checkin_history' in db.list_collection_names():
                raw_history = list(db['checkin_history'].find({'address': address}).sort('timestamp', -1))
                
                # Convert ObjectId to string for JSON serialization
                for record in raw_history:
                    record['_id'] = str(record['_id'])
                checkin_history = raw_history
            else:
                pass
        except Exception as e:
            # Error accessing checkin_history collection
            pass
        
        # Format history for frontend
        formatted_history = []
        for checkin in checkin_history:
            try:
                formatted_history.append({
                    'type': 'checkin',
                    'ball_added': checkin.get('ball_added', 0),
                    'timestamp': checkin.get('timestamp', 0),
                    'date': datetime.utcfromtimestamp(checkin.get('timestamp', 0)).strftime('%Y-%m-%d %H:%M:%S')
                })
            except Exception as e:
                # Error processing checkin
                continue
        
        response_data = {
            'history': formatted_history,
            'checkin_claimed_today': checkin_claimed_today
        }
        
        return jsonify(convert_objectid(response_data))
        
    except Exception as e:
        return jsonify({
            'error': 'Failed to get checkin history'
        }), 500

@app.route('/api/checkin-status', methods=['GET'])
@api_response
def checkin_status():
    """API to get current checkin status for a user"""
    address = request.args.get('address')
    
    if not address:
        return jsonify({'error': 'Address is required'}), 400
    
    try:
        # Import models functions
        from models import get_checkin_status, get_user
        
        # Get checkin status
        status = get_checkin_status(address)
        
        # Add user info if available
        user = get_user(address)
        if user and user.get('collection'):
            status['user_ball'] = user.get('collection', {}).get('ball', 0)
            status['user_checkin_day'] = user.get('collection', {}).get('checkin_day', 1)
            status['user_last_checkin_date'] = user.get('collection', {}).get('last_checkin_date', '')
        
        return jsonify(convert_objectid(status))
        
    except Exception as e:

        return jsonify({
            'error': 'Failed to get checkin status'
        }), 500

@app.route('/api/ton-checkin-status', methods=['GET'])
@api_response
def ton_checkin_status():
    """API to get current TON checkin status for a user"""
    address = request.args.get('address')
    
    if not address:
        return jsonify({'error': 'Address is required'}), 400
    
    try:
        # Import models functions
        from models import get_ton_checkin_status
        
        # Get TON checkin status
        status = get_ton_checkin_status(address)
        
        return jsonify(convert_objectid(status))
        
    except Exception as e:

        return jsonify({
            'error': 'Failed to get TON checkin status'
        }), 500

@app.route('/api/daily-ton-history', methods=['GET'])
@api_response
def daily_ton_history():
    """API to get user daily TON history ONLY from daily_ton_history table"""
    address = request.args.get('address')
    
    if not address:
        return jsonify({'error': 'Address is required'}), 400
    
    try:
        # Check if user already claimed TON today
        from datetime import datetime
        
        now = datetime.utcnow()
        today_start = int(now.replace(hour=0, minute=0, second=0, microsecond=0).timestamp())
        today_end = today_start + 86400
        
        ton_claimed_today = False
        try:
            existing_claim = db['daily_ton_history'].find_one({
                'address': address,
                'timestamp': {'$gte': today_start, '$lt': today_end}
            })
            ton_claimed_today = existing_claim is not None
        except Exception as e:
            # Error checking today's TON claim
            pass
        
        # Get daily TON history using models function (already formatted)
        from models import get_daily_ton_history
        daily_ton_history = get_daily_ton_history(address)
        
        # Format TON history for frontend (ONLY TON, no ball checkin)
        formatted_history = []
        
        # Add TON claim entries ONLY
        for ton_record in daily_ton_history:
            try:
                ton_amount = ton_record.get('ton_amount', 0)
                
                formatted_history.append({
                    'type': 'daily_ton',
                    'ton_added': ton_amount,  # Use ton_amount (already formatted)
                    'timestamp': ton_record.get('timestamp', 0),
                    'date': datetime.utcfromtimestamp(ton_record.get('timestamp', 0)).strftime('%Y-%m-%d %H:%M:%S')
                })
            except Exception as e:
                # Error processing ton record
                continue
        
        # Sort by timestamp (newest first)
        formatted_history.sort(key=lambda x: x['timestamp'], reverse=True)
        
        return jsonify({
            'history': formatted_history,
            'ton_claimed_today': ton_claimed_today
        })
        
    except Exception as e:
        return jsonify({
            'error': 'Failed to get daily TON history'
        }), 500

@app.route('/api/claim-daily-ton', methods=['POST'])
@api_response
def claim_daily_ton():
    """API to claim daily TON reward"""
    data = request.get_json()
    address = data.get('address')
    
    if not address:
        return jsonify({'error': 'Address is required'}), 400
    
    try:
        # Get user info
        user = get_user(address)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Check if user already claimed today
        from datetime import datetime
        import time
        
        current_time = int(time.time())
        now = datetime.utcnow()
        today_start = int(now.replace(hour=0, minute=0, second=0, microsecond=0).timestamp())
        today_end = today_start + 86400
        
        # Create daily_ton_history collection if it doesn't exist
        try:
            if 'daily_ton_history' not in db.list_collection_names():
                db.create_collection('daily_ton_history')
        except Exception as e:
            # Collection creation error
            pass
        
        existing_claim = db['daily_ton_history'].find_one({
            'address': address,
            'timestamp': {'$gte': today_start, '$lt': today_end}
        })
        
        if existing_claim:
            return jsonify({
                'error': 'Already claimed today',
                'ton_added': 0
            }), 400
        
        # Calculate daily TON reward
        user_ton_daily = user.get('ton_daily', 0)
        daily_ton_reward = max(0.1, user_ton_daily * 0.1)
        
        # Create claim record
        claim_record = {
            'address': address,
            'ton_added': daily_ton_reward,
            'timestamp': current_time,
            'type': 'daily_claim'
        }
        
        # Insert claim record
        result = db['daily_ton_history'].insert_one(claim_record)
        
        if result.inserted_id:
            # Update user balance
            try:
                users_col.update_one(
                    {'address': address},
                    {'$inc': {'balance': daily_ton_reward}}
                )
            except Exception as e:
                # Error updating user balance
                pass
            
            return jsonify({
                'success': True,
                'message': 'Daily TON claimed successfully',
                'ton_added': daily_ton_reward,
                'user_ton_daily': user_ton_daily
            })
        else:
            return jsonify({
                'error': 'Failed to record claim'
            }), 500
            
    except Exception as e:
        return jsonify({
            'error': 'Claim failed'
        }), 500

@app.route('/api/wallet-summary', methods=['GET'])
@api_response
def wallet_summary():
    """API to get wallet summary including total deposits, withdrawals, daily TON history, and balance"""
    address = request.args.get('address')
    
    if not address:
        return jsonify({'error': 'Address is required'}), 400
    
    try:
        # Get user info
        user = get_user(address)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
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
        from models import get_daily_ton_history
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
        
        return jsonify(convert_objectid(summary))
        
    except Exception as e:
        return jsonify({
            'error': 'Failed to get wallet summary'
        }), 500

# Vercel serverless function handler
def handler(request, context):
    return app(request, context)

# For local development
if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True) 