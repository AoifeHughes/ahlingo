#!/bin/bash

# Start Ollama server
ollama serve &
SERVER_PID=$!

# Wait for the server to start
sleep 10  # Adjust this sleep time as necessary

# Variables for Ollama API
SERVER_HOST="127.0.0.1"
SERVER_PORT="11434"
MODEL_NAME="mistral"  # Using 'mistral' as the model

PROMPTS_DIR="./"
OUTPUT_DIR="./"

# Function to send prompts to the Ollama server and capture the output
process_prompt() {
    local PROMPTS_FILE="$1"
    local LEVEL=$(dirname "$PROMPTS_FILE" | xargs basename)
    local BASENAME=$(basename "$PROMPTS_FILE" .txt)

    # Ensure level-specific output directory exists
    mkdir -p "${OUTPUT_DIR}${LEVEL}"

    # Set output file name
    OUTPUT_FILE="${OUTPUT_DIR}${LEVEL}/${BASENAME}_response.json"

    # Prepare data for POST request
    local DATA=$(cat "$PROMPTS_FILE" | jq -Rs '{model: "'$MODEL_NAME'", prompt: ., stream: false}')

    # Send prompt to Ollama server and capture the entire output
    local FULL_RESPONSE=$(curl --silent --request POST \
                                   --url http://${SERVER_HOST}:${SERVER_PORT}/api/generate \
                                   --header "Content-Type: application/json" \
                                   --data "$DATA")

    # Extract only the 'response' part of the output
    echo "$FULL_RESPONSE" | jq '.response' > "$OUTPUT_FILE"
}

# Iterate over all .txt files in the PROMPTS_DIR and process each one
find "$PROMPTS_DIR" -type f -name "*.txt" | while read FILE; do
    process_prompt "$FILE"
done

# Stop the server
kill $SERVER_PID
