# -*- coding: utf-8 -*-
"""
Database validation script using locally running LLM to validate exercise quality.
"""

import openai
import outlines
import json
import sqlite3
from typing import Dict, List, Any, Optional, Tuple
from tqdm import tqdm
from pathlib import Path
import uuid
import warnings
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading

from content.generation.models.validation_models import (
    ValidationResult,
    get_validation_schema,
    parse_validation_result,
)
from content.generation.utils.exercise_converters import get_converter, identify_exercise_type
from content.database.database_manager import LanguageDB


# Centralized model configuration (reuse from outlines_generator)
MODEL_CONFIG = {
    "base_url": "http://localhost:11434/v1",
    "api_key": "sk-no-key-required",
    "temperature": 0.3,  # Lower temperature for more consistent validation
    "no_think": False,  # Set to True to prepend /no_think to prompts
    "debug": False,  # Set to True to show debug info and pause for user input
}


def prepare_prompt(prompt: str) -> str:
    """Prepare prompt by adding /no_think prefix if enabled."""
    if MODEL_CONFIG.get("no_think", False):
        return "/no_think\n" + prompt
    return prompt


def clean_model_response(response: str) -> str:
    """Clean model response by removing <think> blocks and other artifacts."""
    import re

    # Remove <think>...</think> blocks (including multiline)
    response = re.sub(
        r"<think>.*?</think>", "", response, flags=re.DOTALL | re.IGNORECASE
    )

    # Remove any leading/trailing whitespace
    response = response.strip()

    return response


def debug_show_error(
    prompt: str, response: str, error: str, context: str = "Validation"
):
    """Show debug information for errors and pause for user input if debug mode is enabled."""
    if MODEL_CONFIG.get("debug", False):
        print("\n" + "=" * 80)
        print(f"🚨 DEBUG ERROR: {context}")
        print("=" * 80)
        print(f"\n❌ ERROR: {error}")
        print("\n📝 PROMPT SENT TO MODEL:")
        print("-" * 40)
        print(prompt)
        print("-" * 40)
        print("\n🤖 MODEL RESPONSE:")
        print("-" * 40)
        print(repr(response))  # Use repr to show exact string with escape chars
        print("-" * 40)
        print(f"\n📊 RESPONSE DETAILS:")
        print(f"  Length: {len(response)} characters")
        print(f"  Type: {type(response)}")
        if response.strip():
            print(f"  First 100 chars: {response[:100]!r}")
            print(f"  Last 100 chars: {response[-100:]!r}")
        else:
            print("  ⚠️  RESPONSE IS EMPTY OR WHITESPACE ONLY!")
        print("\n" + "=" * 80)
        input("🔍 Press ENTER to continue after error...")
        print()


