#!/bin/bash

# Define the variables
MAIN_EXEC="$HOME/git/llama.cpp/main"
MODEL_PATH="$HOME/git/llama.cpp/models/llama-2-13b/ggml-model-q4_0-v2.gguf"
PROMPTS_DIR="./"
OUTPUT_DIR="./"

# Ensure the output directory exists
mkdir -p "$OUTPUT_DIR"

# Function to run the command and capture the output for a given prompts file
run_command() {
    local PROMPTS_FILE="$1"
    local LEVEL=$(dirname "$PROMPTS_FILE" | xargs basename) # Extracts the level from the directory name
    local BASENAME=$(basename "$PROMPTS_FILE" .txt) # Extracts the filename without the extension

    # Ensure level-specific output directory exists
    mkdir -p "${OUTPUT_DIR}${LEVEL}"

    # Set output file name
    OUTPUT_FILE="${OUTPUT_DIR}${LEVEL}/${BASENAME}.json"

    # Run the command and save output
    $MAIN_EXEC -m $MODEL_PATH -c 512 -b 1024 -n -1 --keep 48 --repeat_penalty 1.0 --color -f "$PROMPTS_FILE" | awk '/{/{flag=1} flag' > "$OUTPUT_FILE"
}

# Iterate over all .txt files in the PROMPTS_DIR and run the command on each one
find "$PROMPTS_DIR" -type f -name "*.txt" | while read FILE; do
    run_command "$FILE"
done
