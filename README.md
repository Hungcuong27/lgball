# Legendary Ball - Telegram Mini App

A Telegram Mini App for a P2E (Play-to-Earn) game where users can open balls to get player cards and earn TON tokens.

## 🎮 Features

- **Ball Opening System**: Open different types of balls (Bronze, Silver, Gold, Diamond) to get player cards
- **Referral System**: Invite friends and earn commission from their activities
- **Wallet Integration**: Connect TON wallet for deposits and withdrawals
- **Player Collection**: Collect and view player cards
- **Transaction History**: Track all deposits, withdrawals, and ball openings

## 🏗️ Architecture

### Backend (Flask + MongoDB)
- **API Endpoints**: RESTful APIs for user management, transactions, and game logic
- **Database**: MongoDB for storing user data, transactions, and game history
- **Authentication**: Wallet-based authentication using TON Connect

### Frontend (React + TypeScript)
- **Telegram Mini App**: Built as a Telegram WebApp
- **TON Connect**: Integration with TON blockchain wallet
- **Responsive Design**: Optimized for mobile devices

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- MongoDB
- TON wallet

### Backend Setup
```bash
cd gabackend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

### Environment Variables
Create `.env` file in `gabackend` directory:
```env
MONGO_URI=your_mongodb_connection_string
DB_NAME=gacha_game
```

## 📁 Project Structure

```
ga/
├── gabackend/           # Flask backend
│   ├── api/            # API endpoints
│   ├── models.py       # Database models
│   └── requirements.txt
├── frontend/           # React frontend
│   ├── src/
│   │   ├── components/ # React components
│   │   ├── api.ts      # API client
│   │   └── App.tsx     # Main app component
│   └── package.json
└── README.md
```

## 🎯 Game Mechanics

### Ball Types
- **Bronze Ball**: 0.5 TON - Common players
- **Silver Ball**: 1 TON - Uncommon players  
- **Gold Ball**: 2 TON - Rare players
- **Diamond Ball**: 5 TON - Legendary players

### Referral System
- Users can invite friends using referral links
- Earn commission from friends' ball openings
- Track referral earnings and history

## 🔧 API Endpoints

### User Management
- `POST /api/user` - Create/register user
- `GET /api/user` - Get user information

### Game
- `POST /api/open-chest` - Open a ball
- `GET /api/open-history` - Get ball opening history
- `GET /api/collection` - Get player collection

### Wallet
- `POST /api/deposit` - Deposit TON
- `POST /api/withdraw` - Withdraw TON
- `GET /api/transactions` - Get transaction history

### Referrals
- `GET /api/referrals` - Get referral list and link
- `GET /api/referral-commissions` - Get commission history

## 🛡️ Security

- Environment variables for sensitive data
- Input validation on all endpoints
- Rate limiting for API calls
- Secure wallet integration

## 📱 Telegram Integration

The app is designed as a Telegram Mini App and can be accessed through:
```
https://t.me/LegendballBot/legendball
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🔗 Links

- [GitHub Repository](https://github.com/Hungcuong27/lgball.git)
- [Telegram Bot](https://t.me/LegendballBot)
