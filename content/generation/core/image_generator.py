#!/usr/bin/env python3
"""
Clip-art batch image generator using ComfyUI API with FLUX.1 Dev (GGUF).

Generates flat vector clip-art illustrations via a ComfyUI workflow:
  GGUF UNet + DualCLIP + Style LoRA -> dpmpp_2m sampler -> VAE decode -> save

Requires ComfyUI-GGUF custom node: github.com/city96/ComfyUI-GGUF
"""

import json
import random
import sys
import time
import urllib.request
import urllib.error
from pathlib import Path
from typing import Optional

# ---------------------------------------------------------------------------
# Style prompt components
# ---------------------------------------------------------------------------
# FLUX prefers natural-language descriptions over SD-style tag soup.
# The LoRA trigger word is injected separately by build_prompt().

STYLE_PREFIX = (
    "Flat vector clip art illustration. "
    "Solid white background with no patterns. "
    "Bold clean black outlines on all elements. "
    "Flat solid colors with no gradients, no shading, no shadows, no texture. "
    "Simple geometric shapes. "
    "Limited bright color palette of 3 to 5 colors. "
    "2D graphic design style, "
)

STYLE_SUFFIX = (
    "SVG icon aesthetic. "
    "Centered composition. "
    "Isolated on pure white background. "
    "Minimalist and clean."
)


# ---------------------------------------------------------------------------
# Generation defaults (overridable via config)
# ---------------------------------------------------------------------------
IMAGE_WIDTH = 1024
IMAGE_HEIGHT = 1024
STEPS = 20
CFG = 1.0
SAMPLER = "euler"
SCHEDULER = "sgm_uniform"
COMFY_HOST = "127.0.0.1:8188"

# Model filenames (must match files in ComfyUI/models/)
UNET_MODEL = "flux1-dev-Q6_K.gguf"
LORA_MODEL = "simplevectorflux.safetensors"
LORA_STRENGTH = 0.7
LORA_TRIGGER = "v3ct0r"
VAE_MODEL = "ae.safetensors"
CLIP_L_MODEL = "clip_l.safetensors"
T5_MODEL = "t5xxl_fp16.safetensors"


def build_prompt(user_prompt: str, trigger: str = LORA_TRIGGER) -> str:
    """Wrap a user prompt in the clip-art style prefix/suffix with LoRA trigger."""
    return f"{trigger}, {STYLE_PREFIX}{user_prompt.strip()}. {STYLE_SUFFIX}"


def build_workflow(
    prompt_text: str,
    seed: int,
    output_prefix: str,
    width: int = IMAGE_WIDTH,
    height: int = IMAGE_HEIGHT,
    steps: int = STEPS,
    cfg: float = CFG,
    sampler: str = SAMPLER,
    scheduler: str = SCHEDULER,
    unet_model: str = UNET_MODEL,
    lora_model: str = LORA_MODEL,
    lora_strength: float = LORA_STRENGTH,
    vae_model: str = VAE_MODEL,
    clip_l_model: str = CLIP_L_MODEL,
    t5_model: str = T5_MODEL,
) -> dict:
    """Build a ComfyUI API-format workflow dict for a single image.

    Uses the standard FLUX.1 KSampler path (not the FLUX.2
    SamplerCustomAdvanced path) which is better tested and produces
    cleaner results with GGUF-quantized models.

    Node chain:
      1  UnetLoaderGGUF          -> model
      2  LoraLoaderModelOnly     -> model (+ LoRA style)
      3  DualCLIPLoader          -> clip (CLIP-L + T5-XXL)
      4  VAELoader               -> vae
      5  CLIPTextEncode          -> positive conditioning
      6  ConditioningZeroOut     -> negative conditioning
      7  KSampler                -> latent (handles sigmas internally)
      8  VAEDecode               -> image
      9  SaveImage               -> output file
    """
    return {
        # --- Model loading ---
        "1": {
            "class_type": "UnetLoaderGGUF",
            "inputs": {
                "unet_name": unet_model,
            },
        },
        "2": {
            "class_type": "LoraLoaderModelOnly",
            "inputs": {
                "model": ["1", 0],
                "lora_name": lora_model,
                "strength_model": lora_strength,
            },
        },
        # --- Text encoding ---
        "3": {
            "class_type": "DualCLIPLoader",
            "inputs": {
                "clip_name1": clip_l_model,
                "clip_name2": t5_model,
                "type": "flux",
            },
        },
        # --- VAE ---
        "4": {
            "class_type": "VAELoader",
            "inputs": {
                "vae_name": vae_model,
            },
        },
        # --- Prompt encoding ---
        "5": {
            "class_type": "CLIPTextEncode",
            "inputs": {
                "text": prompt_text,
                "clip": ["3", 0],
            },
        },
        # --- Negative conditioning ---
        "6": {
            "class_type": "ConditioningZeroOut",
            "inputs": {
                "conditioning": ["5", 0],
            },
        },
        # --- Latent ---
        "7": {
            "class_type": "EmptyLatentImage",
            "inputs": {
                "width": width,
                "height": height,
                "batch_size": 1,
            },
        },
        # --- Sampling (KSampler handles sigma schedule internally) ---
        "8": {
            "class_type": "KSampler",
            "inputs": {
                "model": ["2", 0],
                "seed": seed,
                "steps": steps,
                "cfg": cfg,
                "sampler_name": sampler,
                "scheduler": scheduler,
                "denoise": 1.0,
                "positive": ["5", 0],
                "negative": ["6", 0],
                "latent_image": ["7", 0],
            },
        },
        # --- Decode ---
        "9": {
            "class_type": "VAEDecode",
            "inputs": {
                "samples": ["8", 0],
                "vae": ["4", 0],
            },
        },
        # --- Save ---
        "10": {
            "class_type": "SaveImage",
            "inputs": {
                "images": ["9", 0],
                "filename_prefix": output_prefix,
            },
        },
    }


