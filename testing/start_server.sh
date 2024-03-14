


MODEL_PATH="/Users/aoife/.cache/lm-studio/models/TheBloke/OpenHermes-2.5-Mistral-7B-GGUF/openhermes-2.5-mistral-7b.Q4_K_S.gguf"
CONTEXT_SIZE=512
SERVER_HOST="127.0.0.1"
SERVER_PORT="8080"
SERVER_CMD="/Users/aoife/git/llama.cpp/server"
GPU_LAYERS=33
PROMPT_FILE="./prompt_file.json"
SERVER_ARGS="-m $MODEL_PATH -c $CONTEXT_SIZE --host $SERVER_HOST --port $SERVER_PORT --n-gpu-layers $GPU_LAYERS --system-prompt-file $PROMPT_FILE"



# Start the llama.cpp server
echo "Starting llama.cpp server..."
$SERVER_CMD $SERVER_ARGS 