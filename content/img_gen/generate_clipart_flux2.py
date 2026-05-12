#!/usr/bin/env python3
"""
Clip-art batch image generator using ComfyUI API with FLUX.2-klein-9B.

Reads a .txt file of prompts (one per line), wraps each in a consistent
clip-art style, and queues them all through ComfyUI.

Usage:
    python generate_clipart.py --prompts prompts.txt --comfy-dir /path/to/ComfyUI
    python generate_clipart.py --prompts prompts.txt --comfy-dir /path/to/ComfyUI --output-dir ./output

Requires ComfyUI to be running:
    cd /path/to/ComfyUI && python main.py --force-fp16
"""

import argparse
import json
import random
import sys
import time
import urllib.request
import urllib.error
from pathlib import Path


# ---------------------------------------------------------------------------
# Style config — edit this to change the look of ALL generated images
# ---------------------------------------------------------------------------

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

# A few example phrasings baked in to anchor the style.
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

# ComfyUI generation settings
IMAGE_WIDTH  = 512
IMAGE_HEIGHT = 512
STEPS        = 4      # klein is distilled, few steps is enough
CFG          = 1      # distilled model, CFG=1
SAMPLER      = "euler"

COMFY_HOST = "127.0.0.1:8188"

# ---------------------------------------------------------------------------

def build_prompt(user_prompt: str) -> str:
    return STYLE_PREFIX + FEW_SHOT_PREAMBLE + user_prompt.strip() + STYLE_SUFFIX


