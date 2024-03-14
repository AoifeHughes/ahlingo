# finetune LORA adapter
/Users/ahughes/git/llama.cpp/finetune \
        --model-base /Users/ahughes/git/LLMs/llama-2-13b-chat.Q4_K_M.gguf \
        --checkpoint-in  /Users/ahughes/git/LLMs/llama-13-chat-ft/chk-lora-llama2-13b.gguf-LATEST.gguf \
        --checkpoint-out /Users/ahughes/git/LLMs/llama-13-chat-ft/chk-lora-llama2-13b.gguf-ITERATION.gguf \
        --lora-out /Users/ahughes/git/LLMs/llama-13-chat-ft/chk-lora-llama2-13b.gguf-ITERATION.bin \
        --train-data "llm.cpp.txt" \
        --save-every 20 \
        --use-checkpointing \
        --ctx 600 \
        --epochs 10 \
        --threads 8	\
        --sample-start "<s>"
