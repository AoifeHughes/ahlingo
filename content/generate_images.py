#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Image content generation pipeline for AHLingo.

Generates clip-art images and language descriptors for each topic:
1. LLM generates 10 image prompts per topic
2. ComfyUI renders each prompt as a clip-art PNG
3. LLM generates correct + 2 incorrect descriptors per image per language per difficulty

Usage:
    python content/generate_images.py --topics "Food, drinks, and restaurants"
    python content/generate_images.py --languages French --levels beginner
    python content/generate_images.py --comfy-dir /path/to/ComfyUI --output-dir ./content/images
    python content/generate_images.py --dry-run
"""

import json
import argparse
import sys
import shutil
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional

sys.path.insert(0, str(Path(__file__).parent))

from tqdm import tqdm
from database.database_manager import LanguageDB
from generation.core import outlines_generator
from generation.core.image_generator import ImageGenerator, check_comfy_running, slugify
from generation.core.descriptors_generator import generate_image_prompts, generate_descriptors


class ImageContentGenerator:
    """Main class for image content generation pipeline."""

    def __init__(
        self,
        config_path: str,
        db_path: str,
        comfy_dir: Optional[str] = None,
        output_dir: Optional[str] = None,
        generation_model: Optional[str] = None,
        debug: bool = False,
        no_think: bool = False,
        dry_run: bool = False,
    ):
        self.config = self._load_config(config_path)
        self.db_path = db_path
        self.debug = debug
        self.no_think = no_think
        self.dry_run = dry_run

        img_config = self.config.get("image_generation", {})
        self.comfy_dir = Path(comfy_dir) if comfy_dir else Path(img_config.get("comfyui_dir", ""))
        self.output_dir = Path(output_dir) if output_dir else Path(img_config.get("output_dir", "content/images"))
        self.images_per_topic = img_config.get("images_per_topic", 10)
        self.comfy_host = img_config.get("comfyui_host", "127.0.0.1:8188")

        if generation_model:
            self.config["llm_servers"]["generation"]["model"] = generation_model

        self.model = None
        self.image_gen: Optional[ImageGenerator] = None
        self.stats = {
            "prompts_generated": 0,
            "images_generated": 0,
            "descriptors_generated": 0,
            "images_failed": 0,
            "descriptors_failed": 0,
        }

    def _load_config(self, config_path: str) -> Dict:
        config_file = Path(config_path)
        if not config_file.exists():
            raise FileNotFoundError(f"Configuration file not found: {config_file}")
        with open(config_file, "r") as f:
            return json.load(f)

    def setup(self):
        """Set up LLM model and ComfyUI client."""
        print("Setting up LLM model...", flush=True)
        gen_config = self.config["llm_servers"]["generation"]
        outlines_generator.MODEL_CONFIG.update({
            "base_url": gen_config["url"],
            "api_key": gen_config["api_key"],
            "temperature": gen_config["temperature"],
            "exercise_temperatures": self.config.get("exercise_temperatures", {}),
            "no_think": self.no_think,
            "debug": self.debug,
        })
        self.model = outlines_generator.setup_outlines_model()
        print(f"  Model ready", flush=True)

        if not self.dry_run:
            print("Setting up ComfyUI client...")
            self.image_gen = ImageGenerator(
                comfy_host=self.comfy_host,
                comfy_dir=self.comfy_dir,
                output_dir=self.comfy_dir / "output" if self.comfy_dir else None,
            )
            if not self.image_gen.check_running():
                print(f"\n  ERROR: ComfyUI not running at {self.comfy_host}")
                print(f"  Start it with: cd {self.comfy_dir} && python main.py --force-fp16")
                sys.exit(1)
            print(f"  ComfyUI connected at {self.comfy_host}")

    def get_topics(self, topics_filter: Optional[List[str]] = None) -> List[str]:
        all_topics = self.config.get("topics", [])
        if not topics_filter:
            return all_topics
        # Match user-provided strings against known topics (handles topics containing commas)
        matched = []
        for tf in topics_filter:
            tf_stripped = tf.strip()
            # Exact match first
            if tf_stripped in all_topics:
                matched.append(tf_stripped)
            else:
                # Fuzzy: find topic that contains this string
                found = [t for t in all_topics if tf_stripped.lower() in t.lower()]
                if found:
                    matched.append(found[0])
                else:
                    print(f"  WARNING: Topic '{tf_stripped}' not found in config, skipping")
        return matched

    def get_languages(self, languages_filter: Optional[List[str]] = None) -> List[str]:
        all_languages = self.config.get("languages", [])
        if not languages_filter:
            return all_languages
        matched = []
        for lf in languages_filter:
            lf_stripped = lf.strip()
            found = [l for l in all_languages if l.lower() == lf_stripped.lower()]
            if found:
                matched.append(found[0])
            else:
                print(f"  WARNING: Language '{lf_stripped}' not found in config, skipping")
        return matched

    def get_levels(self, levels_filter: Optional[List[str]] = None) -> List[str]:
        all_levels = self.config.get("levels", [])
        if not levels_filter:
            return all_levels
        matched = []
        for lf in levels_filter:
            lf_stripped = lf.strip()
            found = [l for l in all_levels if l.lower() == lf_stripped.lower()]
            if found:
                matched.append(found[0])
            else:
                print(f"  WARNING: Level '{lf_stripped}' not found in config, skipping")
        return matched

    def run(
        self,
        topics_filter: Optional[List[str]] = None,
        languages_filter: Optional[List[str]] = None,
        levels_filter: Optional[List[str]] = None,
    ):
        """Run the full image generation pipeline."""
        topics = self.get_topics(topics_filter)
        languages = self.get_languages(languages_filter)
        levels = self.get_levels(levels_filter)

        print(f"\n{'='*80}")
        print(f"IMAGE CONTENT GENERATION PIPELINE")
        print(f"{'='*80}")
        print(f"Topics: {len(topics)}")
        print(f"Languages: {len(languages)}")
        print(f"Levels: {len(levels)}")
        print(f"Images per topic: {self.images_per_topic}")
        print(f"Dry run: {self.dry_run}")
        print(f"{'='*80}\n")

        self.setup()

        # Phase 1: Generate image prompts and images per topic
        topic_images = self._generate_images(topics)

        # Phase 2: Generate descriptors for each image x language x difficulty
        self._generate_descriptors(topic_images, languages, levels)

        self._print_summary()

    def _generate_images(self, topics: List[str]) -> Dict[str, List[Dict]]:
        """Phase 1: Generate prompts and images for each topic.

        Returns:
            Dict mapping topic -> list of image dicts with id, prompt, filename, path
        """
        topic_images: Dict[str, List[Dict]] = {}

        for topic in topics:
            topic_slug = slugify(topic)
            topic_dir = self.output_dir / topic_slug

            print(f"\n{'─'*60}")
            print(f"TOPIC: {topic}")
            print(f"{'─'*60}")

            # Check existing count
            existing_count = 0
            if not self.dry_run:
                with LanguageDB(self.db_path) as db:
                    existing_count = db.get_image_exercise_count_by_topic(topic)

            if existing_count >= self.images_per_topic:
                print(f"  Topic already has {existing_count} images, skipping (use --regenerate to overwrite)")
                # Still return empty so descriptors can be generated
                with LanguageDB(self.db_path) as db:
                    existing = db.get_image_exercises_by_topic(topic)
                    topic_images[topic] = existing
                continue

            # Generate prompts via LLM
            print(f"  Generating {self.images_per_topic} image prompts...", flush=True)
            prompts_result = generate_image_prompts(self.model, topic, count=self.images_per_topic)

            if not prompts_result:
                print(f"  FAILED to generate prompts for '{topic}'")
                topic_images[topic] = []
                continue

            self.stats["prompts_generated"] += len(prompts_result)
            prompts = [p["prompt"] for p in prompts_result[:self.images_per_topic]]
            print(f"  Generated {len(prompts)} prompts:")
            for i, p in enumerate(prompts):
                print(f"    [{i}] {p}")

            if self.dry_run:
                print(f"  [DRY RUN] Would generate {len(prompts)} images")
                fake_images = []
                for i, p in enumerate(prompts):
                    fake_images.append({
                        "id": -1,
                        "image_prompt": p,
                        "image_filename": f"{i:02d}_{slugify(p)}.png",
                        "image_path": f"images/{topic_slug}/{i:02d}_{slugify(p)}.png",
                    })
                topic_images[topic] = fake_images
                continue

            # Create output directory
            topic_dir.mkdir(parents=True, exist_ok=True)

            # Generate images via ComfyUI
            print(f"  Generating images via ComfyUI...")
            generated_images = []

            for i, prompt in enumerate(prompts):
                filename = self.image_gen.generate(prompt, i, topic_slug)
                if filename:
                    # Copy from ComfyUI output to our structured directory
                    comfy_output = self.image_gen.comfy_output_dir / filename
                    dest_file = topic_dir / filename
                    if comfy_output.exists():
                        shutil.copy2(comfy_output, dest_file)
                    else:
                        print(f"    WARNING: ComfyUI output file not found: {comfy_output}")

                    image_path = f"images/{topic_slug}/{filename}"

                    # Insert into database
                    with LanguageDB(self.db_path) as db:
                        image_id = db.add_image_exercise(
                            topic=topic,
                            image_index=i,
                            image_prompt=prompt,
                            image_filename=filename,
                            image_path=image_path,
                        )

                    generated_images.append({
                        "id": image_id,
                        "image_prompt": prompt,
                        "image_filename": filename,
                        "image_path": image_path,
                    })
                    self.stats["images_generated"] += 1
                    print(f"    [{i}] -> {filename} (DB id: {image_id})")
                else:
                    self.stats["images_failed"] += 1
                    print(f"    [{i}] -> FAILED")

            topic_images[topic] = generated_images

        return topic_images

    def _generate_descriptors(
        self,
        topic_images: Dict[str, List[Dict]],
        languages: List[str],
        levels: List[str],
    ):
        """Phase 2: Generate descriptors for each image x language x difficulty."""
        total_descriptor_jobs = 0
        for images in topic_images.values():
            total_descriptor_jobs += len(images) * len(languages) * len(levels)

        if total_descriptor_jobs == 0:
            print("\nNo images to generate descriptors for.")
            return

        print(f"\n{'='*80}")
        print(f"GENERATING DESCRIPTORS")
        print(f"Total descriptor sets to generate: {total_descriptor_jobs}")
        print(f"{'='*80}")

        with tqdm(total=total_descriptor_jobs, desc="Descriptors") as pbar:
            for topic, images in topic_images.items():
                for image in images:
                    image_id = image.get("id", -1)
                    image_prompt = image["image_prompt"]

                    for language in languages:
                        for level in levels:
                            if self.dry_run:
                                print(f"  [DRY RUN] Descriptor: {language}/{level} for image '{image_prompt[:40]}'")
                                self.stats["descriptors_generated"] += 1
                                pbar.update(1)
                                continue

                            # Check if already exists
                            existing = None
                            with LanguageDB(self.db_path) as db:
                                existing = db.get_image_descriptor(image_id, language, level.capitalize())

                            if existing:
                                self.stats["descriptors_generated"] += 1
                                pbar.update(1)
                                continue

                            # Generate descriptors
                            result = generate_descriptors(
                                self.model,
                                image_prompt,
                                language,
                                level,
                            )

                            if result:
                                with LanguageDB(self.db_path) as db:
                                    db.add_image_descriptor(
                                        image_id=image_id,
                                        language=language,
                                        difficulty=level.capitalize(),
                                        correct_descriptor=result["correct_descriptor"],
                                        incorrect_1=result["incorrect_1"],
                                        incorrect_2=result["incorrect_2"],
                                        english_meaning=result["english_meaning"],
                                    )
                                self.stats["descriptors_generated"] += 1
                            else:
                                self.stats["descriptors_failed"] += 1

                            pbar.update(1)

    def _print_summary(self):
        print(f"\n{'='*80}")
        print(f"IMAGE GENERATION SUMMARY")
        print(f"{'='*80}")
        print(f"Image prompts generated: {self.stats['prompts_generated']}")
        print(f"Images generated: {self.stats['images_generated']}")
        print(f"Images failed: {self.stats['images_failed']}")
        print(f"Descriptors generated: {self.stats['descriptors_generated']}")
        print(f"Descriptors failed: {self.stats['descriptors_failed']}")
        print(f"{'='*80}\n")


def main():
    parser = argparse.ArgumentParser(
        description="Generate images and descriptors for AHLingo language learning"
    )

    parser.add_argument(
        "--config",
        type=str,
        default="content/generation/config/database_generation.json",
        help="Path to configuration JSON file",
    )
    parser.add_argument(
        "--db-path",
        type=str,
        help="Path to database file",
    )
    parser.add_argument(
        "--comfy-dir",
        type=str,
        help="Path to ComfyUI directory",
    )
    parser.add_argument(
        "--output-dir",
        type=str,
        help="Directory to store generated images",
    )
    parser.add_argument(
        "--topics",
        type=str,
        help="Comma-separated list of topics",
    )
    parser.add_argument(
        "--languages",
        type=str,
        help="Comma-separated list of languages",
    )
    parser.add_argument(
        "--levels",
        type=str,
        help="Comma-separated list of difficulty levels",
    )
    parser.add_argument(
        "--generation-model",
        type=str,
        help="Override generation model",
    )
    parser.add_argument(
        "--debug",
        action="store_true",
        help="Enable debug mode",
    )
    parser.add_argument(
        "--no-think",
        action="store_true",
        help="Prepend /no_think to prompts",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Don't generate images or insert to database",
    )
    parser.add_argument(
        "--regenerate",
        action="store_true",
        help="Regenerate images even if topic already has images",
    )

    args = parser.parse_args()

    # Set up database path
    if args.db_path:
        db_path = args.db_path
    else:
        script_dir = Path(__file__).parent.parent
        db_path = str(script_dir / "database" / "languageLearningDatabase.db")
        db_dir = script_dir / "database"
        db_dir.mkdir(exist_ok=True)

    # Parse filters
    topics_filter = [t.strip() for t in args.topics.split(",")] if args.topics else None
    languages_filter = [l.strip() for l in args.languages.split(",")] if args.languages else None
    levels_filter = [l.strip() for l in args.levels.split(",")] if args.levels else None

    generator = ImageContentGenerator(
        config_path=args.config,
        db_path=db_path,
        comfy_dir=args.comfy_dir,
        output_dir=args.output_dir,
        generation_model=args.generation_model,
        debug=args.debug,
        no_think=args.no_think,
        dry_run=args.dry_run,
    )

    generator.run(
        topics_filter=topics_filter,
        languages_filter=languages_filter,
        levels_filter=levels_filter,
    )


if __name__ == "__main__":
    main()
