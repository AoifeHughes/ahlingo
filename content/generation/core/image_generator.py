#!/usr/bin/env python3
"""
Clip-art batch image generator using ComfyUI API with FLUX.2-klein-9B.

Refactored from content/img_gen/generate_clipart_flux2.py for integration
with the AHLingo content generation pipeline.
"""

import json
import random
import sys
import time
import urllib.request
import urllib.error
from pathlib import Path
from typing import Optional


STYLE_PREFIX = (
    "flat vector clip art illustration, "
    "white background, "
    "bold clean black outlines, "
    "simple geometric shapes, "
    "limited bright color palette, "
    "no gradients, no shadows, no texture, "
    "2D graphic design style, "
)

STYLE_SUFFIX = (
    ", svg icon style, "
    "centered composition, "
    "isolated on white"
)

STYLE_EXAMPLES = [
    "cartoon people sitting around a dinner table eating food",
    "simple flat icon of a red bicycle",
    "cute clip art dog holding a bone",
]

FEW_SHOT_PREAMBLE = (
    "Examples of this style: "
    + "; ".join(STYLE_EXAMPLES)
    + ". Now generate: "
)

IMAGE_WIDTH = 512
IMAGE_HEIGHT = 512
STEPS = 4
CFG = 1
SAMPLER = "euler"
COMFY_HOST = "127.0.0.1:8188"


def build_prompt(user_prompt: str) -> str:
    """Wrap a user prompt in the clip-art style prefix/suffix."""
    return STYLE_PREFIX + FEW_SHOT_PREAMBLE + user_prompt.strip() + STYLE_SUFFIX


def build_workflow(prompt_text: str, seed: int, output_prefix: str) -> dict:
    """Build a ComfyUI API-format workflow dict for a single image."""
    return {
        "1": {
            "class_type": "UNETLoader",
            "inputs": {
                "unet_name": "flux-2-klein-9b.safetensors",
                "weight_dtype": "default"
            }
        },
        "2": {
            "class_type": "VAELoader",
            "inputs": {
                "vae_name": "flux2-vae.safetensors"
            }
        },
        "3": {
            "class_type": "CLIPLoader",
            "inputs": {
                "clip_name": "qwen_3_8b_fp8mixed.safetensors",
                "type": "flux2",
                "device": "default"
            }
        },
        "4": {
            "class_type": "CLIPTextEncode",
            "inputs": {
                "clip": ["3", 0],
                "text": prompt_text
            }
        },
        "5": {
            "class_type": "EmptyLatentImage",
            "inputs": {
                "width": IMAGE_WIDTH,
                "height": IMAGE_HEIGHT,
                "batch_size": 1
            }
        },
        "6": {
            "class_type": "ConditioningZeroOut",
            "inputs": {
                "conditioning": ["4", 0]
            }
        },
        "7": {
            "class_type": "CFGGuider",
            "inputs": {
                "model": ["1", 0],
                "positive": ["4", 0],
                "negative": ["6", 0],
                "cfg": CFG
            }
        },
        "8": {
            "class_type": "KSamplerSelect",
            "inputs": {
                "sampler_name": SAMPLER
            }
        },
        "9": {
            "class_type": "RandomNoise",
            "inputs": {
                "noise_seed": seed
            }
        },
        "10": {
            "class_type": "Flux2Scheduler",
            "inputs": {
                "steps": STEPS,
                "width": IMAGE_WIDTH,
                "height": IMAGE_HEIGHT
            }
        },
        "11": {
            "class_type": "SamplerCustomAdvanced",
            "inputs": {
                "noise": ["9", 0],
                "guider": ["7", 0],
                "sampler": ["8", 0],
                "sigmas": ["10", 0],
                "latent_image": ["5", 0]
            }
        },
        "12": {
            "class_type": "VAEDecode",
            "inputs": {
                "samples": ["11", 0],
                "vae": ["2", 0]
            }
        },
        "13": {
            "class_type": "SaveImage",
            "inputs": {
                "images": ["12", 0],
                "filename_prefix": output_prefix
            }
        }
    }


