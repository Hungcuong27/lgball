#!/bin/bash

# Script deploy lên Vercel với cấu hình environment variables
echo "🚀 Bắt đầu deploy lên Vercel..."

# Kiểm tra Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI chưa được cài đặt"
    echo "Cài đặt: npm i -g vercel"
    exit 1
fi

# Kiểm tra đăng nhập Vercel
if ! vercel whoami &> /dev/null; then
    echo "❌ Chưa đăng nhập Vercel"
    echo "Chạy: vercel login"
    exit 1
fi

# Lấy ngrok URL động (ưu tiên HTTPS)
echo "🔎 Đọc ngrok public URL..."
if ! command -v jq >/dev/null 2>&1; then
  NGROK_PUBLIC_URL=$(curl -fsS http://127.0.0.1:4040/api/tunnels | sed -n 's/.*\"public_url\"\s*:\s*\"\(https:[^\"]*\)\".*/\1/p' | head -n1 || true)
else
  NGROK_PUBLIC_URL=$(curl -fsS http://127.0.0.1:4040/api/tunnels | jq -r '.tunnels[] | select(.proto=="https") | .public_url' | head -n1 || true)
fi

if [[ -z "${NGROK_PUBLIC_URL}" ]]; then
  echo "❌ Không lấy được ngrok public URL. Hãy đảm bảo ngrok đang chạy."
  exit 1
fi

# Thiết lập env cho build + deploy
# Không cần VITE_BACKEND_API nữa vì sẽ dùng proxy
export NGROK_URL="${NGROK_PUBLIC_URL}"
export VITE_RECEIVER_WALLET="${VITE_RECEIVER_WALLET:-UQDTTSZtaO5a7mfon5nT-6SotVNtgXGq1iNx1zcNuE57Qtof}"
echo "✅ NGROK_URL=${NGROK_PUBLIC_URL}"
echo "✅ VITE_RECEIVER_WALLET=${VITE_RECEIVER_WALLET}"

# Cài deps + build để Vercel thấy thư mục api/
echo "📦 Installing deps & building..."
npm ci || npm install
npm run build

# Deploy với NGROK_URL để proxy function sử dụng
echo "🌐 Deploying lên Vercel..."
vercel --prod \
  --env NGROK_URL="${NGROK_PUBLIC_URL}" \
  --env VITE_RECEIVER_WALLET="${VITE_RECEIVER_WALLET}"

echo "🎉 Deploy hoàn tất!"
echo "📱 Kiểm tra URL trong output trên"
echo ""
echo "⚠️  Lưu ý: Nếu ngrok URL thay đổi, cần cập nhật trong Vercel Dashboard:"
echo "   Settings > Environment Variables > NGROK_URL"
echo ""
echo "🔧 API calls sẽ được proxy qua /api/* đến backend thông qua NGROK_URL" 