class DatabaseValidator:
    """Main class for validating database exercises."""

    def __init__(self, db_path: str, quality_threshold: int = 6):
        """
        Initialize validator.

        Args:
            db_path: Path to the language learning database
            quality_threshold: Minimum quality score (1-10) to keep exercises
        """
        self.db_path = db_path
        self.quality_threshold = quality_threshold
        self.model = None
        self.validation_results = []

    def setup_model(self):
        """Setup the validation model."""
        warnings.filterwarnings(
            "ignore", category=RuntimeWarning, message=".*Event loop is closed.*"
        )

        try:
            # Create OpenAI client first
            client = openai.OpenAI(
                base_url=MODEL_CONFIG["base_url"],
                api_key=MODEL_CONFIG["api_key"],
            )

            # Get the first available model from the server
            try:
                models = client.models.list()
                if models.data:
                    model_name = models.data[0].id
                    print(f"Using model: {model_name}")
                else:
                    raise RuntimeError("No models available on server")
            except Exception as e:
                print(f"Failed to get models from server: {e}")
                # Try common model names as fallbacks
                for fallback in ["qwen3-4b", "mistral", "llama3", "default"]:
                    try:
                        model_name = fallback
                        print(f"Falling back to model: {model_name}")
                        break
                    except:
                        continue
                else:
                    raise RuntimeError("No accessible models found")

            # Create Outlines model with specific model name
            self.model = outlines.models.OpenAI(client, model_name=model_name)
        except Exception as e:
            print(f"Error setting up outlines model: {e}")
            # Fallback to direct OpenAI client
            self.model = openai.OpenAI(
                base_url=MODEL_CONFIG["base_url"], api_key=MODEL_CONFIG["api_key"]
            )

    def get_exercise_counts(
        self, exercise_type_filter: Optional[str] = None
    ) -> Dict[str, int]:
        """Get exercise counts for planning batch processing."""
        with LanguageDB(self.db_path) as db:
            if exercise_type_filter:
                return db.get_exercise_counts(exercise_type_filter)
            else:
                # Get counts for all exercise types
                all_counts = db.get_exercise_counts()
                conversation_counts = db.get_exercise_counts("conversations")
                pair_counts = db.get_exercise_counts("pairs")
                translation_counts = db.get_exercise_counts("translations")
                fill_blank_counts = db.get_exercise_counts("fill_in_blank")

                return {
                    "total": all_counts["total"],
                    "unvalidated": all_counts["unvalidated"],
                    "validated": all_counts["validated"],
                    "by_type": {
                        "conversation": conversation_counts,
                        "pair": pair_counts,
                        "translation": translation_counts,
                        "fill_in_blank": fill_blank_counts,
                    },
                }

    def validate_exercise(self, exercise_data: Dict[str, Any]) -> ValidationResult:
        """Validate a single exercise using the LLM."""
        try:
            # Identify exercise type and get converter
            exercise_type = exercise_data.get("exercise_type", "unknown")
            if exercise_type == "unknown":
                exercise_type = identify_exercise_type(exercise_data)

            language = exercise_data.get("language", "Unknown")
            level = exercise_data.get("difficulty_level", "Unknown")

            # Convert exercise to text
            converter = get_converter(exercise_type, language, level)
            exercise_text = converter.convert_to_text(exercise_data)

            # Generate validation prompt
            prompt = converter.get_validation_prompt(exercise_text)

            # Get validation schema
            schema = get_validation_schema(exercise_type)

            # Validate using the model
            if hasattr(self.model, "chat") and hasattr(self.model.chat, "completions"):
                # OpenAI client fallback - get available models and use the first one
                try:
                    models = self.model.models.list()
                    model_name = models.data[0].id if models.data else "default"
                except:
                    model_name = "default"  # Fallback if models endpoint fails

                prepared_prompt = prepare_prompt(prompt)
                response = self.model.chat.completions.create(
                    model=model_name,
                    messages=[{"role": "user", "content": prepared_prompt}],
                    temperature=MODEL_CONFIG["temperature"],
                )
                result_text = response.choices[0].message.content

            else:
                # Outlines structured generation
                generator = outlines.Generator(self.model)
                prepared_prompt = prepare_prompt(prompt)
                result_text = generator(prepared_prompt)

            # Clean the response before parsing
            cleaned_result_text = clean_model_response(result_text)

            # Parse the result
            try:
                validation_result = parse_validation_result(
                    cleaned_result_text, exercise_type
                )
                return validation_result
            except Exception as parse_error:
                # Show debug info for parsing errors
                exercise_id = exercise_data.get("id", "unknown")
                debug_show_error(
                    prepared_prompt,
                    result_text,
                    f"Validation Parse Error: {parse_error}",
                    f"Validation (exercise_id={exercise_id})",
                )
                raise parse_error

        except Exception as e:
            exercise_id = exercise_data.get("id", "unknown")
            print(f"Error validating exercise {exercise_id}: {e}")
            # Show debug info for general validation errors
            if "prepared_prompt" in locals() and "result_text" in locals():
                debug_show_error(
                    prepared_prompt,
                    result_text,
                    f"Validation Error: {e}",
                    f"Validation (exercise_id={exercise_id})",
                )
            # Return failed validation
            return ValidationResult(
                is_correct_language=False,
                has_correct_grammar=False,
                is_translation_accurate=False,
                is_culturally_appropriate=False,
                is_educational_quality=False,
                overall_quality_score=1,
                issues_found=[f"Validation error: {str(e)}"],
            )

    def validate_exercise_batch(
        self, exercises_batch: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Validate a batch of exercises (worker function for parallel processing)."""
        batch_results = []

        for exercise in exercises_batch:
            try:
                # Validate the exercise
                validation_result = self.validate_exercise(exercise)

                # Store result with exercise info
                result_data = {
                    "exercise_id": exercise.get("id"),
                    "exercise_type": exercise.get("exercise_type"),
                    "language": exercise.get("language"),
                    "level": exercise.get("difficulty_level"),
                    "topic": exercise.get("topic"),
                    "validation": validation_result.dict(),
                    "passed": validation_result.overall_quality_score
                    >= self.quality_threshold,
                }

                batch_results.append(result_data)

            except Exception as e:
                print(
                    f"Failed to validate exercise {exercise.get('id', 'unknown')}: {e}"
                )
                batch_results.append(
                    {
                        "exercise_id": exercise.get("id"),
                        "error": str(e),
                        "failed_validation": True,
                    }
                )

        return batch_results

    def validate_all_exercises(
        self,
        max_exercises: Optional[int] = None,
        exercise_type_filter: Optional[str] = None,
        max_workers: int = 5,
        batch_size: int = 50,
    ) -> Dict[str, Any]:
        """
        Validate all exercises in the database using database batching and parallel processing.

        Args:
            max_exercises: Limit number of exercises to validate (for testing)
            exercise_type_filter: Filter exercises by type
            max_workers: Number of parallel workers (default: 5)
            batch_size: Number of exercises per batch (default: 50)

        Returns:
            Dictionary with validation statistics and results
        """
        if self.model is None:
            self.setup_model()

        # Get exercise counts first
        print("Getting exercise counts...")
        counts = self.get_exercise_counts(exercise_type_filter)
        total_unvalidated = counts["unvalidated"]

        if max_exercises:
            total_unvalidated = min(total_unvalidated, max_exercises)

        print(f"Found {counts['total']} total exercises")
        print(f"Already validated: {counts['validated']}")
        print(f"Need to validate: {total_unvalidated}")

        if total_unvalidated == 0:
            print("No exercises need validation!")
            return {
                "total_exercises": counts["total"],
                "validated_exercises": [],
                "failed_validations": [],
                "statistics": {
                    "passed": 0,
                    "failed": 0,
                    "by_type": {},
                    "by_language": {},
                    "average_score": 0,
                },
            }

        print(
            f"Validating {total_unvalidated} exercises with {max_workers} parallel workers..."
        )

        results = {
            "total_exercises": total_unvalidated,
            "validated_exercises": [],
            "failed_validations": [],
            "statistics": {
                "passed": 0,
                "failed": 0,
                "by_type": {},
                "by_language": {},
                "average_score": 0,
            },
        }

        # Determine exercise types to process
        exercise_types = ["conversation", "pair", "translation", "fill_in_blank"]
        if exercise_type_filter:
            exercise_types = [exercise_type_filter]

        total_processed = 0
        total_score = 0
        results_lock = threading.Lock()

        # Use ThreadPoolExecutor for parallel validation
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            with tqdm(
                total=total_unvalidated, desc="Database Batch Validation Progress"
            ) as pbar:

                for exercise_type in exercise_types:
                    print(f"\nProcessing {exercise_type} exercises...")
                    offset = 0

                    while total_processed < total_unvalidated:
                        # Fetch batch from database
                        with LanguageDB(self.db_path) as db:
                            batch_exercises = db.get_exercises_batch(
                                exercise_type=exercise_type,
                                batch_size=batch_size,
                                offset=offset,
                                only_unvalidated=True,
                            )

                        if not batch_exercises:
                            break  # No more exercises of this type

                        # Submit batch for validation
                        future = executor.submit(
                            self.validate_exercise_batch, batch_exercises
                        )

                        try:
                            batch_results = future.result()
                            validated_ids = []

                            # Thread-safe aggregation of results
                            with results_lock:
                                for result_data in batch_results:
                                    if "failed_validation" in result_data:
                                        # This was a failed validation
                                        results["failed_validations"].append(
                                            {
                                                "exercise_id": result_data.get(
                                                    "exercise_id"
                                                ),
                                                "error": result_data.get("error"),
                                            }
                                        )
                                    else:
                                        # This was a successful validation
                                        results["validated_exercises"].append(
                                            result_data
                                        )
                                        validated_ids.append(result_data["exercise_id"])

                                        # Update statistics
                                        if result_data["passed"]:
                                            results["statistics"]["passed"] += 1
                                        else:
                                            results["statistics"]["failed"] += 1

                                        # Track by type and language
                                        ex_type = result_data["exercise_type"]
                                        language = result_data["language"]

                                        if (
                                            ex_type
                                            not in results["statistics"]["by_type"]
                                        ):
                                            results["statistics"]["by_type"][
                                                ex_type
                                            ] = {"passed": 0, "failed": 0}
                                        if (
                                            language
                                            not in results["statistics"]["by_language"]
                                        ):
                                            results["statistics"]["by_language"][
                                                language
                                            ] = {"passed": 0, "failed": 0}

                                        if result_data["passed"]:
                                            results["statistics"]["by_type"][ex_type][
                                                "passed"
                                            ] += 1
                                            results["statistics"]["by_language"][
                                                language
                                            ]["passed"] += 1
                                        else:
                                            results["statistics"]["by_type"][ex_type][
                                                "failed"
                                            ] += 1
                                            results["statistics"]["by_language"][
                                                language
                                            ]["failed"] += 1

                                        total_score += result_data["validation"][
                                            "overall_quality_score"
                                        ]

                            # Mark exercises as validated in database
                            if validated_ids:
                                with LanguageDB(self.db_path) as db:
                                    db.mark_exercises_as_validated(validated_ids)

                            # Update progress
                            batch_processed = len(batch_exercises)
                            total_processed += batch_processed
                            pbar.update(batch_processed)

                        except Exception as e:
                            print(f"Error processing batch at offset {offset}: {e}")
                            pbar.update(len(batch_exercises))

                        offset += batch_size

                        # Break if we've reached the max_exercises limit
                        if max_exercises and total_processed >= max_exercises:
                            break

                    # Break outer loop if we've reached the limit
                    if max_exercises and total_processed >= max_exercises:
                        break

        # Calculate average score
        if results["validated_exercises"]:
            results["statistics"]["average_score"] = total_score / len(
                results["validated_exercises"]
            )

        return results

    def remove_failed_exercises(
        self, validation_results: Dict[str, Any], dry_run: bool = True
    ) -> Dict[str, Any]:
        """
        Remove exercises that failed validation from the database.

        Args:
            validation_results: Results from validate_all_exercises()
            dry_run: If True, only show what would be removed without actually removing

        Returns:
            Dictionary with removal statistics
        """
        failed_exercises = [
            ex for ex in validation_results["validated_exercises"] if not ex["passed"]
        ]

        removal_stats = {
            "total_to_remove": len(failed_exercises),
            "by_type": {},
            "by_language": {},
            "removed_ids": [],
            "dry_run": dry_run,
        }

        if not failed_exercises:
            print("No exercises to remove - all passed validation!")
            return removal_stats

        print(
            f"{'Would remove' if dry_run else 'Removing'} {len(failed_exercises)} failed exercises..."
        )

        # Group by type for removal
        exercises_by_type = {}
        for ex in failed_exercises:
            ex_type = ex["exercise_type"]
            if ex_type not in exercises_by_type:
                exercises_by_type[ex_type] = []
            exercises_by_type[ex_type].append(ex)

        if not dry_run:
            with LanguageDB(self.db_path) as db:
                for ex_type, exercises in exercises_by_type.items():
                    exercise_ids = [ex["exercise_id"] for ex in exercises]

                    if ex_type == "conversation":
                        db.remove_conversation_exercises(exercise_ids)
                    elif ex_type == "pair":
                        db.remove_pair_exercises(exercise_ids)
                    elif ex_type == "translation":
                        db.remove_translation_exercises(exercise_ids)
                    elif ex_type == "fill_in_blank":
                        db.remove_fill_in_blank_exercises(exercise_ids)

                    removal_stats["removed_ids"].extend(exercise_ids)

        # Update statistics
        for ex in failed_exercises:
            ex_type = ex["exercise_type"]
            language = ex["language"]

            removal_stats["by_type"][ex_type] = (
                removal_stats["by_type"].get(ex_type, 0) + 1
            )
            removal_stats["by_language"][language] = (
                removal_stats["by_language"].get(language, 0) + 1
            )

        return removal_stats

    def save_validation_report(
        self, validation_results: Dict[str, Any], output_path: str
    ):
        """Save detailed validation report to JSON file."""
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(validation_results, f, indent=2, ensure_ascii=False)

        print(f"Validation report saved to: {output_path}")


def run_validation(
    db_path: str,
    quality_threshold: int = 6,
    max_exercises: Optional[int] = None,
    remove_failed: bool = False,
    dry_run: bool = True,
    report_path: Optional[str] = None,
    max_workers: int = 20,
    batch_size: int = 50,
    no_think: bool = False,
    debug: bool = False,
    exercise_type: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Main function to run database validation.

    Args:
        db_path: Path to the database
        quality_threshold: Minimum score to keep exercises (1-10)
        max_exercises: Limit exercises to validate (for testing)
        remove_failed: Whether to remove failed exercises
        dry_run: If True, don't actually remove exercises
        report_path: Path to save validation report
        max_workers: Number of parallel workers (default: 5)
        batch_size: Number of exercises per batch (default: 50)
        no_think: If True, prepend /no_think to prompts
        debug: If True, enable debug mode with prompt/response inspection
        exercise_type: Only validate specific exercise type (conversation, pair, translation, fill_in_blank)

    Returns:
        Validation results dictionary
    """
    # Set global flags
    MODEL_CONFIG["no_think"] = no_think
    MODEL_CONFIG["debug"] = debug

    validator = DatabaseValidator(db_path, quality_threshold)

    print(f"Starting database validation...")
    print(f"Database: {db_path}")
    print(f"Quality threshold: {quality_threshold}/10")
    print(f"Max exercises: {max_exercises or 'All'}")
    print(f"Exercise type filter: {exercise_type or 'All'}")
    print(f"Parallel workers: {max_workers}")
    print(f"Batch size: {batch_size}")

    # Show initial validation status
    print("\n=== INITIAL VALIDATION STATUS ===")
    counts = validator.get_exercise_counts()
    print(f"Total exercises in database: {counts['total']}")
    print(f"Already validated: {counts['validated']}")
    print(f"Need validation: {counts['unvalidated']}")

    if "by_type" in counts:
        print("\nBy exercise type:")
        for ex_type, type_counts in counts["by_type"].items():
            print(
                f"  {ex_type}: {type_counts['unvalidated']} unvalidated / {type_counts['total']} total"
            )

    # Run validation
    results = validator.validate_all_exercises(
        max_exercises, exercise_type, max_workers, batch_size
    )

    # Print summary
    stats = results["statistics"]
    print(f"\n=== VALIDATION SUMMARY ===")
    print(f"Total exercises: {results['total_exercises']}")
    print(f"Successfully validated: {len(results['validated_exercises'])}")
    print(f"Failed validations: {len(results['failed_validations'])}")
    print(f"Passed quality check: {stats['passed']}")
    print(f"Failed quality check: {stats['failed']}")
    print(f"Average quality score: {stats['average_score']:.2f}/10")

    print(f"\n=== BY EXERCISE TYPE ===")
    for ex_type, counts in stats["by_type"].items():
        total = counts["passed"] + counts["failed"]
        pass_rate = (counts["passed"] / total * 100) if total > 0 else 0
        print(f"{ex_type}: {counts['passed']}/{total} passed ({pass_rate:.1f}%)")

    print(f"\n=== BY LANGUAGE ===")
    for language, counts in stats["by_language"].items():
        total = counts["passed"] + counts["failed"]
        pass_rate = (counts["passed"] / total * 100) if total > 0 else 0
        print(f"{language}: {counts['passed']}/{total} passed ({pass_rate:.1f}%)")

    # Remove failed exercises if requested
    if remove_failed and stats["failed"] > 0:
        print(f"\n=== REMOVING FAILED EXERCISES ===")
        removal_stats = validator.remove_failed_exercises(results, dry_run)

        if dry_run:
            print(f"DRY RUN: Would remove {removal_stats['total_to_remove']} exercises")
        else:
            print(f"Removed {removal_stats['total_to_remove']} exercises")

        for ex_type, count in removal_stats["by_type"].items():
            print(f"  {ex_type}: {count}")

    # Save report if requested
    if report_path:
        validator.save_validation_report(results, report_path)

    return results


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(
        description="Validate language learning database exercises"
    )
    parser.add_argument(
        "--db-path",
        default="../database/languageLearningDatabase.db",
        help="Path to database file",
    )
    parser.add_argument(
        "--threshold", type=int, default=6, help="Quality threshold (1-10, default: 6)"
    )
    parser.add_argument(
        "--max-exercises",
        type=int,
        help="Limit number of exercises to validate (for testing)",
    )
    parser.add_argument(
        "--remove-failed",
        action="store_true",
        help="Remove exercises that fail validation",
    )
    parser.add_argument(
        "--no-dry-run",
        action="store_true",
        help="Actually remove exercises (not just show what would be removed)",
    )
    parser.add_argument(
        "--report", type=str, help="Path to save validation report JSON file"
    )
    parser.add_argument(
        "--max-workers",
        type=int,
        default=5,
        help="Number of parallel workers (default: 5)",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=50,
        help="Number of exercises per batch (default: 50)",
    )
    parser.add_argument(
        "--nothink", action="store_true", help="Prepend /no_think to model prompts"
    )
    parser.add_argument(
        "--debug",
        action="store_true",
        help="Enable debug mode with prompt/response inspection",
    )

    args = parser.parse_args()

    # Run validation
    run_validation(
        db_path=args.db_path,
        quality_threshold=args.threshold,
        max_exercises=args.max_exercises,
        remove_failed=args.remove_failed,
        dry_run=not args.no_dry_run,
        report_path=args.report,
        max_workers=args.max_workers,
        batch_size=args.batch_size,
        no_think=args.nothink,
        debug=args.debug,
    )
