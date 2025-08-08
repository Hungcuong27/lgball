#!/bin/bash

# Kill any existing ngrok processes
pkill ngrok

# Start Flask app in background
echo "Starting Flask app..."
source venv/bin/activate && python api/index.py &
FLASK_PID=$!

# Wait a moment for Flask to start
sleep 3

# Start ngrok tunnel
echo "Starting ngrok tunnel..."
ngrok http 5000

# Cleanup when script is interrupted
trap "echo 'Stopping Flask app...'; kill $FLASK_PID; pkill ngrok; exit" INT 