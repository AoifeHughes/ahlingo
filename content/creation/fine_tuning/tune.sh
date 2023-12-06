# finetune LORA adapter
/Users/ahughes/git/llama.cpp/finetune \
        --model-base /Users/ahughes/git/LLMs/llama-2-13b-chat.Q4_K_M.gguf \
        --checkpoint-in  /Users/ahughes/git/LLMs/chk-lora-llama-2-13b-chat.Q4_K_M-LATEST.gguf \
        --checkpoint-out /Users/ahughes/git/LLMs/chk-lora-llama-2-13b-chat.Q4_K_M-ITERATION.gguf \
        --lora-out /Users/ahughes/git/LLMs/chk-lora-llama-2-13b-chat.Q4_K_M-ITERATION.bin \
        --train-data "training_data.txt" \
        --save-every 10 \
        --use-checkpointing