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
    """
    Sử dụng Toncenter API để gửi TON transaction trên mainnet
    """
    amount_nano = int(amount_ton * 1e9)
    
    try:
        print(f"Sending TON transaction on MAINNET:")
        print(f"  From: {TON_WALLET_ADDRESS}")
        print(f"  To: {to_address}")
        print(f"  Amount: {amount_ton} TON ({amount_nano} nano)")
        print(f"  Comment: {comment}")
        
        # Tạo transaction payload cho sendMessage
        payload = {
            "from": TON_WALLET_ADDRESS,
            "to": to_address,
            "amount": str(amount_nano),  # Convert to string
            "message": comment,
            "private_key": TON_PRIVATE_KEY
        }
        
        # Gửi request đến Toncenter API (mainnet)
        response = requests.post(
            f"{TONCENTER_API}/sendMessage",
            json=payload,
            headers={'Content-Type': 'application/json'},
            timeout=30
        )
        
        print(f"Toncenter API response status: {response.status_code}")
        print(f"Toncenter API response: {response.text}")
        
        if response.status_code == 200:
            result = response.json()
            if result.get('ok'):
                tx_hash = result.get('result', {}).get('hash', 'pending')
                print(f"Transaction successful! Hash: {tx_hash}")
                return {
                    "tx_hash": tx_hash,
                    "status": "success"
                }
            else:
                error_msg = result.get('error', 'Unknown error')
                print(f"Toncenter API error: {error_msg}")
                return {"error": error_msg, "tx_hash": None}
        else:
            error_msg = f"HTTP {response.status_code}: {response.text}"
            print(f"HTTP error: {error_msg}")
            return {"error": error_msg, "tx_hash": None}
            
    except Exception as e:
        print(f"Error in send_ton_onchain: {e}")
        return {"error": str(e), "tx_hash": None} 