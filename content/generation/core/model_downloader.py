#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Model downloader for AHLingo image generation pipeline.

Downloads all models, LoRAs, upscalers, and auxiliary files needed for the
FLUX.1 Dev clip-art ComfyUI workflow. Deposits each file into the correct
ComfyUI subfolder.

Usage:
    python content/generation/core/model_downloader.py
    python content/generation/core/model_downloader.py --comfy-dir /custom/path
    python content/generation/core/model_downloader.py --dry-run
    python content/generation/core/model_downloader.py --list
"""

import argparse
import os
import shutil
import sys
import tempfile
from pathlib import Path

try:
    from huggingface_hub import hf_hub_download
    from tqdm import tqdm
except ImportError:
    print("ERROR: Required packages not installed.")
    print("  Run: pip install huggingface_hub tqdm")
    sys.exit(1)


COMFYUI_DEFAULT = (
    Path(os.environ.get("COMFYUI_DIR", "")) or Path.home() / "git" / "ComfyUI"
)


# ---------------------------------------------------------------------------
# Model definitions
# ---------------------------------------------------------------------------
# Each entry: (display_name, download_source, comfyui_subfolder, dest_filename, expected_size_bytes)
# download_source is either:
#   ("hf", repo_id, filename_in_repo)  — HuggingFace
#   ("url", direct_url, filename)       — direct HTTP
# ---------------------------------------------------------------------------

MODELS = [
    # --- FLUX.1 Dev GGUF (base UNet) ---
    {
        "name": "FLUX.1 Dev GGUF (Q6_K)",
        "source": ("hf", "city96/FLUX.1-dev-gguf", "flux1-dev-Q6_K.gguf"),
        "folder": "unet",
        "filename": "flux1-dev-Q6_K.gguf",
        "size_approx": 10_590_000_000,  # ~9.86 GB
        "required": True,
        "license": "FLUX.1-dev non-commercial",
    },
    # --- VAE ---
    {
        "name": "FLUX.1 Dev VAE",
        "source": ("hf", "black-forest-labs/FLUX.1-dev", "vae/ae.safetensors"),
        "folder": "vae",
        "filename": "ae.safetensors",
        "size_approx": 351_000_000,  # ~335 MB
        "required": True,
        "license": "FLUX.1-dev non-commercial",
    },
    # --- CLIP-L text encoder ---
    {
        "name": "CLIP-L (FLUX text encoder)",
        "source": ("hf", "comfyanonymous/flux_text_encoders", "clip_l.safetensors"),
        "folder": "clip",
        "filename": "clip_l.safetensors",
        "size_approx": 258_000_000,  # ~246 MB
        "required": True,
        "license": "Apache-2.0",
    },
    # --- T5-XXL text encoder (fp16) ---
    {
        "name": "T5-XXL fp16 (FLUX text encoder)",
        "source": ("hf", "comfyanonymous/flux_text_encoders", "t5xxl_fp16.safetensors"),
        "folder": "clip",
        "filename": "t5xxl_fp16.safetensors",
        "size_approx": 10_460_000_000,  # ~9.79 GB
        "required": True,
        "license": "Apache-2.0",
    },
    # --- T5-XXL text encoder (fp8, optional — lower RAM alternative) ---
    {
        "name": "T5-XXL fp8 (FLUX text encoder, low-RAM alt)",
        "source": (
            "hf",
            "comfyanonymous/flux_text_encoders",
            "t5xxl_fp8_e4m3fn.safetensors",
        ),
        "folder": "clip",
        "filename": "t5xxl_fp8_e4m3fn.safetensors",
        "size_approx": 5_243_000_000,  # ~4.89 GB
        "required": False,
        "license": "Apache-2.0",
    },
    # --- Vector Art & Line Art LoRA (NadaNadi) ---
    {
        "name": "Vector Art & Line Art LoRA (v3ctora)",
        "source": (
            "url",
            "https://civitai.com/api/download/models/768020",
            "v3ctora.safetensors",
        ),
        "folder": "loras",
        "filename": "v3ctora.safetensors",
        "size_approx": 67_300_000,  # ~64 MB
        "required": False,
        "license": "FLUX.1-dev non-commercial",
        "trigger": "v3ctora style",
    },
    # --- Simple Vector Flux LoRA (renderartist) ---
    {
        "name": "Simple Vector Flux LoRA",
        "source": (
            "hf",
            "renderartist/simplevectorflux",
            "simplevectorflux.safetensors",
        ),
        "folder": "loras",
        "filename": "simplevectorflux.safetensors",
        "size_approx": 153_800_000,  # ~146 MB
        "required": False,
        "license": "CreativeML OpenRAIL-M",
        "trigger": "v3ct0r, vector",
    },
    # --- Shakker-Labs Vector Journey LoRA (alternative) ---
    {
        "name": "Shakker-Labs Vector Journey LoRA",
        "source": (
            "hf",
            "Shakker-Labs/FLUX.1-dev-LoRA-Vector-Journey",
            "FLUX.1-dev-LoRA-Vector-Journey.safetensors",
        ),
        "folder": "loras",
        "filename": "FLUX.1-dev-LoRA-Vector-Journey.safetensors",
        "size_approx": 2_600_000_000,  # ~2.6 GB
        "required": False,
        "license": "FLUX.1-dev non-commercial",
    },
    # --- 4x_NMKD-Siax upscaler ---
    {
        "name": "4x_NMKD-Siax_200k Upscaler",
        "source": ("hf", "uwg/upscaler", "ESRGAN/4x_NMKD-Siax_200k.pth"),
        "folder": "upscale_models",
        "filename": "4x_NMKD-Siax_200k.pth",
        "size_approx": 70_100_000,  # ~67 MB
        "required": False,
        "license": "WTFPL",
    },
    # --- 4x-UltraSharp upscaler ---
    {
        "name": "4x-UltraSharp Upscaler",
        "source": ("hf", "Kim2091/UltraSharp", "4x-UltraSharp.pth"),
        "folder": "upscale_models",
        "filename": "4x-UltraSharp.pth",
        "size_approx": 66_900_000,  # ~64 MB
        "required": False,
        "license": "CC BY-NC-SA 4.0",
    },
    # --- RemBG u2net model ---
    {
        "name": "RemBG u2net (background removal)",
        "source": (
            "url",
            "https://github.com/danielgatis/rembg/releases/download/v0.0.0/u2net.onnx",
            "u2net.onnx",
        ),
        "folder": None,  # Special: goes to ~/.u2net/
        "filename": "u2net.onnx",
        "size_approx": 185_000_000,  # ~176 MB
        "required": False,
        "license": "MIT",
    },
]


def format_size(nbytes: int) -> str:
    """Format bytes as human-readable size."""
    size = float(nbytes)
    for unit in ("B", "KB", "MB", "GB"):
        if abs(size) < 1024:
            return f"{size:.1f} {unit}"
        size /= 1024
    return f"{size:.1f} TB"


def get_dest_path(comfy_dir: Path, model: dict) -> Path:
    """Compute the destination path for a model file."""
    if model["folder"] is None:
        return Path.home() / ".u2net" / model["filename"]
    return comfy_dir / "models" / model["folder"] / model["filename"]


def download_huggingface(source: tuple, dest: Path) -> bool:
    """Download a file from HuggingFace Hub."""
    repo_id, filename = source[1], source[2]
    try:
        local = hf_hub_download(
            repo_id=repo_id, filename=filename, local_dir=str(dest.parent)
        )
        if local != str(dest):
            shutil.copy2(local, dest)
        return True
    except Exception as e:
        print(f"    FAILED: {e}")
        return False


def download_url(source: tuple, dest: Path) -> bool:
    """Download a file from a direct URL with progress bar."""
    url, _ = source[1], source[2]
    import urllib.request

    tmp_path = None
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "AHLingo/1.0"})
        with urllib.request.urlopen(req, timeout=120) as resp:
            content_length = resp.headers.get("Content-Length")
            total = int(content_length) if content_length else None

            with tempfile.NamedTemporaryFile(delete=False, dir=str(dest.parent)) as tmp:
                tmp_path = tmp.name
                if total:
                    done = 0
                    block_size = 8_192
                    with tqdm(
                        total=total, unit="B", unit_scale=True, desc="  Download"
                    ) as pbar:
                        while True:
                            chunk = resp.read(block_size)
                            if not chunk:
                                break
                            tmp.write(chunk)
                            done += len(chunk)
                            pbar.update(len(chunk))
                else:
                    shutil.copyfileobj(resp, tmp)

            shutil.move(tmp_path, dest)
            return True
    except Exception as e:
        print(f"    FAILED: {e}")
        if tmp_path and Path(tmp_path).exists():
            Path(tmp_path).unlink()
        return False


def download_model(comfy_dir: Path, model: dict, dry_run: bool = False) -> bool:
    """Download a single model to its destination."""
    dest = get_dest_path(comfy_dir, model)
    source_type = model["source"][0]

    if dest.exists():
        actual = dest.stat().st_size
        expected = model["size_approx"]
        ratio = actual / expected if expected else 1
        if 0.7 < ratio < 1.5:
            print(f"  SKIP (exists, {format_size(actual)}): {dest.name}")
            return True
        else:
            print(
                f"  WARN (size mismatch: {format_size(actual)} vs expected {format_size(expected)}): {dest.name}"
            )

    if dry_run:
        print(f"  WOULD DOWNLOAD: {model['name']}")
        print(f"    -> {dest}")
        print(f"    (~{format_size(model['size_approx'])})")
        return True

    dest.parent.mkdir(parents=True, exist_ok=True)
    print(f"  Downloading: {model['name']}")
    print(f"    -> {dest}")

    if source_type == "hf":
        return download_huggingface(model["source"], dest)
    elif source_type == "url":
        return download_url(model["source"], dest)
    else:
        print(f"    FAILED: Unknown source type '{source_type}'")
        return False


def list_models():
    """Print all available models with metadata."""
    required = [m for m in MODELS if m["required"]]
    optional = [m for m in MODELS if not m["required"]]

    print(f"\n{'='*80}")
    print(f"AVAILABLE MODELS FOR AHLINGO IMAGE PIPELINE")
    print(f"{'='*80}")

    print(f"\nRequired ({len(required)}):")
    for m in required:
        print(f"  [REQ] {m['name']}")
        print(f"        Size: ~{format_size(m['size_approx'])}")
        print(f"        License: {m['license']}")
        print()

    print(f"Optional ({len(optional)}):")
    for m in optional:
        trigger = f"  Trigger: {m['trigger']}" if "trigger" in m else ""
        print(f"  [OPT] {m['name']}")
        print(f"        Size: ~{format_size(m['size_approx'])}")
        print(f"        License: {m['license']}")
        print(f"{trigger}")
        print()

    total_required = sum(m["size_approx"] for m in required)
    total_all = sum(m["size_approx"] for m in MODELS)
    print(f"Total required: ~{format_size(total_required)}")
    print(f"Total all models: ~{format_size(total_all)}")
    print()


def check_comfyui(comfy_dir: Path) -> bool:
    """Verify ComfyUI directory exists and looks valid."""
    if not comfy_dir.exists():
        print(f"ERROR: ComfyUI directory not found: {comfy_dir}")
        return False
    main_py = comfy_dir / "main.py"
    if not main_py.exists():
        print(f"WARNING: main.py not found in {comfy_dir}")
        print(f"  This may not be a valid ComfyUI directory.")
    return True


def print_pipeline_summary():
    """Print the target ComfyUI pipeline node chain."""
    print(f"\n{'='*80}")
    print(f"TARGET COMFYUI PIPELINE (FLUX.1 Dev GGUF + Clip-Art LoRA)")
    print(f"{'='*80}")
    print("""
