#!/bin/bash

# Directory to search for JSON files
search_dir="./training_data"

# Output file
output_file="combined.json"

# Start the output file with an empty array
echo "[]" > "$output_file"

# Function to add a new entry to the output file
add_entry() {
    local instruction="$1"
    local response="$2"
    jq --arg instruction "$instruction" --arg response "$response" '. += [{"instruction": $instruction, "output": $response, "input": ""}]' "$output_file" > tmpfile && mv tmpfile "$output_file"
}

# Find all JSON files and process them
find "$search_dir" -type f -name '*.json' | while read -r file; do
    # Extract the text before the JSON part and remove specific strings
    instruction=$(awk '/\[/ {exit} {print}' "$file" | sed 's/```json//g' | sed 's/Response://g' | tr -d '\n')

    # Extract the JSON part
    json_content=$(awk '/\[/,EOF' "$file")

    # Validate JSON content
    if jq empty <<< "$json_content" 2>/dev/null; then
        # Convert JSON content to a string
        json_string=$(jq -c . <<< "$json_content")

        # Add entry to the output file
        add_entry "$instruction" "$json_string"
    else
        echo "Invalid JSON in file: $file"
    fi
done

echo "Combined JSON created at $output_file"
