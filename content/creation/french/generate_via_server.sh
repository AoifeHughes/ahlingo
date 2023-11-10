#!/bin/bash

# Define the variables
SERVER_EXEC="$HOME/git/llama.cpp/server"
MODEL_PATH="$HOME/git/llama.cpp/models/llama-2-13b/ggml-model-q4_0-v2.gguf"
PROMPTS_DIR="./prompts/french/"
OUTPUT_DIR="./output/french/"
SERVER_HOST="127.0.0.1"
SERVER_PORT="8080"

# Start the server in the background
$SERVER_EXEC -m $MODEL_PATH -c 2048 &
SERVER_PID=$!

# Wait for the server to start
sleep 10  # Adjust this sleep time as necessary

# Function to send prompts to the server and capture the output
process_prompt() {
    local PROMPTS_FILE="$1"
    local LEVEL=$(dirname "$PROMPTS_FILE" | xargs basename)
    local BASENAME=$(basename "$PROMPTS_FILE" .txt)

    # Ensure level-specific output directory exists
    mkdir -p "${OUTPUT_DIR}${LEVEL}"

    # Set output file name
    OUTPUT_FILE="${OUTPUT_DIR}${LEVEL}/${BASENAME}.json"

    # Prepare data for POST request
    local DATA=$(cat "$PROMPTS_FILE" | jq -Rs '{prompt: ., n_predict: 512}')

    # Send prompt to server and save output
    curl --request POST \
         --url http://${SERVER_HOST}:${SERVER_PORT}/completion \
         --header "Content-Type: application/json" \
         --data "$DATA" > "$OUTPUT_FILE"
}

# Iterate over all .txt files in the PROMPTS_DIR and process each one
find "$PROMPTS_DIR" -type f -name "*.txt" | while read FILE; do
    process_prompt "$FILE"
done

# Stop the server
kill $SERVER_PID
