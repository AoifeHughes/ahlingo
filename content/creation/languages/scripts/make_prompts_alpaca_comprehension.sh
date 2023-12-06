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
    mkdir -p "${Language1}_${Language2}/comprehension/${level}"

    # Loop through each topic
    for topic in "${topics[@]}"
    do
        # Create a prompt for each topic and level
        prompt=$(cat <<EOF
### Instruction: 
Generate a JSON file containing a series of ${Language1} sentences tailored to what you would expect in a $level level text book. The sentences should be conversation about '$topic' and be 2-5 exchanges long. Do not enter comments of any kind as this is not valid JSON.

### Response:
[
  {
    "conversation": [
      {"speaker": "person1", "message": "Sentence in ${Language1}."},
      {"speaker": "person2", "message": "Response in ${Language1}."},
      {"speaker": "person1", "message": "Response in ${Language1}."}
    ],
    "conversation_summary": "Summary of exchange in ${Language2}"
  },
  {
    "conversation": [
      {"speaker": "person1", "message": "Sentence in ${Language1}."},
      {"speaker": "person2", "message": "Response in ${Language1}."},
      {"speaker": "person1", "message": "Response in ${Language1}."},
      {"speaker": "person2", "message": "Response in ${Language1}."},
      {"speaker": "person1", "message": "Response in ${Language1}."}
    ],
    "conversation_summary": "Summary of exchange in ${Language2}"
  }
  // More conversations here
]



###  Instruction: 
Please provide 5 such conversations with varied amount of exchanges. 

EOF
        )

        # Write the prompt to a file in the respective level directory
        echo "$prompt" > "../${Language1}_${Language2}/comprehension/${level}/prompt_alpaca_${topic// /_}.txt"
    done
done
