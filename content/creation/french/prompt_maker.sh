#!/bin/bash

# Define an array of topics
topics=("Introductions" "Asking Directions" "Daily Life" "Travel" "Work" "Culture")

# Define an array of language proficiency levels
levels=("beginner" "intermediate" "advanced")

# Create folders for each language proficiency level and generate prompts
for level in "${levels[@]}"
do
    # Create a directory for the level if it doesn't exist
    mkdir -p "$level"

    # Loop through each topic
    for topic in "${topics[@]}"
    do
        # Create a prompt for each topic and level
        prompt=$(cat <<EOF
Task: Generate a JSON file containing a series of French sentences with their English translations, tailored for a $level learner. The sentences should focus on the theme of '$topic'. Each entry should be a single sentence. Do not repeat a sentence or ones too similar to it.

Format Example:

[
  {
    "French": "Example French sentence.",
    "English": "Full English translation."
  },
  // More sentences here
]

Please provide 20 such sentences in JSON format only for the topic '$topic'. Ensure valid JSON is given. Do not include any other responses or explanations.
EOF
        )

        # Write the prompt to a file in the respective level directory
        echo "$prompt" > "${level}/prompt_${topic// /_}.txt"
    done
done