Node Chain:
  [1]  Unet Loader (GGUF)
       File: flux1-dev-Q6_K.gguf
       Folder: models/unet/
       Requires: ComfyUI-GGUF custom node (github.com/city96/ComfyUI-GGUF)

  [2]  LoraLoaderModelOnly
       File: simplevectorflux.safetensors  (or v3ctora.safetensors)
       Folder: models/loras/
       Strength: 0.7
       Trigger word: "v3ct0r" (or "v3ctora style")

  [3]  DualCLIPLoader (GGUF)
       Files: clip_l.safetensors + t5xxl_fp16.safetensors
       Folder: models/clip/
       Type: flux

  [4]  VAELoader
       File: ae.safetensors
       Folder: models/vae/

  [5]  CLIPTextEncode
       Text: "<trigger> flat vector clip art of [SUBJECT], bold black outlines,
              white background, flat solid colors, no gradients, no shadows,
              simple geometric shapes, 2D, minimalist, centered, isolated"

  [6]  ModelSamplingFlux
       (flux-specific sampling settings)

  [7]  ConditioningZeroOut
       (creates negative conditioning for distilled model)

  [8]  CFGGuider
       CFG: 1.0 (correct for distilled model)

  [9]  KSamplerSelect
       Sampler: dpmpp_2m

  [10] RandomNoise
       Seed: fixed per image for reproducibility

  [11] BasicScheduler
       Scheduler: simple
       Steps: 6

  [12] SamplerCustomAdvanced
       (noise + guider + sampler + sigmas + latent 1024x1024)

  [13] VAEDecode
       (latent -> image)

  [14] UpscaleModelLoader
       File: 4x_NMKD-Siax_200k.pth
       Folder: models/upscale_models/

  [15] ImageUpscaleWithModel
       Scale: 2x (1024 -> 2048)

  [16] Image Remove Background (rembg)
       Model: u2net.onnx
       Requires: rembg-comfyui-node custom node + pip install rembg

  [17] SaveImage
       Output: transparent PNG clip art

