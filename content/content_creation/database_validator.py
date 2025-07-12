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

from .validation_models import ValidationResult, get_validation_schema, parse_validation_result
from .exercise_converters import get_converter, identify_exercise_type
from database.database_manager import LanguageDB


# Centralized model configuration (reuse from outlines_generator)
MODEL_CONFIG = {
    "model_name": "mistralai/mistral-small-3.2",
    "base_url": "http://localhost:11434/v1",
    "api_key": "sk-no-key-required",
    "temperature": 0.3,  # Lower temperature for more consistent validation
}


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
            # Use outlines with local LLM
            self.model = outlines.models.openai(
                MODEL_CONFIG["model_name"],
                base_url=MODEL_CONFIG["base_url"],
                api_key=MODEL_CONFIG["api_key"],
            )
        except Exception as e:
            print(f"Error setting up outlines model: {e}")
            # Fallback to direct OpenAI client
            self.model = openai.OpenAI(
                base_url=MODEL_CONFIG["base_url"], 
                api_key=MODEL_CONFIG["api_key"]
            )
    
    def get_all_exercises(self) -> List[Dict[str, Any]]:
        """Retrieve all exercises from the database."""
        exercises = []
        
        with LanguageDB(self.db_path) as db:
            # Get conversation exercises
            conv_exercises = db.get_all_conversation_exercises()
            for exercise in conv_exercises:
                exercise['exercise_type'] = 'conversation'
                exercises.append(exercise)
            
            # Get pair exercises  
            pair_exercises = db.get_all_pair_exercises()
            for exercise in pair_exercises:
                exercise['exercise_type'] = 'pair'
                exercises.append(exercise)
            
            # Get translation exercises
            trans_exercises = db.get_all_translation_exercises()
            for exercise in trans_exercises:
                exercise['exercise_type'] = 'translation'
                exercises.append(exercise)
            
            # Get fill-in-blank exercises
            fill_exercises = db.get_all_fill_in_blank_exercises()
            for exercise in fill_exercises:
                exercise['exercise_type'] = 'fill_in_blank'
                exercises.append(exercise)
        
        return exercises
    
    def validate_exercise(self, exercise_data: Dict[str, Any]) -> ValidationResult:
        """Validate a single exercise using the LLM."""
        try:
            # Identify exercise type and get converter
            exercise_type = exercise_data.get('exercise_type', 'unknown')
            if exercise_type == 'unknown':
                exercise_type = identify_exercise_type(exercise_data)
            
            language = exercise_data.get('language', 'Unknown')
            level = exercise_data.get('difficulty_level', 'Unknown')
            
            # Convert exercise to text
            converter = get_converter(exercise_type, language, level)
            exercise_text = converter.convert_to_text(exercise_data)
            
            # Generate validation prompt
            prompt = converter.get_validation_prompt(exercise_text)
            
            # Get validation schema
            schema = get_validation_schema(exercise_type)
            
            # Validate using the model
            if hasattr(self.model, 'chat') and hasattr(self.model.chat, 'completions'):
                # OpenAI client fallback
                response = self.model.chat.completions.create(
                    model=MODEL_CONFIG["model_name"],
                    messages=[{"role": "user", "content": prompt}],
                    temperature=MODEL_CONFIG["temperature"],
                )
                result_text = response.choices[0].message.content
            else:
                # Outlines structured generation
                generator = outlines.generate.json(self.model, schema)
                result_text = generator(prompt)
            
            # Parse the result
            validation_result = parse_validation_result(result_text, exercise_type)
            
            return validation_result
            
        except Exception as e:
            print(f"Error validating exercise {exercise_data.get('id', 'unknown')}: {e}")
            # Return failed validation
            return ValidationResult(
                is_correct_language=False,
                has_correct_grammar=False,
                is_translation_accurate=False,
                is_culturally_appropriate=False,
                is_educational_quality=False,
                overall_quality_score=1,
                issues_found=[f"Validation error: {str(e)}"]
            )
    
    def validate_all_exercises(self, max_exercises: Optional[int] = None) -> Dict[str, Any]:
        """
        Validate all exercises in the database.
        
        Args:
            max_exercises: Limit number of exercises to validate (for testing)
            
        Returns:
            Dictionary with validation statistics and results
        """
        if self.model is None:
            self.setup_model()
        
        print("Fetching exercises from database...")
        exercises = self.get_all_exercises()
        
        if max_exercises:
            exercises = exercises[:max_exercises]
        
        print(f"Validating {len(exercises)} exercises...")
        
        results = {
            'total_exercises': len(exercises),
            'validated_exercises': [],
            'failed_validations': [],
            'statistics': {
                'passed': 0,
                'failed': 0,
                'by_type': {},
                'by_language': {},
                'average_score': 0
            }
        }
        
        total_score = 0
        
        with tqdm(total=len(exercises), desc="Validating exercises") as pbar:
            for exercise in exercises:
                try:
                    # Validate the exercise
                    validation_result = self.validate_exercise(exercise)
                    
                    # Store result with exercise info
                    result_data = {
                        'exercise_id': exercise.get('id'),
                        'exercise_type': exercise.get('exercise_type'),
                        'language': exercise.get('language'),
                        'level': exercise.get('difficulty_level'),
                        'topic': exercise.get('topic'),
                        'validation': validation_result.dict(),
                        'passed': validation_result.overall_quality_score >= self.quality_threshold
                    }
                    
                    results['validated_exercises'].append(result_data)
                    
                    # Update statistics
                    if result_data['passed']:
                        results['statistics']['passed'] += 1
                    else:
                        results['statistics']['failed'] += 1
                    
                    # Track by type and language
                    ex_type = result_data['exercise_type']
                    language = result_data['language']
                    
                    if ex_type not in results['statistics']['by_type']:
                        results['statistics']['by_type'][ex_type] = {'passed': 0, 'failed': 0}
                    if language not in results['statistics']['by_language']:
                        results['statistics']['by_language'][language] = {'passed': 0, 'failed': 0}
                    
                    if result_data['passed']:
                        results['statistics']['by_type'][ex_type]['passed'] += 1
                        results['statistics']['by_language'][language]['passed'] += 1
                    else:
                        results['statistics']['by_type'][ex_type]['failed'] += 1
                        results['statistics']['by_language'][language]['failed'] += 1
                    
                    total_score += validation_result.overall_quality_score
                    
                except Exception as e:
                    print(f"Failed to validate exercise {exercise.get('id', 'unknown')}: {e}")
                    results['failed_validations'].append({
                        'exercise_id': exercise.get('id'),
                        'error': str(e)
                    })
                
                pbar.update(1)
        
        # Calculate average score
        if results['validated_exercises']:
            results['statistics']['average_score'] = total_score / len(results['validated_exercises'])
        
        return results
    
    def remove_failed_exercises(self, validation_results: Dict[str, Any], dry_run: bool = True) -> Dict[str, Any]:
        """
        Remove exercises that failed validation from the database.
        
        Args:
            validation_results: Results from validate_all_exercises()
            dry_run: If True, only show what would be removed without actually removing
            
        Returns:
            Dictionary with removal statistics
        """
        failed_exercises = [
            ex for ex in validation_results['validated_exercises'] 
            if not ex['passed']
        ]
        
        removal_stats = {
            'total_to_remove': len(failed_exercises),
            'by_type': {},
            'by_language': {},
            'removed_ids': [],
            'dry_run': dry_run
        }
        
        if not failed_exercises:
            print("No exercises to remove - all passed validation!")
            return removal_stats
        
        print(f"{'Would remove' if dry_run else 'Removing'} {len(failed_exercises)} failed exercises...")
        
        # Group by type for removal
        exercises_by_type = {}
        for ex in failed_exercises:
            ex_type = ex['exercise_type']
            if ex_type not in exercises_by_type:
                exercises_by_type[ex_type] = []
            exercises_by_type[ex_type].append(ex)
        
        if not dry_run:
            with LanguageDB(self.db_path) as db:
                for ex_type, exercises in exercises_by_type.items():
                    exercise_ids = [ex['exercise_id'] for ex in exercises]
                    
                    if ex_type == 'conversation':
                        db.remove_conversation_exercises(exercise_ids)
                    elif ex_type == 'pair':
                        db.remove_pair_exercises(exercise_ids)
                    elif ex_type == 'translation':
                        db.remove_translation_exercises(exercise_ids)
                    elif ex_type == 'fill_in_blank':
                        db.remove_fill_in_blank_exercises(exercise_ids)
                    
                    removal_stats['removed_ids'].extend(exercise_ids)
        
        # Update statistics
        for ex in failed_exercises:
            ex_type = ex['exercise_type']
            language = ex['language']
            
            removal_stats['by_type'][ex_type] = removal_stats['by_type'].get(ex_type, 0) + 1
            removal_stats['by_language'][language] = removal_stats['by_language'].get(language, 0) + 1
        
        return removal_stats
    
    def save_validation_report(self, validation_results: Dict[str, Any], output_path: str):
        """Save detailed validation report to JSON file."""
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(validation_results, f, indent=2, ensure_ascii=False)
        
        print(f"Validation report saved to: {output_path}")


