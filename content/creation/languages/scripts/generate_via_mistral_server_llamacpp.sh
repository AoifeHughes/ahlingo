#!/bin/bash

./make_prompts_mistral.sh 

# Define the number of runs for each prompt
number_of_runs=1

# Server startup configurations
MODEL_PATH="/Users/ahughes/git/LLMs/mistral-7b-instruct-v0.1.Q5_K_S.gguf"
CONTEXT_SIZE=2048
SERVER_HOST="127.0.0.1"
SERVER_PORT="8080"
SERVER_CMD="/Users/ahughes/git/llama.cpp/server"
SERVER_ARGS="-m $MODEL_PATH -c $CONTEXT_SIZE --host $SERVER_HOST --port $SERVER_PORT"

# Generate directory paths for prompts and outputs
PROMPTS_DIRS=($(find "../prompts_responses/" -type d -maxdepth 1 -mindepth 1))
OUTPUT_DIRS=($(find "../prompts_responses/" -type d -maxdepth 1 -mindepth 1))

echo "PROMPTS_DIRS: ${PROMPTS_DIRS[@]}"
echo "OUTPUT_DIRS: ${OUTPUT_DIRS[@]}"


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
    local DIR_PATH=$(dirname "$PROMPTS_FILE")
    local BASENAME=$(basename "$PROMPTS_FILE" .txt)

    for run in $(seq 1 $number_of_runs); do
        # Set output file name with run number, in the same directory as PROMPTS_FILE
        OUTPUT_FILE="${DIR_PATH}/${BASENAME}_run_${run}_response_alpaca.json"

        # Prepare data for POST request
        # Added temperature setting here
        local DATA=$(cat "$PROMPTS_FILE" | jq -Rs --arg temp "0.5" '{prompt: ., temperature: ($temp | tonumber)}')

        # Send prompt to llama.cpp server and capture the entire output
        local FULL_RESPONSE=$(curl --silent --request POST \
                                       --url http://${SERVER_HOST}:${SERVER_PORT}/completion \
                                       --header "Content-Type: application/json" \
                                       --data "$DATA")

        # Save the response
        echo "$FULL_RESPONSE" | jq -r '.content' > "$OUTPUT_FILE"
        # Optionally remove the original prompts file
        #rm -f "$PROMPTS_FILE"
    done
}



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
    done

    echo "Processing complete."

    ./clean_json.sh
done

# Stop the server
echo "Stopping llama.cpp server..."
kill $SERVER_PID