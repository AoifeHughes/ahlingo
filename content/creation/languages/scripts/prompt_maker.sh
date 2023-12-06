#!/bin/bash

# Read command line arguments
Language1="$1"
Language2="$2"
levels_string="$3" # Levels as a comma-separated string
topic_file="$4"    # File containing topics
prompt_file="$5"   # File containing the prompt template
exercise_type="$6" # Either "llama" or "alpaca"

# Split levels string into an array
IFS=',' read -r -a levels <<< "$levels_string"

# Read topics from the provided file
topics=()
while IFS= read -r line || [[ -n "$line" ]]; do
    topics+=("$line")
done < "$topic_file"

# Read the prompt template from the provided file
prompt_template=$(<"$prompt_file")

# Create folders for each language proficiency level and generate prompts
for level in "${levels[@]}"
do
    # Create a directory for the level if it doesn't exist
    mkdir -p "../${Language1}_${Language2}/${exercise_type}/${level}"

    # Loop through each topic
    for topic in "${topics[@]}"
    do
        # Create a prompt for each topic and level
        prompt=$(echo "$prompt_template" | sed "s/\${Language1}/${Language1}/g" | sed "s/\${Language2}/${Language2}/g" | sed "s/\$level/${level}/g" | sed "s/\$topic/${topic}/g")

        # Write the prompt to a file in the respective level directory
        echo "$prompt" > "../${Language1}_${Language2}/${exercise_type}/${level}/prompt_${topic// /_}.txt"
    done
done