def run_validation(
    db_path: str,
    quality_threshold: int = 6,
    max_exercises: Optional[int] = None,
    remove_failed: bool = False,
    dry_run: bool = True,
    report_path: Optional[str] = None
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
        
    Returns:
        Validation results dictionary
    """
    validator = DatabaseValidator(db_path, quality_threshold)
    
    print(f"Starting database validation...")
    print(f"Database: {db_path}")
    print(f"Quality threshold: {quality_threshold}/10")
    print(f"Max exercises: {max_exercises or 'All'}")
    
    # Run validation
    results = validator.validate_all_exercises(max_exercises)
    
    # Print summary
    stats = results['statistics']
    print(f"\n=== VALIDATION SUMMARY ===")
    print(f"Total exercises: {results['total_exercises']}")
    print(f"Successfully validated: {len(results['validated_exercises'])}")
    print(f"Failed validations: {len(results['failed_validations'])}")
    print(f"Passed quality check: {stats['passed']}")
    print(f"Failed quality check: {stats['failed']}")
    print(f"Average quality score: {stats['average_score']:.2f}/10")
    
    print(f"\n=== BY EXERCISE TYPE ===")
    for ex_type, counts in stats['by_type'].items():
        total = counts['passed'] + counts['failed']
        pass_rate = (counts['passed'] / total * 100) if total > 0 else 0
        print(f"{ex_type}: {counts['passed']}/{total} passed ({pass_rate:.1f}%)")
    
    print(f"\n=== BY LANGUAGE ===")
    for language, counts in stats['by_language'].items():
        total = counts['passed'] + counts['failed']
        pass_rate = (counts['passed'] / total * 100) if total > 0 else 0
        print(f"{language}: {counts['passed']}/{total} passed ({pass_rate:.1f}%)")
    
    # Remove failed exercises if requested
    if remove_failed and stats['failed'] > 0:
        print(f"\n=== REMOVING FAILED EXERCISES ===")
        removal_stats = validator.remove_failed_exercises(results, dry_run)
        
        if dry_run:
            print(f"DRY RUN: Would remove {removal_stats['total_to_remove']} exercises")
        else:
            print(f"Removed {removal_stats['total_to_remove']} exercises")
        
        for ex_type, count in removal_stats['by_type'].items():
            print(f"  {ex_type}: {count}")
    
    # Save report if requested
    if report_path:
        validator.save_validation_report(results, report_path)
    
    return results


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Validate language learning database exercises")
    parser.add_argument("--db-path", default="../database/languageLearningDatabase.db", 
                       help="Path to database file")
    parser.add_argument("--threshold", type=int, default=6,
                       help="Quality threshold (1-10, default: 6)")
    parser.add_argument("--max-exercises", type=int,
                       help="Limit number of exercises to validate (for testing)")
    parser.add_argument("--remove-failed", action="store_true",
                       help="Remove exercises that fail validation")
    parser.add_argument("--no-dry-run", action="store_true",
                       help="Actually remove exercises (not just show what would be removed)")
    parser.add_argument("--report", type=str,
                       help="Path to save validation report JSON file")
    
    args = parser.parse_args()
    
    # Run validation
    run_validation(
        db_path=args.db_path,
        quality_threshold=args.threshold,
        max_exercises=args.max_exercises,
        remove_failed=args.remove_failed,
        dry_run=not args.no_dry_run,
        report_path=args.report
    )