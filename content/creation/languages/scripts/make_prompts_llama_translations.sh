#!/bin/bash

# Define the languages
Language1="French"
Language2="English"

# Define an array of language proficiency levels
levels=(
    "beginner"  
    "intermediate" 
    "advanced" 
)

# Read topics from a file
topics=()
while IFS= read -r line || [[ -n "$line" ]]; do
    topics+=("$line")
done < topics.txt

# Create folders for each language proficiency level and generate prompts
for level in "${levels[@]}"
do
    # Create a directory for the level if it doesn't exist
    mkdir -p "${Language1}_${Language2}/translations/${level}"

    # Loop through each topic
    for topic in "${topics[@]}"
    do
        # Create a prompt for each topic and level
        prompt=$(cat <<EOF
[INST]
Task: Generate a JSON file containing a series of ${Language1} sentences with their ${Language2} translations, tailored to what you would expect in a $level level text book. The sentences should focus on the theme of '$topic'. Sentences should be varied.
[/INST]

[
  {
    "${Language1}": "Example ${Language1} sentence.",
    "${Language2}": "Full ${Language2} translation."
  },
  // More sentences here
]

[INST]
Please provide 10 such sentences.

[/INST]

Sure, here you go:
EOF
        )

        # Write the prompt to a file in the respective level directory
        echo "$prompt" > "../${Language1}_${Language2}/translations/${level}/prompt_${topic// /_}.txt"
    done
done
