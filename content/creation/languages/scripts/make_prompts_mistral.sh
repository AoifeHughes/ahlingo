#!/bin/bash

# Define the language pairs
language1="French"
language2="English"
levels="beginner,advanced"

# Directory containing the template files
template_dir="./prompt_templates"

# Convert language strings into arrays
IFS=',' read -r -a languages1 <<< "$language1"
IFS=',' read -r -a languages2 <<< "$language2"

# Ensure both arrays have the same length
if [ ${#languages1[@]} -ne ${#languages2[@]} ]; then
    echo "Error: Language arrays are not of equal length."
    exit 1
fi

# Iterate over language pairs
for i in "${!languages1[@]}"; do
    # Iterate over files in the directory matching the pattern 'mistral*'
    for file_path in "$template_dir/mistral"*; do
        # Check if the file_path is a regular file
        if [ -f "$file_path" ]; then
            # Extract the last parameter by splitting the base name on '_'
            last_param=$(basename "$file_path" | cut -d'_' -f2 | cut -d'.' -f1)
            # Run the command with the current language pair and other variables
            ./prompt_maker.sh "${languages1[$i]}" "${languages2[$i]}" "$levels" topics.txt "$file_path" "$last_param"
        fi
    done
done
