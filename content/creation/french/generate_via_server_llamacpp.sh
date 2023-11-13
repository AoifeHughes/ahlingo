#!/bin/bash

# Define the number of runs for each prompt
number_of_runs=5

# Server startup configurations
MODEL_PATH="/Users/ahughes/git/LLMs/llama-2-13b-chat.Q4_K_M.gguf"
CONTEXT_SIZE=512
SERVER_HOST="127.0.0.1"
SERVER_PORT="8080"
SERVER_CMD="/Users/ahughes/git/llama.cpp/server"
SERVER_ARGS="-m $MODEL_PATH -c $CONTEXT_SIZE --host $SERVER_HOST --port $SERVER_PORT"

PROMPTS_DIR="./"
OUTPUT_DIR="./"

# Start the llama.cpp server
echo "Starting llama.cpp server..."
$SERVER_CMD $SERVER_ARGS &
SERVER_PID=$!

# Wait for the server to start and become ready
echo "Waiting for server to become ready..."
sleep 10  # Adjust this sleep time as necessary

# Function to send prompts to the llama.cpp server and capture the output
process_prompt() {
    local PROMPTS_FILE="$1"
    local LEVEL=$(dirname "$PROMPTS_FILE" | xargs basename)
    local BASENAME=$(basename "$PROMPTS_FILE" .txt)
    
    # Ensure level-specific output directory exists
    mkdir -p "${OUTPUT_DIR}${LEVEL}"

    for run in $(seq 1 $number_of_runs); do
        # Set output file name with run number
        OUTPUT_FILE="${OUTPUT_DIR}${LEVEL}/${BASENAME}_run_${run}_response.json"

        # Prepare data for POST request
        local DATA=$(cat "$PROMPTS_FILE" | jq -Rs '{prompt: ., n_predict: 512}')

        # Send prompt to llama.cpp server and capture the entire output
        local FULL_RESPONSE=$(curl --silent --request POST \
                                       --url http://${SERVER_HOST}:${SERVER_PORT}/completion \
                                       --header "Content-Type: application/json" \
                                       --data "$DATA")

        # Save the response
        echo "$FULL_RESPONSE" | jq -r '.content' > "$OUTPUT_FILE"
    done
}

./make_prompts.sh

# Count the total number of .txt files
total_files=$(find "$PROMPTS_DIR" -type f -name "*.txt" | wc -l)
counter=0

# Iterate over all .txt files in the PROMPTS_DIR and process each one
find "$PROMPTS_DIR" -type f -name "*.txt" | while read FILE; do
    process_prompt "$FILE"

    # Update and display the progress
    ((counter++))
    percent=$((counter * 100 / total_files))
    printf "Processing: %d%% (%d/%d)\r" $percent $counter $total_files
done

echo "Processing complete."

./clean_json.sh
mkdir -p ../../lessons/french

target_base="../../lessons/french"

for dir in */; do
    mkdir -p "${target_base}/${dir}"
    find "$dir" -name "*.json" -exec mv {} "${target_base}/${dir}" \;
    rm -rf "$dir"
done

# Stop the server
echo "Stopping llama.cpp server..."
kill $SERVER_PID
