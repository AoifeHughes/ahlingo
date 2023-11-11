#!/bin/bash

# Define the number of runs for each prompt
number_of_runs=1

# Start Ollama server
ollama serve &
SERVER_PID=$!

# Wait for the server to start
sleep 10  # Adjust this sleep time as necessary

# Variables for Ollama API
SERVER_HOST="127.0.0.1"
SERVER_PORT="11434"
MODEL_NAME="llama2:13bFrench" 

PROMPTS_DIR="./"
OUTPUT_DIR="./"

# Function to send prompts to the Ollama server and capture the output
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
        local DATA=$(cat "$PROMPTS_FILE" | jq -Rs '{model: "'$MODEL_NAME'", prompt: ., stream: false, options: {num_predict: 512, num_ctx: 8192}}')

        # Send prompt to Ollama server and capture the entire output
        local FULL_RESPONSE=$(curl --silent --request POST \
                                       --url http://${SERVER_HOST}:${SERVER_PORT}/api/generate \
                                       --header "Content-Type: application/json" \
                                       --data "$DATA")

        # Extract only the 'response' part of the output
        echo "$FULL_RESPONSE" | jq -r '.response' | sed 's/\\n/\n/g' > "$OUTPUT_FILE"
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
kill $SERVER_PID
