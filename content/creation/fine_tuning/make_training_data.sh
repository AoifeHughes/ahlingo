#!/bin/bash

# Define the directory to search in
DIRECTORY="../languages/prompts_responses/"

# Define the output file
OUTPUT_FILE="training_data.txt"

# Empty the output file if it already exists
> "$OUTPUT_FILE"

# Find all .txt files in the directory and its subdirectories
find "$DIRECTORY" -name "prompt_*.txt" | while read -r txt_file; do
    # Extract the directory of the txt file
    txt_dir=$(dirname "$txt_file")

    # Extract the base name without the extension
    base_name=$(basename "$txt_file" .txt)

    # Find the corresponding .json file in the same directory as the txt file
    json_file=$(find "$txt_dir" -name "${base_name}_run_*_response_*.json" -print -quit)

    # Check if the .json file exists
    if [ -f "$json_file" ]; then
        # Validate JSON file
        if jq empty "$json_file" > /dev/null 2>&1; then
            # Append <s> at the beginning of each entry, replace tags and concatenate
            echo "<s>" >> "$OUTPUT_FILE"
            sed 's/\[INST\]/### Instruction:\n/g; s/\[\\INST\]/### Response:\n/g; s/<\/s>/\n/g; s/<s>/\n<s>/g' "$txt_file" >> "$OUTPUT_FILE"
            echo "<s>" >> "$OUTPUT_FILE"
            cat "$json_file" >> "$OUTPUT_FILE"
        else
            echo "Invalid JSON: $json_file"
        fi
    else
        echo "No matching .json file for $txt_file"
    fi
done

echo "Concatenation complete. Output written to $OUTPUT_FILE"
