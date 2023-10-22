#!/bin/bash

# Define the variables
MAIN_EXEC="$HOME/git/llama.cpp/main"
MODEL_PATH="$HOME/git/llama.cpp/models/llama-2-13b/ggml-model-q4_0-v2.gguf"
PROMPTS_DIR="./prompts/french/"
N_TIMES=1  # Number of times to run the command
OUTPUT_DIR="../french/"
BASE_OUTPUT_FILE="lessons"

# Function to run the command N_TIMES and capture the output for a given prompts file
run_command() {
    local PROMPTS_FILE="$1"
    local BASENAME=$(basename "$PROMPTS_FILE" .txt) # Extracts the filename without the extension
    
    for i in $(seq 1 $N_TIMES); do
        OUTPUT_FILE="${OUTPUT_DIR}${BASENAME}_${i}.json"
        $MAIN_EXEC -m $MODEL_PATH -c 512 -b 1024 -n -1 --keep 48 --repeat_penalty 1.0 --color -f $PROMPTS_FILE | awk '/{/{flag=1} flag' > "$OUTPUT_FILE"
    done
}

# Iterate over all .txt files in the PROMPTS_DIR and run the command on each one
for FILE in "$PROMPTS_DIR"*.txt; do
    run_command "$FILE"
done
