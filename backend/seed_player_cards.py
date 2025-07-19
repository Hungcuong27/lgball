from pymongo import MongoClient

MONGO_URI = "mongodb://localhost:27017/"
DB_NAME = "gacha_game"

def seed_player_cards():
    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]
    player_cards = db['player_cards']

    # Xóa dữ liệu cũ (nếu muốn)
    player_cards.delete_many({})

    # Dữ liệu mẫu cho bronzeBall
    cards = [
        {
            "name": "Onana",
            "image": "onana.png",
            "reward": 0.001,
            "rate": 16.7,
            "rarity": "Common",
            "ball_type": "bronzeBall"
        },
        {
            "name": "Maignan",
            "image": "maignan.png",
            "reward": 0.005,
            "rate": 16.7,
            "rarity": "Common",
            "ball_type": "bronzeBall"
        },
        {
            "name": "Stegen",
            "image": "stegen.png",
            "reward": 0.01,
            "rate": 16.7,
            "rarity": "Common",
            "ball_type": "bronzeBall"
        },
        {
            "name": "Degea",
            "image": "degea.png",
            "reward": 0.025,
            "rate": 16.7,
            "rarity": "Common",
            "ball_type": "bronzeBall"
        },
        {
            "name": "Donnarumma",
            "image": "donnarumma.png",
            "reward": 0.1,
            "rate": 16.7,
            "rarity": "Common",
            "ball_type": "bronzeBall"
        },
        {
            "name": "Neuer",
            "image": "neuer.png",
            "reward": 0.5,
            "rate": 16.7,
            "rarity": "Common",
            "ball_type": "bronzeBall"
        },
        # Thêm các thẻ cho silverBall, goldBall, diamondBall nếu muốn
    ]

    player_cards.insert_many(cards)
    print("Seeded player cards!")

if __name__ == "__main__":
    seed_player_cards() 