Key changes from current workflow:
  - GGUF loader (Mac M-series compatible, lower VRAM)
  - DualCLIP (CLIP-L + T5-XXL, proper FLUX.1 Dev text encoding)
  - Style LoRA (enforces flat vector clip-art aesthetic)
  - dpmpp_2m sampler (sharper than euler)
  - Simple scheduler (better quality than Flux2Scheduler)
  - 6 steps (more detail than 4)
  - 1024x1024 resolution (native FLUX resolution, vs 512)
  - Upscaler (clean 2x for final output)
  - Background removal (transparent PNG)
""")


def main():
    parser = argparse.ArgumentParser(
        description="Download models for AHLingo FLUX.1 Dev clip-art ComfyUI pipeline"
    )
    parser.add_argument(
        "--comfy-dir",
        type=str,
        default=str(COMFYUI_DEFAULT),
        help=f"Path to ComfyUI directory (default: {COMFYUI_DEFAULT})",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be downloaded without downloading",
    )
    parser.add_argument(
        "--list",
        action="store_true",
        help="List all available models and exit",
    )
    parser.add_argument(
        "--pipeline",
        action="store_true",
        help="Print the target ComfyUI pipeline and exit",
    )
    parser.add_argument(
        "--optional",
        action="store_true",
        help="Also download optional models",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Redownload even if files exist",
    )

    args = parser.parse_args()
    comfy_dir = Path(args.comfy_dir)

    if args.list:
        list_models()
        return

    if args.pipeline:
        print_pipeline_summary()
        return

    if not check_comfyui(comfy_dir):
        if not args.dry_run:
            print(
                "\nUse --comfy-dir to specify the correct path, or --dry-run to preview."
            )
            sys.exit(1)

    models_to_download = (
        MODELS if args.optional else [m for m in MODELS if m["required"]]
    )

    print(f"\n{'='*80}")
    print(f"AHLINGO MODEL DOWNLOADER")
    print(f"{'='*80}")
    print(f"ComfyUI dir: {comfy_dir}")
    print(f"Dry run: {args.dry_run}")
    print(f"Models to process: {len(models_to_download)}")
    print(f"{'='*80}\n")

    total_size = sum(m["size_approx"] for m in models_to_download)
    print(f"Estimated download: {format_size(total_size)}")
    print()

    results = {"success": 0, "skipped": 0, "failed": 0}
    failed_names = []

    for model in models_to_download:
        tag = "REQ" if model["required"] else "OPT"
        print(f"[{tag}] {model['name']}")

        if args.force and get_dest_path(comfy_dir, model).exists():
            get_dest_path(comfy_dir, model).unlink()
            print(f"  REMOVED existing file (forced re-download)")

        ok = download_model(comfy_dir, model, dry_run=args.dry_run)
        if ok:
            results["success"] += 1
        else:
            results["failed"] += 1
            failed_names.append(model["name"])
        print()

    print(f"{'='*80}")
    print(f"RESULTS: {results['success']} ok, {results['failed']} failed")
    print(f"{'='*80}")

    if failed_names:
        print(f"\nFailed models: {', '.join(failed_names)}")
        sys.exit(1)

    if not args.dry_run:
        print("\nPost-install steps:")
        print(f"  1. Install ComfyUI-GGUF custom node:")
        print(f"     cd {comfy_dir}/custom_nodes")
        print(f"     git clone https://github.com/city96/ComfyUI-GGUF.git")
        print(f"     cd ComfyUI-GGUF && pip install -r requirements.txt")
        print()
        print(f"  2. Install rembg for background removal:")
        print(f"     pip install rembg")
        print(f"     cd {comfy_dir}/custom_nodes")
        print(f"     git clone https://github.com/Jcd1230/rembg-comfyui-node.git")
        print()
        print(f"  3. Start ComfyUI:")
        print(f"     cd {comfy_dir} && python main.py --force-fp16")
        print()


if __name__ == "__main__":
    main()