def queue_prompt(workflow: dict) -> str:
    """Send a workflow to ComfyUI and return the prompt_id."""
    payload = json.dumps({"prompt": workflow}).encode("utf-8")
    req = urllib.request.Request(
        f"http://{COMFY_HOST}/prompt",
        data=payload,
        headers={"Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req) as resp:
            result = json.loads(resp.read())
            return result["prompt_id"]
    except urllib.error.URLError as e:
        print(f"\nCould not connect to ComfyUI at {COMFY_HOST}")
        print("   Make sure it's running: python main.py --force-fp16")
        sys.exit(1)


def get_queue_status() -> dict:
    try:
        with urllib.request.urlopen(f"http://{COMFY_HOST}/queue") as resp:
            return json.loads(resp.read())
    except urllib.error.URLError:
        return {}


def wait_for_prompt(prompt_id: str, poll_interval: float = 2.0):
    """Block until a specific prompt_id is no longer in the queue."""
    while True:
        status = get_queue_status()
        running = [item[1] for item in status.get("queue_running", [])]
        pending = [item[1] for item in status.get("queue_pending", [])]
        if prompt_id not in running and prompt_id not in pending:
            return
        time.sleep(poll_interval)


def check_comfy_running() -> bool:
    """Check if ComfyUI server is running."""
    try:
        urllib.request.urlopen(f"http://{COMFY_HOST}/system_stats", timeout=3)
        return True
    except Exception:
        return False


def slugify(text: str, max_len: int = 40) -> str:
    """Convert text to a filesystem-safe slug."""
    slug = text[:max_len].lower().replace(" ", "_").replace("/", "-")
    slug = "".join(c for c in slug if c.isalnum() or c in "_-")
    return slug


def find_output_image(comfy_output_dir: Path, output_prefix: str) -> Optional[Path]:
    """Find the generated image file in ComfyUI's output directory."""
    if not comfy_output_dir.exists():
        return None
    for f in comfy_output_dir.iterdir():
        if f.name.startswith(output_prefix) and f.suffix in (".png", ".jpg", ".jpeg"):
            return f
    return None


class ImageGenerator:
    """Client for generating clip-art images via ComfyUI."""

    def __init__(
        self,
        comfy_host: str = COMFY_HOST,
        comfy_dir: Optional[Path] = None,
        output_dir: Optional[Path] = None,
    ):
        self.comfy_host = comfy_host
        self.comfy_dir = comfy_dir
        self.comfy_output_dir = (
            output_dir if output_dir else (comfy_dir / "output" if comfy_dir else None)
        )

    def check_running(self) -> bool:
        """Check if ComfyUI is available."""
        try:
            urllib.request.urlopen(f"http://{self.comfy_host}/system_stats", timeout=3)
            return True
        except Exception:
            return False

    def generate(
        self,
        user_prompt: str,
        index: int,
        topic_slug: str,
        seed: Optional[int] = None,
    ) -> Optional[str]:
        """Generate a single image and return its filename.

        Args:
            user_prompt: The scene description
            index: 0-based index for naming
            topic_slug: Topic slug for output subdirectory
            seed: Optional fixed seed

        Returns:
            Filename of the generated image, or None on failure
        """
        seed = seed if seed is not None else random.randint(0, 2**32 - 1)
        full_prompt = build_prompt(user_prompt)
        slug = slugify(user_prompt)
        output_prefix = f"clipart_{index:04d}_{slug}"

        workflow = build_workflow(full_prompt, seed, output_prefix)

        prompt_id = queue_prompt(workflow)

        # Wait for completion
        wait_for_prompt(prompt_id)

        # Find the output file
        if self.comfy_output_dir:
            output_file = find_output_image(self.comfy_output_dir, output_prefix)
            if output_file:
                filename = output_file.name
                return filename

        # Fallback: construct expected filename
        return f"{output_prefix}.png"

    def generate_batch(
        self,
        prompts: list[str],
        topic_slug: str,
    ) -> list[str]:
        """Generate images for a batch of prompts.

        Args:
            prompts: List of scene descriptions
            topic_slug: Topic slug for naming

        Returns:
            List of filenames (or None for failures)
        """
        filenames = []
        for i, prompt in enumerate(prompts, 1):
            print(f"  [{i:>3}/{len(prompts)}] Generating: {prompt[:60]}")
            filename = self.generate(prompt, i, topic_slug)
            if filename:
                print(f"          -> {filename}")
            else:
                print(f"          -> FAILED")
            filenames.append(filename)
        return filenames
