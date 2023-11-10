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
Task: Generate a JSON file containing a series of French conversations with their English translations, tailored for a $level learner. The conversations should focus on the theme of '$topic'. Each conversation should be brief, consisting of two to three sentences. Provide both a full sentence translation and a word-for-word translation in English.

Format Example:

[
  {
    "French": "Example French sentence.",
    "English": {
      "Full": "Full English translation.",
      "Word-for-Word": "Direct word-for-word English translation."
    }
  },
  // More conversations here
]

Please provide 5 such conversation pairs in JSON format only for the topic '$topic'. Do not include any other responses or explanations.
EOF
        )

        # Write the prompt to a file in the respective level directory
        echo "$prompt" > "${level}/prompt_${topic// /_}.txt"
    done
done
