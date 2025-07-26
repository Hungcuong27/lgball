# GA Backend

Backend API cho ứng dụng GA, được deploy trên Render.

## Cấu hình Environment Variables trên Render

Để deploy thành công, bạn cần cấu hình các environment variables sau trong Render dashboard:

### Required Variables:
- `MONGO_URI`: Connection string đến MongoDB
- `DB_NAME`: Tên database MongoDB

### Optional Variables:
- `TON_NETWORK`: Network TON (mainnet/testnet)
- `TON_PRIVATE_KEY`: Private key cho TON transactions

## Deploy lên Render

1. Push code lên GitHub repository
2. Tạo account trên [Render](https://render.com)
3. Tạo new Web Service
4. Connect với GitHub repository
5. Cấu hình:
   - **Name**: gabackend
   - **Environment**: Python
   - **Build Command**: `chmod +x build.sh && ./build.sh`
   - **Start Command**: `gunicorn wsgi:app`
6. Thêm Environment Variables
7. Deploy

## Local Development

```bash
cd gabackend
pip install -r requirements.txt
python api/index.py
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