# finetune LORA adapter
/Users/ahughes/git/llama.cpp/finetune \
        --model-base /Users/ahughes/git/LLMs/llama2-7b.gguf \
        --checkpoint-in  /Users/ahughes/git/LLMs/chk-lora-llama2-7b.gguf-LATEST.gguf \
        --checkpoint-out /Users/ahughes/git/LLMs/chk-lora-llama2-7b.gguf-ITERATION.gguf \
        --lora-out /Users/ahughes/git/LLMs/chk-lora-llama2-7b.gguf-ITERATION.bin \
        --train-data "training_data.txt" \
        --save-every 5 \
        --use-checkpointing \
        --ctx 512 \
        --epochs 100 \
        --threads 8	