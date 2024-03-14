#!/bin/bash

./make_prompts_mistral.sh 

# Define the number of runs for each prompt
number_of_runs=1

# Server startup configurations
MODEL_PATH="/Users/ahughes/git/LLMs/LMStudio/TheBloke/OpenHermes-2.5-Mistral-7B-16k-GGUF/openhermes-2.5-mistral-7b-16k.Q8_0.gguf"
CONTEXT_SIZE=4096
SERVER_HOST="127.0.0.1"
SERVER_PORT="8080"
SERVER_CMD="/Users/ahughes/git/llama.cpp/server"
GPU_LAYERS=35
NThreads=8
PROMPT_FILE="./prompt_file.json"
SERVER_ARGS="-m $MODEL_PATH -c $CONTEXT_SIZE --host $SERVER_HOST --port $SERVER_PORT --n-gpu-layers $GPU_LAYERS --system-prompt-file $PROMPT_FILE --parallel $NThreads"

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
sleep 20  # Adjust this sleep time as necessary

# Function to send prompts to the llama.cpp server and capture the output
process_prompt() {
    local PROMPTS_FILE="$1"
    local DIR_PATH=$(dirname "$PROMPTS_FILE")
    local BASENAME=$(basename "$PROMPTS_FILE" .txt)

    for run in $(seq 1 $number_of_runs); do
        echo "Processing $PROMPTS_FILE (run $run/$number_of_runs)..."
        OUTPUT_FILE="${DIR_PATH}/${BASENAME}_run_${run}_response_mistral.json"

        local DATA=$(cat "$PROMPTS_FILE" | jq -Rs --arg temp "0.2" '{prompt: ., temperature: ($temp | tonumber)}')

        local FULL_RESPONSE=$(curl --silent --request POST \
                                       --url http://${SERVER_HOST}:${SERVER_PORT}/completion \
                                       --header "Content-Type: application/json" \
                                       --data "$DATA")

        echo "$FULL_RESPONSE" | jq -r '.content' > "$OUTPUT_FILE"
        echo "Saved response to $OUTPUT_FILE"
    done
}

export -f process_prompt
export SERVER_HOST SERVER_PORT number_of_runs

# Loop over PROMPTS_DIRS and OUTPUT_DIRS
for i in "${!PROMPTS_DIRS[@]}"; do
    PROMPTS_DIR=${PROMPTS_DIRS[$i]}
    OUTPUT_DIR=${OUTPUT_DIRS[$i]}

    find "$PROMPTS_DIR" -type f -name "*.txt" -print0 | xargs -0 -n 1 -P $NThreads -I {} bash -c 'process_prompt "{}"'

    echo "Processing complete."

    ./clean_json.sh
done

# Stop the server
echo "Stopping llama.cpp server..."
kill $SERVER_PID
