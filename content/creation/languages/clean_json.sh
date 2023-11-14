#!/bin/bash

process_json_file() {
    local file=$1
    local temp_file=$(mktemp)

    # Remove everything from '//' to the end of the line and extract JSON object
    sed -e 's/\/\/.*$//' -e '/{/,/}/!d' "$file" > "$temp_file"

    # Check if the processing resulted in a non-empty file
    if [ -s "$temp_file" ]; then
        # Add square brackets to make it a valid JSON array
        echo '[' > "$file"
        cat "$temp_file" >> "$file"
        echo ']' >> "$file"
        rm "$temp_file"
    else
        # Processing failed, possibly no JSON object present or file is empty after comment removal
        echo "No valid JSON object found in file: $file"
        rm "$temp_file"
    fi
}

# Find all .json files and process them
find . -name "*.json" -type f | while read file; do
    process_json_file "$file"
done
