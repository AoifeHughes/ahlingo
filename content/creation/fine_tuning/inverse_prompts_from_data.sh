#!/bin/bash

# Define the number of runs for each prompt
number_of_runs=1

# Server startup configurations
MODEL_PATH="/Users/ahughes/git/LLMs/llama2-7b-translatejson-q5_0.gguf"
CONTEXT_SIZE=2048
SERVER_HOST="127.0.0.1"
SERVER_PORT="8080"
SERVER_CMD="/Users/ahughes/git/llama.cpp/server"
SERVER_ARGS="-m $MODEL_PATH -c $CONTEXT_SIZE --host $SERVER_HOST --port $SERVER_PORT"

# Generate directory paths for prompts and outputs
PROMPTS_DIRS=($(find "../languages/prompts_responses/" -type d -maxdepth 1 -mindepth 1))
OUTPUT_DIRS=($(find "../languages/prompts_responses/" -type d -maxdepth 1 -mindepth 1))

echo "PROMPTS_DIRS: ${PROMPTS_DIRS[@]}"
echo "OUTPUT_DIRS: ${OUTPUT_DIRS[@]}"

# Start the llama.cpp server
echo "Starting llama.cpp server..."
$SERVER_CMD $SERVER_ARGS &
SERVER_PID=$!

# Wait for the server to start and become ready
echo "Waiting for server to become ready..."
sleep 10  # Adjust this sleep time as necessary

# Function to process, reverse prompts and send to server
process_and_send_prompt() {
    local JSON_FILE="$1"
    local DIR_PATH=$(dirname "$JSON_FILE")
    local BASENAME=$(basename "$JSON_FILE" .json)

    # Read the JSON file and prepend the specific prompt text
    local PROMPT_TEXT="What question should you ask in order to get this data?"

    # Check if the JSON file is valid
    if jq empty "$JSON_FILE"; then
        # Using jq to process JSON file. If it's an array or object, convert it to a string before concatenation
        local REVISED_PROMPT=$(jq -r --arg prompt "$PROMPT_TEXT" 'if type == "array" or type == "object" then tojson else . end | $prompt + " " + .' "$JSON_FILE")

        # Prepare data for POST request
        local DATA=$(echo "$REVISED_PROMPT" | jq -Rs --arg temp "0.4" '{prompt: ., temperature: ($temp | tonumber)}')

        # Send prompt to llama.cpp server and capture the entire output
        local FULL_RESPONSE=$(curl --silent --request POST \
                                       --url http://${SERVER_HOST}:${SERVER_PORT}/completion \
                                       --header "Content-Type: application/json" \
                                       --data "$DATA")

        # Write the server response to the output file
        local OUTPUT_FILE="${DIR_PATH}/prompt_reversed_${BASENAME}_response.json"
        echo "$FULL_RESPONSE" | jq -r '.content' > "$OUTPUT_FILE"
    else
        echo "Invalid JSON file: $JSON_FILE"
    fi
}

# Loop over PROMPTS_DIRS
for i in "${!PROMPTS_DIRS[@]}"; do
    PROMPTS_DIR=${PROMPTS_DIRS[$i]}

    # Process, reverse and send all JSON files in the PROMPTS_DIR
    find "$PROMPTS_DIR" -type f -name "*.json" | while read JSON_FILE; do
        process_and_send_prompt "$JSON_FILE"
    done

    echo "Processing complete."

    #./clean_json.sh
done

# Stop the server
echo "Stopping llama.cpp server..."
kill $SERVER_PID
