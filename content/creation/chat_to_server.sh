#!/bin/bash

# Server and model configuration
SERVER_EXEC="$HOME/git/llama.cpp/server"
MODEL_PATH="$HOME/git/LLMs/hermes-trismegistus-mistral-7b.Q5_K_M.gguf"
SERVER_HOST="127.0.0.1"
SERVER_PORT="8080"

# Test data for the request
REQUEST_PROMPT="Give me a random french phrase and an english translation!"
REQUEST_DATA=$(echo '{"prompt": "'"$REQUEST_PROMPT"'", "n_predict": 128}' | jq -c .)

# Function to check if server is running
is_server_running() {
    if nc -z "$SERVER_HOST" "$SERVER_PORT"; then
        return 0 # Server is running
    else
        return 1 # Server is not running
    fi
}

# Function to start the server
start_server() {
    echo "Starting server..."
    $SERVER_EXEC -m $MODEL_PATH -c 2048 &
    SERVER_PID=$!

    # Wait for server to start
    echo "Waiting for server to start..."
    sleep 10  # Adjust this sleep time as necessary
    echo "Server started."
}

# Check if server is running, start it if not
if ! is_server_running; then
    start_server
fi

# Send request and print response
echo "Sending request to server..."
RESPONSE=$(curl --silent --request POST \
                 --url http://${SERVER_HOST}:${SERVER_PORT}/completion \
                 --header "Content-Type: application/json" \
                 --data "$REQUEST_DATA")

echo "Response from server:"
echo "$RESPONSE"

# Optionally, stop the server
kill $SERVER_PID
