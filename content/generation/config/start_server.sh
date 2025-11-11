#!/bin/bash

#MODEL_PATH="/Users/ahughes/git/LLMs/LMStudio/QuantFactory/Mistral-Nemo-Instruct-2407-GGUF/Mistral-Nemo-Instruct-2407.Q4_0.gguf"
MODEL_PATH="/Users/ahughes/git/LLMs/LMStudio/lmstudio-community/Mistral-Nemo-Instruct-2407-GGUF/Mistral-Nemo-Instruct-2407-Q8_0.gguf"
CONTEXT_SIZE=8192
SERVER_HOST="127.0.0.1"
SERVER_PORT="8080"
SERVER_CMD="/Users/ahughes/git/llama.cpp/llama-server"
PROMPT_FILE="./prompt_file.json"
BATCH_SIZE=2048
THREADS=-1
PARALLEL=6

SERVER_ARGS="-m $MODEL_PATH -c $CONTEXT_SIZE --host $SERVER_HOST --port $SERVER_PORT -fa --mlock --no-mmap -t $THREADS --batch-size $BATCH_SIZE -np $PARALLEL --cont-batching --no-escape --ctx-size $CONTEXT_SIZE --rope-scaling yarn --log-disable --cache-reuse 512 --threads-batch $THREADS --poll 50 --slots "

if [ -f "$PROMPT_FILE" ]; then
    SERVER_ARGS="$SERVER_ARGS --prompt $PROMPT_FILE"
fi

echo "Starting llama.cpp server with optimized settings..."
$SERVER_CMD $SERVER_ARGS
