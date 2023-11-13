#!/bin/bash

# Function to extract JSON object and convert it into an array
extract_json_object() {
    local file=$1
    local temp_file=$(mktemp)

    # Extract everything between the first '{' and the last '}'
    sed -n '/{/,/}/p' "$file" > "$temp_file"

    # Check if the extraction resulted in a non-empty file
    if [ -s "$temp_file" ]; then
        # Add square brackets to make it a valid JSON array
        echo '[' > "$file"
        cat "$temp_file" >> "$file"
        echo ']' >> "$file"
        rm "$temp_file"
    else
        # Extraction failed, possibly no JSON object present
        echo "No JSON object found in file: $file"
        rm "$temp_file"
    fi
}

# Find all .json files and process them
find . -name "*.json" -type f | while read file; do
    extract_json_object "$file"
done
