#!/bin/bash

# Define the languages
Language1="French"
Language2="English"

# Path to the CSV file
csv_path="chapters.csv"

# Counter for chapter numbering
chapter_counter=1

# Read the CSV and split into chapters and topics
while IFS=';' read -r chapter topics; do
    if [[ "$chapter" != "Chapter" ]]; then # Skip the header
        # Create a directory for the chapter, with numbering, if it doesn't exist
        mkdir -p "../${Language1}_${Language2}/By_Chapter/${chapter_counter}_${chapter}"

        # Remove leading and trailing quotes from topics, if present
        topics=${topics%\"}
        topics=${topics#\"}

        # Split topics into an array
        IFS=';' read -r -a topics_array <<< "$topics"

        # Loop through each topic
        for topic in "${topics_array[@]}"
        do
            # Trim leading and trailing spaces
            topic=$(echo $topic | xargs)

            # Create a prompt for each topic
            prompt=$(cat <<EOF
[INST]
Task: Generate a JSON file containing a series of ${Language1} words with their ${Language2} translations, tailored for learners studying the '$topic' topic under '$chapter'. 
[/INST]

[
  {
    "${Language1}": "Example ${Language1} sentence.",
    "${Language2}": "Full ${Language2} translation."
  },
]

[INST]
Please provide 10 such sentences in JSON format only.

[/INST]

Sure, here you go:
EOF
            )

            # Write the prompt to a file in the respective chapter directory
            echo "$prompt" > "../${Language1}_${Language2}/By_Chapter/${chapter_counter}_${chapter}/prompt_${topic// /_}.txt"
        done

        # Increment the chapter counter
        ((chapter_counter++))
    fi
done < $csv_path
