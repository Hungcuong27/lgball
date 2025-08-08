from tonsdk.contract.wallet import WalletVersionEnum, Wallets
from tonsdk.crypto import mnemonic_to_wallet_key
from tonsdk.utils import to_nano
import requests

mnemonics = [
    "leg", "novel", "diet", "leave", "example", "excite", "there", "aerobic",
    "genuine", "brown", "rail", "ring", "measure", "trouble", "cabbage", "awful",
    "knee", "issue", "own", "meat", "ancient", "lecture", "oblige", "item"
]

# 1. Lấy private key và public key từ mnemonic
priv_key, pub_key = mnemonic_to_wallet_key(mnemonics)

# 2. Tạo ví từ private key
wallet = Wallets.from_private_key(
    priv_key,
    version=WalletVersionEnum.v4r2,
    workchain=0
)

wallet_address = wallet.address.to_string()
print("Địa chỉ ví:", wallet_address)

# 3. Lấy seqno từ Toncenter
seqno_url = f"https://toncenter.com/api/v3/addressInformation?address={wallet_address}"
seqno_resp = requests.get(seqno_url).json()
seqno = seqno_resp.get('result', {}).get('seqno', 0)
print("Seqno hiện tại:", seqno)

# 4. Tạo giao dịch 0.01 TON
to_address = "EQxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"  # ví đích
amount = to_nano(0.01, 'ton')

transfer = wallet.create_transfer_message(
    to_addr=to_address,
    amount=amount,
    seqno=seqno,
    payload=None,
    send_mode=3
)

# 5. Lấy BOC base64
boc_base64 = transfer["message"].to_boc(False).to_base64()
print("BOC Base64:", boc_base64)

# 6. Gửi giao dịch lên Toncenter
api_url = "https://toncenter.com/api/v3/message"
payload = {"boc": boc_base64}
headers = {"Content-Type": "application/json"}

response = requests.post(api_url, headers=headers, json=payload)
print("Kết quả gửi giao dịch:", response.json())
