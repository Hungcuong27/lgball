from pymongo import MongoClient
from config import MONGO_URI, DB_NAME
from datetime import datetime, timezone
import time

client = MongoClient(MONGO_URI)
db = client[DB_NAME]
users_col = db['users']

now = int(time.time())
dt_now = datetime.now(timezone.utc)
dt_midnight = dt_now.replace(hour=0, minute=0, second=0, microsecond=0)
midnight_ts = int(dt_midnight.timestamp())

users = users_col.find({'ton_daily': {'$gt': 0}})
count = 0
for user in users:
    last_claim = user.get('last_claim_time', 0)
    if last_claim < midnight_ts:
        users_col.update_one(
            {'address': user['address']},
            {'$inc': {'total_reward': user['ton_daily']}, '$set': {'last_claim_time': now}}
        )
        count += 1

print(f"Đã cộng thưởng daily cho {count} user vào {dt_midnight.isoformat()}") 