#!/bin/bash

MODEL_PATH="/Users/ahughes/git/LLMs/LMStudio/bartowski/Llama-3.2-3B-Instruct-GGUF/Llama-3.2-3B-Instruct-Q8_0.gguf"
CONTEXT_SIZE=4096
SERVER_HOST="127.0.0.1"
SERVER_PORT="8080"
SERVER_CMD="/Users/ahughes/git/llama.cpp/llama-server"
PROMPT_FILE="./prompt_file.json"
BATCH_SIZE=512
THREADS=-1
PARALLEL=2

SERVER_ARGS="-m $MODEL_PATH -c $CONTEXT_SIZE --host $SERVER_HOST --port $SERVER_PORT -fa --mlock --no-mmap -t $THREADS --batch-size $BATCH_SIZE -np $PARALLEL --cont-batching --no-escape --ctx-size $CONTEXT_SIZE --rope-scaling yarn --log-disable --cache-reuse 512 --threads-batch $THREADS --poll 50 --grammar JSON"

if [ -f "$PROMPT_FILE" ]; then
    SERVER_ARGS="$SERVER_ARGS --prompt $PROMPT_FILE"
fi

echo "Starting llama.cpp server with optimized settings..."
$SERVER_CMD $SERVER_ARGS