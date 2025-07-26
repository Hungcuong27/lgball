import os

MONGO_URI = os.environ.get('MONGO_URI', 'mongodb+srv://cuong272vtvp:tTCXOwoyJo2cYkS4@cluster0.xtvy17d.mongodb.net/gacha_game?retryWrites=true&w=majority')
DB_NAME = os.environ.get('DB_NAME', 'gacha_game') 