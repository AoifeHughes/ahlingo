#!/bin/bash

# Define the directory to search in
DIRECTORY="../languages/French_English"

# Define the output file
OUTPUT_FILE="training_data.txt"

# Empty the output file if it already exists
> "$OUTPUT_FILE"

# Find all .txt files in the directory and its subdirectories
find "$DIRECTORY" -name "prompt_*.txt" | while read -r txt_file; do
    # Extract the base name without the extension
    base_name=$(basename "$txt_file" .txt)

    # Find the corresponding .json file
    json_file=$(find "$DIRECTORY" -name "${base_name}_run_*_response_*.json")

    # Check if the .json file exists
    if [ -f "$json_file" ]; then
        # Concatenate the pair with <s> as a separator, and append to the output file
        echo "<s>" >> "$OUTPUT_FILE"
        cat "$txt_file" "$json_file" >> "$OUTPUT_FILE"
    else
        echo "No matching .json file for $txt_file"
    fi
done

echo "Concatenation complete. Output written to $OUTPUT_FILE"
