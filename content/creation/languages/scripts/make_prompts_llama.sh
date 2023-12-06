#!/bin/bash
./prompt_maker.sh French English "beginner" topics.txt ./prompt_templates/llama_verbs.txt "verbs"
./prompt_maker.sh French English "beginner" topics.txt ./prompt_templates/llama_pairs.txt "pairs"
./prompt_maker.sh French English "beginner" topics.txt ./prompt_templates/llama_translation.txt "translation"
./prompt_maker.sh French English "beginner" topics.txt ./prompt_templates/llama_comprehension.txt "comprehension"
