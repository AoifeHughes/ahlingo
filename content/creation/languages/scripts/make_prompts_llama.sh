#!/bin/bash
./prompt_maker.sh French English "beginner" topics.txt ./prompt_templates/llama_verbs.txt
./prompt_maker.sh French English "beginner" topics.txt ./prompt_templates/llama_pairs.txt
./prompt_maker.sh French English "beginner" topics.txt ./prompt_templates/llama_translation.txt
./prompt_maker.sh French English "beginner" topics.txt ./prompt_templates/llama_comprehension.txt
