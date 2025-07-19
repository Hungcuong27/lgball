import os
from dotenv import load_dotenv
from pytonlib import TonlibClient
import json

load_dotenv()
TON_PRIVATE_KEY = os.getenv('TON_PRIVATE_KEY')
TON_WALLET_ADDRESS = os.getenv('TON_WALLET_ADDRESS')

with open('global.config.json', 'r') as f:
    config = json.load(f)

client = TonlibClient(config=config, keystore='./keystore', ls_index=0)

def send_ton_onchain(to_address: str, amount_ton: float, comment: str = ""):
    amount_nano = int(amount_ton * 1e9)
    # Lưu ý: tuỳ định dạng private key, có thể cần chuyển đổi
    # Nếu là hex: private_key = bytes.fromhex(TON_PRIVATE_KEY)
    # Nếu là base64: private_key = base64.b64decode(TON_PRIVATE_KEY)
    # Ở đây giả sử là hex
    private_key = bytes.fromhex(TON_PRIVATE_KEY)
    result = client.transfer_message(
        TON_WALLET_ADDRESS,
        private_key,
        to_address,
        amount_nano,
        comment
    )
    return result 