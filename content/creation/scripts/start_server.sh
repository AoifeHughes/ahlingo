
MODEL_PATH="/Users/ahughes/git/LLMs/LMStudio/TheBloke/WizardLM-1.0-Uncensored-Llama2-13B-GGUF/wizardlm-1.0-uncensored-llama2-13b.Q8_0.gguf"
CONTEXT_SIZE=1024
SERVER_HOST="127.0.0.1"
SERVER_PORT="8080"
SERVER_CMD="/Users/ahughes/git/llama.cpp/server"
GPU_LAYERS=41
PROMPT_FILE="./prompt_file.json"
SERVER_ARGS="-m $MODEL_PATH -c $CONTEXT_SIZE --host $SERVER_HOST --port $SERVER_PORT --n-gpu-layers $GPU_LAYERS --system-prompt-file $PROMPT_FILE"



# Start the llama.cpp server
echo "Starting llama.cpp server..."
$SERVER_CMD $SERVER_ARGS 