"""Prepare the licensed Mixkit 42926 footage for VERA's landing hero.

Usage: python scripts/prepare-vera-hero.py /path/to/mixkit-42926-full-hd.mp4
Requires imageio-ffmpeg (or ffmpeg on PATH). No media generation is used.
The source is available through the Download Free Full HD Video button at:
https://mixkit.co/free-stock-video/close-tour-through-the-middle-of-an-open-book-42926/
"""
from pathlib import Path
import hashlib
import json
import shutil
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "target" / "vera-video-tools"))


def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    if len(sys.argv) != 2:
        raise SystemExit("Pass the downloaded Mixkit 42926 Full HD MP4 path.")
    source = Path(sys.argv[1]).resolve(strict=True)
    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        import imageio_ffmpeg
        ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()

    output = ROOT / "ui" / "public"
    output.mkdir(parents=True, exist_ok=True)
    video = output / "vera-book-loop.mp4"
    poster = output / "vera-book-poster.webp"
    # The shot only contains a camera pan over paper. Reversing the pan makes
    # a continuous return path without reversing any human actions.
    filters = (
        "[0:v]trim=start=0.3:end=5.3,setpts=1.5*(PTS-STARTPTS),"
        "scale=1280:720:flags=lanczos,setsar=1,"
        "eq=saturation=0.65:contrast=1.02:brightness=0.025,"
        "minterpolate=fps=24:mi_mode=blend,split=2[forward][copy];"
        "[copy]reverse,setpts=PTS-STARTPTS[backward];"
        "[forward][backward]concat=n=2:v=1:a=0[out]"
    )
    subprocess.run([
        ffmpeg, "-hide_banner", "-loglevel", "warning", "-y", "-i", str(source),
        "-filter_complex", filters, "-map", "[out]", "-an", "-c:v", "libx264",
        "-preset", "slow", "-crf", "24", "-profile:v", "main", "-pix_fmt",
        "yuv420p", "-r", "24", "-fps_mode", "cfr", "-level:v", "3.1",
        "-video_track_timescale", "24000", "-movflags", "+faststart",
        "-map_metadata", "-1", str(video),
    ], check=True)
    subprocess.run([
        ffmpeg, "-hide_banner", "-loglevel", "warning", "-y", "-i", str(video),
        "-frames:v", "1", "-c:v", "libwebp", "-quality", "82", str(poster),
    ], check=True)
    manifest = {
        "title": "Close tour through the middle of an open book",
        "provider": "Mixkit",
        "contributor": "Mixkit (as listed on the asset page)",
        "source_url": "https://mixkit.co/free-stock-video/close-tour-through-the-middle-of-an-open-book-42926/",
        "license_name": "Mixkit Stock Video Free License",
        "license_url": "https://mixkit.co/license/#videoFree",
        "license_checked": "2026-10-09",
        "attribution_required": False,
        "source_sha256": sha256(source),
        "source_bytes": source.stat().st_size,
        "changes": ["Trim to 0.3-5.3 seconds", "Slow camera pan to two-thirds speed", "Forward and reverse camera path", "Neutral color adjustment", "1280x720 H.264 conversion", "No audio", "Extract static poster"],
        "video": {"file": video.name, "bytes": video.stat().st_size, "sha256": sha256(video)},
        "poster": {"file": poster.name, "bytes": poster.stat().st_size, "sha256": sha256(poster)},
        "note": "Licensed stock footage; not CC0, not a generated video. Media license is separate from the repository software license."
    }
    (output / "vera-hero-source.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(manifest, indent=2))


if __name__ == "__main__":
    main()