def queue_prompt(comfy_host: str, workflow: dict) -> str:
    """Send a workflow to ComfyUI and return the prompt_id."""
    payload = json.dumps({"prompt": workflow}).encode("utf-8")
    req = urllib.request.Request(
        f"http://{comfy_host}/prompt",
        data=payload,
        headers={"Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            result = json.loads(resp.read())
            return result["prompt_id"]
    except urllib.error.URLError as e:
        print(f"\nCould not connect to ComfyUI at {comfy_host}")
        print(f"  Error: {e}")
        print("  Make sure it's running: python main.py --force-fp16")
        sys.exit(1)


def get_queue_status(comfy_host: str) -> dict:
    """Get current ComfyUI queue status."""
    try:
        with urllib.request.urlopen(f"http://{comfy_host}/queue", timeout=10) as resp:
            return json.loads(resp.read())
    except urllib.error.URLError:
        return {}


def wait_for_prompt(
    comfy_host: str,
    prompt_id: str,
    poll_interval: float = 2.0,
    timeout: float = 600.0,
):
    """Block until a specific prompt_id is no longer in the queue.

    Args:
        comfy_host: ComfyUI host:port
        prompt_id: The prompt ID to wait for
        poll_interval: Seconds between queue checks
        timeout: Maximum seconds to wait (default 10 minutes)
    """
    elapsed = 0.0
    while True:
        status = get_queue_status(comfy_host)
        running = [item[1] for item in status.get("queue_running", [])]
        pending = [item[1] for item in status.get("queue_pending", [])]
        if prompt_id not in running and prompt_id not in pending:
            return
        elapsed += poll_interval
        if elapsed >= timeout:
            print(f"\n  TIMEOUT waiting for prompt {prompt_id} after {elapsed:.0f}s")
            print(f"  Queue state: running={len(running)}, pending={len(pending)}")
            return
        time.sleep(poll_interval)


def check_comfy_running(comfy_host: str) -> bool:
    """Check if ComfyUI server is running."""
    try:
        urllib.request.urlopen(f"http://{comfy_host}/system_stats", timeout=3)
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
    for f in sorted(
        comfy_output_dir.iterdir(), key=lambda p: p.stat().st_mtime, reverse=True
    ):
        if f.name.startswith(output_prefix) and f.suffix in (".png", ".jpg", ".jpeg"):
            return f
    return None


class ImageGenerator:
    """Client for generating clip-art images via ComfyUI (FLUX.1 Dev GGUF)."""

    def __init__(
        self,
        comfy_host: str = COMFY_HOST,
        comfy_dir: Optional[Path] = None,
        output_dir: Optional[Path] = None,
        width: int = IMAGE_WIDTH,
        height: int = IMAGE_HEIGHT,
        steps: int = STEPS,
        cfg: float = CFG,
        sampler: str = SAMPLER,
        scheduler: str = SCHEDULER,
        unet_model: str = UNET_MODEL,
        lora_model: str = LORA_MODEL,
        lora_strength: float = LORA_STRENGTH,
        lora_trigger: str = LORA_TRIGGER,
        vae_model: str = VAE_MODEL,
        clip_l_model: str = CLIP_L_MODEL,
        t5_model: str = T5_MODEL,
        timeout: float = 600.0,
    ):
        self.comfy_host = comfy_host
        self.comfy_dir = comfy_dir
        self.comfy_output_dir = (
            output_dir if output_dir else (comfy_dir / "output" if comfy_dir else None)
        )
        self.width = width
        self.height = height
        self.steps = steps
        self.cfg = cfg
        self.sampler = sampler
        self.scheduler = scheduler
        self.unet_model = unet_model
        self.lora_model = lora_model
        self.lora_strength = lora_strength
        self.lora_trigger = lora_trigger
        self.vae_model = vae_model
        self.clip_l_model = clip_l_model
        self.t5_model = t5_model
        self.timeout = timeout

    def check_running(self) -> bool:
        """Check if ComfyUI is available."""
        return check_comfy_running(self.comfy_host)

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
        full_prompt = build_prompt(user_prompt, trigger=self.lora_trigger)
        slug = slugify(user_prompt)
        output_prefix = f"clipart_{index:04d}_{slug}"

        workflow = build_workflow(
            prompt_text=full_prompt,
            seed=seed,
            output_prefix=output_prefix,
            width=self.width,
            height=self.height,
            steps=self.steps,
            cfg=self.cfg,
            sampler=self.sampler,
            scheduler=self.scheduler,
            unet_model=self.unet_model,
            lora_model=self.lora_model,
            lora_strength=self.lora_strength,
            vae_model=self.vae_model,
            clip_l_model=self.clip_l_model,
            t5_model=self.t5_model,
        )

        prompt_id = queue_prompt(self.comfy_host, workflow)
        wait_for_prompt(self.comfy_host, prompt_id, timeout=self.timeout)

        if self.comfy_output_dir:
            output_file = find_output_image(self.comfy_output_dir, output_prefix)
            if output_file:
                return output_file.name

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
