#!/bin/bash
language1=$1
language2=$2
./prompt_maker.sh $language1 $language2 "beginner" topics.txt ./prompt_templates/llama_verbs.txt "verbs"
./prompt_maker.sh $language1 $language2 "beginner" topics.txt ./prompt_templates/llama_pairs.txt "pairs"
./prompt_maker.sh $language1 $language2 "beginner" topics.txt ./prompt_templates/llama_translation.txt "translation"
./prompt_maker.sh $language1 $language2 "beginner" topics.txt ./prompt_templates/llama_comprehension.txt "comprehension"
