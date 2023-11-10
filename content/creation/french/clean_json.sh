#!/bin/bash

# Function to extract JSON array from file
extract_json_array() {
    local file=$1
    local temp_file=$(mktemp)

    # Extract everything between the first '[' and the last ']'
    sed -n '/\[/,/\]/p' "$file" > "$temp_file"

    # Check if the extraction resulted in a non-empty file
    if [ -s "$temp_file" ]; then
        # Replace the original file with the extracted content
        mv "$temp_file" "$file"
    else
        # Extraction failed, possibly no JSON array present
        echo "No JSON array found in file: $file"
        rm "$temp_file"
    fi
}

# Find all .json files and process them
find . -name "*.json" -type f | while read file; do
    extract_json_array "$file"
done
