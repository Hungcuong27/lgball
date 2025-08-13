#!/bin/bash

# Set log directory
LOG_DIR="./logs"
mkdir -p $LOG_DIR

# Kill any existing ngrok processes
echo "Killing existing ngrok processes..."
pkill ngrok

# Start Flask app in background
echo "Starting Flask app..."
source venv/bin/activate && python api/index.py > $LOG_DIR/flask.log 2>&1 &
FLASK_PID=$!

# Wait a moment for Flask to start
sleep 3

# Start ngrok tunnel with nohup and logging
echo "Starting ngrok tunnel with nohup..."
nohup ngrok http 5000 --log=stdout > $LOG_DIR/ngrok.log 2>&1 &
NGROK_PID=$!

# Wait a moment for ngrok to start and get the tunnel URL
sleep 5

# Save PIDs to files for later management
echo $FLASK_PID > $LOG_DIR/flask.pid
echo $NGROK_PID > $LOG_DIR/ngrok.pid

echo "✅ Flask app started with PID: $FLASK_PID"
echo "✅ Ngrok tunnel started with PID: $NGROK_PID"
echo "📁 Logs are saved in: $LOG_DIR/"
echo "📄 Flask logs: $LOG_DIR/flask.log"
echo "📄 Ngrok logs: $LOG_DIR/ngrok.log"
echo "🆔 PIDs saved in: $LOG_DIR/flask.pid and $LOG_DIR/ngrok.pid"
echo ""

# Try to get ngrok tunnel URL from logs
echo "🔍 Looking for ngrok tunnel URL..."
if [ -f "$LOG_DIR/ngrok.log" ]; then
    TUNNEL_URL=$(grep -o 'https://[a-zA-Z0-9]*\.ngrok-free\.app' $LOG_DIR/ngrok.log | head -1)
    if [ ! -z "$TUNNEL_URL" ]; then
        echo "🌐 Ngrok tunnel URL: $TUNNEL_URL"
        echo "🔗 API endpoint: $TUNNEL_URL/api/"
        echo ""
        echo "💡 Copy this URL to your frontend environment variables:"
        echo "   export NGROK_URL=$TUNNEL_URL"
        echo "   or set in Vercel: NGROK_URL=$TUNNEL_URL"
    else
        echo "⚠️  Ngrok tunnel URL not found in logs yet. Check logs manually:"
        echo "   tail -f $LOG_DIR/ngrok.log"
    fi
else
    echo "⚠️  Ngrok log file not found yet"
fi

echo ""
echo "💡 To stop services later, use:"
echo "   kill \$(cat $LOG_DIR/flask.pid)"
echo "   kill \$(cat $LOG_DIR/ngrok.pid)"
echo "   or run: ./stop_services.sh"
echo ""
echo "🌐 Ngrok is running in background. Check logs for tunnel URL."

# Cleanup when script is interrupted
trap "echo 'Stopping services...'; kill $FLASK_PID; kill $NGROK_PID; exit" INT 