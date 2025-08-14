import os
import requests
import json
from dotenv import load_dotenv

load_dotenv()

# Sử dụng private key trực tiếp thay vì từ environment
TON_PRIVATE_KEY = '971e75304fffa5a48ae7e3a907063edcd8315cc8b8a96c399b30239990ac06fdc52fcfa05b9443057a95a2666e868270e3bf965f2cffc4da015d7b63055784b8'
TON_WALLET_ADDRESS = 'EQD4FPq-PRDieyQKkizFTRt5y1-EId0RzC_P6Xn4S2qYV6Hj'

# Toncenter API endpoint (mainnet)
TONCENTER_API = "https://toncenter.com/api/v2"

def send_ton_onchain(to_address: str, amount_ton: float, comment: str = ""):
    """Send TON onchain using Toncenter API"""
    try:
        # Convert TON to nano
        amount_nano = int(amount_ton * 1_000_000_000)
        
        # Prepare transaction data
        transaction_data = {
            "from": TON_WALLET_ADDRESS,
            "to": to_address,
            "amount": str(amount_nano),
            "comment": comment,
            "private_key": TON_PRIVATE_KEY
        }
        
        # Send transaction
        response = requests.post(TONCENTER_API, json=transaction_data)
        
        if response.status_code == 200:
            data = response.json()
            if data.get('ok'):
                tx_hash = data.get('result', {}).get('hash')
                return {
                    'success': True,
                    'hash': tx_hash,
                    'message': 'Transaction sent successfully'
                }
            else:
                error_msg = data.get('error', 'Unknown error')
                return {
                    'success': False,
                    'error': f'Toncenter API error: {error_msg}'
                }
        else:
            error_msg = f'HTTP {response.status_code}'
            return {
                'success': False,
                'error': f'HTTP error: {error_msg}'
            }
            
    except Exception as e:
        return {
            'success': False,
            'error': f'Error in send_ton_onchain: {str(e)}'
        } 