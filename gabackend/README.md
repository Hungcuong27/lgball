# GA Backend

Backend API cho ứng dụng GA, chạy với ngrok để expose ra internet.

## Setup và Chạy

### 1. Tạo Virtual Environment
```bash
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# hoặc
venv\Scripts\activate  # Windows
```

### 2. Cài đặt Dependencies
```bash
pip install -r requirements.txt
```

### 3. Cấu hình Environment Variables
Tạo file `.env` trong thư mục `api/` với nội dung:
```
MONGO_URI=your_mongodb_connection_string
DB_NAME=your_database_name
TON_NETWORK=mainnet
TON_PRIVATE_KEY=your_private_key
```

### 4. Chạy với ngrok
```bash
./run_with_ngrok.sh
```

Hoặc chạy thủ công:
```bash
# Terminal 1: Chạy Flask app
python3 api/index.py

# Terminal 2: Chạy ngrok
ngrok http 5000
```

## API Endpoints

- `GET /api/test` - Test endpoint
- `POST /api/user` - Tạo user mới
- `GET /api/user` - Lấy thông tin user
- `GET /api/referrals` - Lấy danh sách referrals
- `POST /api/deposit` - Nạp tiền
- `POST /api/withdraw` - Rút tiền
- `GET /api/transactions` - Lấy lịch sử giao dịch
- `POST /api/open-chest` - Mở chest
- `GET /api/collection` - Lấy collection
- `GET /api/history` - Lấy lịch sử
- `GET /api/open-history` - Lấy lịch sử mở ball

## Lưu ý

- Ngrok sẽ tạo URL public để truy cập API từ internet
- URL sẽ thay đổi mỗi lần restart ngrok (trừ khi dùng ngrok Pro)
- Đảm bảo MongoDB đang chạy và có thể kết nối được 