def build_workflow(prompt_text: str, seed: int, output_prefix: str) -> dict:
    """Build a ComfyUI API-format workflow dict for a single image.

    Uses the advanced sampler chain (Flux2Scheduler + CFGGuider +
    SamplerCustomAdvanced) which is the correct setup for FLUX.2-klein.
    """
    return {
        # 1: Load the UNET model
        "1": {
            "class_type": "UNETLoader",
            "inputs": {
                "unet_name": "flux-2-klein-9b.safetensors",
                "weight_dtype": "default"
            }
        },
        # 2: Load the VAE
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
        # 4: Encode positive prompt
        "4": {
            "class_type": "CLIPTextEncode",
            "inputs": {
                "clip": ["3", 0],
                "text": prompt_text
            }
        },
        # 5: Empty latent image
        "5": {
            "class_type": "EmptyLatentImage",
            "inputs": {
                "width": IMAGE_WIDTH,
                "height": IMAGE_HEIGHT,
                "batch_size": 1
            }
        },
        # 6: Zero-out conditioning for negative
        "6": {
            "class_type": "ConditioningZeroOut",
            "inputs": {
                "conditioning": ["4", 0]
            }
        },
        # 7: CFG Guider (CFG=1 for distilled models)
        "7": {
            "class_type": "CFGGuider",
            "inputs": {
                "model": ["1", 0],
                "positive": ["4", 0],
                "negative": ["6", 0],
                "cfg": CFG
            }
        },
        # 8: Sampler selection
        "8": {
            "class_type": "KSamplerSelect",
            "inputs": {
                "sampler_name": SAMPLER
            }
        },
        # 9: Random noise
        "9": {
            "class_type": "RandomNoise",
            "inputs": {
                "noise_seed": seed
            }
        },
        # 10: Flux2-specific scheduler
        "10": {
            "class_type": "Flux2Scheduler",
            "inputs": {
                "steps": STEPS,
                "width": IMAGE_WIDTH,
                "height": IMAGE_HEIGHT
            }
        },
        # 11: Advanced custom sampler
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
        # 12: Decode VAE
        "12": {
            "class_type": "VAEDecode",
            "inputs": {
                "samples": ["11", 0],
                "vae": ["2", 0]
            }
        },
        # 13: Save image
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


def check_comfy_running():
    try:
        urllib.request.urlopen(f"http://{COMFY_HOST}/system_stats", timeout=3)
        return True
    except Exception:
        return False


def load_prompts(path: Path) -> list[str]:
    lines = path.read_text(encoding="utf-8").splitlines()
    prompts = [l.strip() for l in lines if l.strip() and not l.startswith("#")]
    return prompts


def main():
    parser = argparse.ArgumentParser(description="Batch clip-art generator via ComfyUI (FLUX.2-klein)")
    parser.add_argument("--prompts",    type=Path, required=True, help="Path to prompts .txt file (one prompt per line)")
    parser.add_argument("--comfy-dir",  type=Path, required=True, help="Path to ComfyUI directory (used to confirm setup)")
    parser.add_argument("--output-dir", type=Path, default=None,  help="Where ComfyUI saves images (default: ComfyUI/output)")
    parser.add_argument("--seed",       type=int,  default=None,  help="Fixed seed for reproducibility (default: random per image)")
    parser.add_argument("--wait",       action="store_true", default=True, help="Wait for each image before queuing the next (default: true)")
    parser.add_argument("--no-wait",    action="store_true", help="Queue all prompts at once without waiting")
    args = parser.parse_args()

    comfy_dir  = args.comfy_dir.expanduser().resolve()
    prompt_file = args.prompts.expanduser().resolve()

    # Sanity checks
    if not comfy_dir.exists():
        print(f"ComfyUI directory not found: {comfy_dir}")
        sys.exit(1)
    if not prompt_file.exists():
        print(f"Prompts file not found: {prompt_file}")
        sys.exit(1)

    print(f"\nClip-art batch generator (FLUX.2-klein-9B)")
    print(f"   ComfyUI : {comfy_dir}")
    print(f"   Prompts : {prompt_file}")

    # Check ComfyUI is up
    if not check_comfy_running():
        print(f"\nComfyUI doesn't appear to be running at {COMFY_HOST}")
        print(f"   Start it with: cd {comfy_dir} && python main.py --force-fp16")
        sys.exit(1)
    print(f"   ComfyUI : running at {COMFY_HOST}\n")

    prompts = load_prompts(prompt_file)
    if not prompts:
        print("No prompts found in file (empty lines and # comments are ignored)")
        sys.exit(1)

    print(f"{len(prompts)} prompts loaded\n")
    print("Style prefix:")
    print(f"  {STYLE_PREFIX}")
    print("\nFew-shot examples baked in:")
    for ex in STYLE_EXAMPLES:
        print(f"  - {ex}")
    print()

    wait_mode = not args.no_wait

    for i, user_prompt in enumerate(prompts, 1):
        seed = args.seed if args.seed is not None else random.randint(0, 2**32 - 1)
        full_prompt = build_prompt(user_prompt)
        # Slug the user prompt for the filename
        slug = user_prompt[:40].lower().replace(" ", "_").replace("/", "-")
        slug = "".join(c for c in slug if c.isalnum() or c in "_-")
        output_prefix = f"clipart_{i:04d}_{slug}"

        workflow = build_workflow(full_prompt, seed, output_prefix)

        print(f"[{i:>3}/{len(prompts)}] Queuing: {user_prompt[:60]}")
        print(f"          Seed: {seed}  |  File prefix: {output_prefix}")

        prompt_id = queue_prompt(workflow)

        if wait_mode:
            print(f"          Waiting for completion...", end="", flush=True)
            wait_for_prompt(prompt_id)
            print(" done")
        else:
            print(f"          Queued (id: {prompt_id[:8]}...)")

    if wait_mode:
        print(f"\nAll {len(prompts)} images generated!")
    else:
        print(f"\nAll {len(prompts)} prompts queued — watch ComfyUI for progress.")

    output_dir = args.output_dir or (comfy_dir / "output")
    print(f"Images saved to: {output_dir}")
    print("   Filenames follow: clipart_NNNN_<slug>.png\n")


if __name__ == "__main__":
    main()
