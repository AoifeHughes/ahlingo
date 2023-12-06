#!/bin/bash

# Define the number of runs for each prompt
number_of_runs=1

# Server startup configurations
MODEL_PATH="/Users/ahughes/git/LLMs/llama-2-13b-chat.Q4_K_M.gguf"
#MODEL_PATH="/Users/ahughes/git/LLMs/yi-34b.Q4_K_M.gguf"
#MODEL_PATH="/Users/ahughes/git/LLMs/hermes-trismegistus-mistral-7b.Q5_K_M.gguf"
CONTEXT_SIZE=1024
SERVER_HOST="127.0.0.1"
SERVER_PORT="8080"
SERVER_CMD="/Users/ahughes/git/llama.cpp/server"
SERVER_ARGS="-m $MODEL_PATH -c $CONTEXT_SIZE --host $SERVER_HOST --port $SERVER_PORT"

PROMPTS_DIRS=(
    "../French_English/comprehension/" 
    "../French_English/translations/"
    )
OUTPUT_DIRS=(
    "../French_English/comprehension/" 
    "../French_English/translations/"
    )

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
        OUTPUT_FILE="${OUTPUT_DIR}${LEVEL}/${BASENAME}_run_${run}_response_llama.json"

        # Prepare data for POST request
        local DATA=$(cat "$PROMPTS_FILE" | jq -Rs '{prompt: .}')

        # Send prompt to llama.cpp server and capture the entire output
        local FULL_RESPONSE=$(curl --silent --request POST \
                                       --url http://${SERVER_HOST}:${SERVER_PORT}/completion \
                                       --header "Content-Type: application/json" \
                                       --data "$DATA")

        # Save the response
        echo "$FULL_RESPONSE" | jq -r '.content' > "$OUTPUT_FILE"
    done
}

./make_prompts_llama_comprehension.sh
./make_prompts_llama_translations.sh

# Loop over PROMPTS_DIRS and OUTPUT_DIRS
for i in "${!PROMPTS_DIRS[@]}"; do
    PROMPTS_DIR=${PROMPTS_DIRS[$i]}
    OUTPUT_DIR=${OUTPUT_DIRS[$i]}

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

    #./clean_json.sh

done

# Stop the server
echo "Stopping llama.cpp server..."
kill $SERVER_PID
