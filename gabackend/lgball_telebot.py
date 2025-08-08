from flask import Flask, request
import requests

app = Flask(__name__)
TOKEN = "8491577098:AAEVnbn6DFVKz5v3CHTFdQFiCv8LIYvKnDI"
URL = f"https://api.telegram.org/bot{TOKEN}"

@app.route("/", methods=["POST"])
def webhook():
    data = request.get_json()

    if "message" in data:
        chat_id = data["message"]["chat"]["id"]

        message = (
            "🌟 Welcome to *Legendball*!\n\n"
            "🕹️ A brand new P2E experience awaits you.\n"
            "🚀 Click the button below to start the game!"
        )

        keyboard = {
            "inline_keyboard": [
                [
                    {
                        "text": "🎮 Start Game",
                        "url": "https://lgball.vercel.app"
                    }
                ]
            ]
        }

        payload = {
            "chat_id": chat_id,
            "text": message,
            "parse_mode": "Markdown",
            "reply_markup": keyboard
        }

        requests.post(f"{URL}/sendMessage", json=payload)

    return "ok", 200
