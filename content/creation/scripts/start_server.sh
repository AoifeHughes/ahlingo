#!/bin/bash

# Path to the model
MODEL_PATH="/Users/ahughes/git/LLMs/LMStudio/QuantFactory/dolphin-2.9-llama3-8b-GGUF/dolphin-2.9-llama3-8b.Q4_K_M.gguf"

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
    SERVER_ARGS="$SERVER_ARGS --system-prompt-file $PROMPT_FILE"
fi

# Start the llama.cpp server
echo "Starting llama.cpp server..."
$SERVER_CMD $SERVER_ARGS