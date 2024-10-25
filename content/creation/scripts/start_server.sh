#!/bin/bash

# Path to the model
MODEL_PATH="/Users/ahughes/git/LLMs/LMStudio/bartowski/Llama-3.2-3B-Instruct-GGUF/Llama-3.2-3B-Instruct-Q8_0.gguf"

# Server configuration
CONTEXT_SIZE=4096
SERVER_HOST="127.0.0.1"
SERVER_PORT="8080"
SERVER_CMD="/Users/ahughes/git/llama.cpp/llama-server"  

# GPU configuration
GPU_LAYERS=-1

# Additional configurations
PROMPT_FILE="./prompt_file.json"

# Construct server arguments
SERVER_ARGS="-m $MODEL_PATH -c $CONTEXT_SIZE --host $SERVER_HOST --port $SERVER_PORT -fa"

# Add GPU layers if specified
if [ $GPU_LAYERS -ge 0 ]; then
    SERVER_ARGS="$SERVER_ARGS --n-gpu-layers $GPU_LAYERS"
fi

# Add system prompt file if it exists
if [ -f "$PROMPT_FILE" ]; then
    SERVER_ARGS="$SERVER_ARGS --prompt $PROMPT_FILE -fa --mlock"
fi

# Start the llama.cpp server
echo "Starting llama.cpp server..."
$SERVER_CMD $SERVER_ARGS