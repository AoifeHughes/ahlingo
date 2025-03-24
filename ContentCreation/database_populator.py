# -*- coding: utf-8 -*-
import json
from pathlib import Path
from typing import Dict
import uuid
from database_manager import LanguageDB


class DatabasePopulator:
    def __init__(self, db_path: str = "./database/languageLearningDatabase.db"):
        self.db_path = Path(db_path)
        self.content_dir = Path("content")

    def reset_database(self):
        """Delete existing database file if it exists."""
        if self.db_path.exists():
            print(f"Deleting existing database file: {self.db_path}")
            self.db_path.unlink()

    def _parse_file_path(self, file_path: Path) -> Dict[str, str]:
        """Parse file path to extract metadata."""
        parts = file_path.parts
        # Assuming path structure: content/language/exercise_type/topic/difficulty.json
        return {
            "language": parts[1],
            "exercise_type": parts[2],
            "topic": parts[3].replace("_", " "),
            "difficulty": parts[4].split(".")[0],
        }

    def _add_content_from_file(self, file_path: Path, db: LanguageDB):
        """Add content from a single JSON file to the database."""
        metadata = self._parse_file_path(file_path)
        print(f"Adding content for: {metadata}")

        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content = json.load(f)

            for idx, exercise in enumerate(content):
                exercise_id = str(uuid.uuid4())
                exercise_name = f"{metadata['topic']} {metadata['exercise_type'].title()} {idx + 1} - ID: {exercise_id}"

                try:
                    if metadata["exercise_type"] == "pairs":
                        db.add_pair_exercise(
                            exercise_name=exercise_name,
                            language=metadata["language"],
                            topic=metadata["topic"],
                            difficulty_level=metadata["difficulty"],
                            language_1="English",
                            language_2=metadata["language"],
                            language_1_content=exercise["English"],
                            language_2_content=exercise[metadata["language"]],
                        )

                    elif metadata["exercise_type"] == "translations":
                        db.add_translation_exercise(
                            exercise_name=exercise_name,
                            language=metadata["language"],
                            topic=metadata["topic"],
                            difficulty_level=metadata["difficulty"],
                            language_1="English",
                            language_2=metadata["language"],
                            language_1_content=exercise["English"],
                            language_2_content=exercise[metadata["language"]],
                        )

                    else:  # conversations
                        db.add_conversation_exercise(
                            exercise_name=exercise_name,
                            language=metadata["language"],
                            topic=metadata["topic"],
                            difficulty_level=metadata["difficulty"],
                            conversations=exercise["conversation"],
                            summary=exercise["conversation_summary"],
                        )

                    print(
                        f"Added {metadata['exercise_type']} exercise {idx + 1} with ID: {exercise_id}"
                    )

                except Exception as e:
                    print(f"Error adding exercise {idx + 1} from {file_path}: {str(e)}")

        except json.JSONDecodeError as e:
            print(f"Error reading JSON from {file_path}: {str(e)}")
        except Exception as e:
            print(f"Error processing file {file_path}: {str(e)}")

    def populate_database(self):
        """Populate the database with content from JSON files."""
        print("Populating database with JSON files...")

        with LanguageDB(str(self.db_path)) as db:
            for file_path in self.content_dir.rglob("*.json"):
                if "broken" not in file_path.name:
                    self._add_content_from_file(file_path, db)


def main():
    """Main function to reset and repopulate the database."""
    populator = DatabasePopulator()
    populator.reset_database()
    populator.populate_database()
    print("Database population complete.")


if __name__ == "__main__":
    main()
