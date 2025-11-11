#!/usr/bin/env python3
"""
GGUF Chat Template Extractor

This script extracts the chat template metadata from a GGUF model file
and saves it to a text file.

Usage: python extract_chat_template.py model.gguf [output.txt]
"""

import sys
import os
from pathlib import Path

try:
    from gguf.gguf_reader import GGUFReader
except ImportError:
    print("Error: gguf package not found. Please install it using:")
    print("  pip install gguf")
    print("\nOr if you're in the llama.cpp directory:")
    print("  pip install -e ./gguf-py")
    sys.exit(1)


def extract_chat_template(gguf_file_path, output_file_path=None):
    """
    Extract chat template from a GGUF file and save it to a text file.

    Args:
        gguf_file_path: Path to the GGUF model file
        output_file_path: Path to output text file (optional)

    Returns:
        The chat template string if found, None otherwise
    """
    if not os.path.exists(gguf_file_path):
        print(f"Error: File '{gguf_file_path}' not found.")
        return None

    try:
        # Create a GGUFReader instance
        reader = GGUFReader(gguf_file_path)

        # Look for the chat template in the metadata
        chat_template = None
        chat_template_key = "tokenizer.chat_template"

        # Iterate through all fields to find the chat template
        for key, field in reader.fields.items():
            if key == chat_template_key:
                # The chat template is stored as an array of integers (UTF-8 encoded)
                if hasattr(field, "parts") and hasattr(field, "data"):
                    # Get the first part (chat templates are typically stored as a single string)
                    value = field.parts[field.data[0]]

                    # Convert the array of integers to a string
                    if isinstance(value, (list, tuple)) or hasattr(value, "__iter__"):
                        chat_template = "".join(chr(int(i)) for i in value if i < 128)
                    else:
                        chat_template = str(value)
                else:
                    # Alternative method if the structure is different
                    chat_template = str(
                        field.parts[0] if hasattr(field, "parts") else field.data
                    )

                break

        if chat_template:
            # Determine output file path
            if output_file_path is None:
                base_name = Path(gguf_file_path).stem
                output_file_path = f"{base_name}_chat_template.txt"

            # Save to file
            with open(output_file_path, "w", encoding="utf-8") as f:
                f.write(chat_template)

            print(
                f"Chat template successfully extracted and saved to: {output_file_path}"
            )
            print(f"\nChat template preview (first 200 chars):")
            print("-" * 60)
            print(
                chat_template[:200] + "..."
                if len(chat_template) > 200
                else chat_template
            )
            print("-" * 60)

            return chat_template
        else:
            print(f"Warning: No chat template found in the GGUF file.")
            print("\nAvailable metadata keys:")
            for key in sorted(reader.fields.keys()):
                if key.startswith("tokenizer"):
                    print(f"  - {key}")

            return None

    except Exception as e:
        print(f"Error reading GGUF file: {e}")
        return None


def print_all_metadata(gguf_file_path):
    """
    Print all metadata from a GGUF file for debugging purposes.
    """
    try:
        reader = GGUFReader(gguf_file_path)

        print("\nAll metadata in the GGUF file:")
        print("-" * 60)

        for key, field in reader.fields.items():
            # Skip tensor-related fields as they can be very large
            if not key.startswith("tokenizer") and not key.startswith("general"):
                continue

            print(f"{key}: ", end="")

            try:
                if hasattr(field, "parts") and hasattr(field, "data"):
                    value = field.parts[field.data[0]]
                    if isinstance(value, (list, tuple)) and len(value) > 10:
                        print(f"[Array of {len(value)} elements]")
                    else:
                        print(value)
                else:
                    print(field.data if hasattr(field, "data") else str(field))
            except:
                print("[Unable to display value]")

    except Exception as e:
        print(f"Error reading metadata: {e}")


def main():
    if len(sys.argv) < 2:
        print("Usage: python extract_chat_template.py <model.gguf> [output.txt]")
        print("\nExample:")
        print("  python extract_chat_template.py llama-2-7b-chat.gguf")
        print("  python extract_chat_template.py model.gguf chat_template.txt")
        sys.exit(1)

    gguf_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else None

    # Extract the chat template
    template = extract_chat_template(gguf_file, output_file)

    # If no template found, optionally show all metadata
    if template is None:
        response = input("\nWould you like to see all available metadata? (y/n): ")
        if response.lower() == "y":
            print_all_metadata(gguf_file)


if __name__ == "__main__":
    main()
