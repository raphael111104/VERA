import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { m } from "../paraglide/messages.js";
import { IconButton } from "./ui";

/** Decorative local video; keep a poster when playback is unavailable. */
export function HeroBackdrop({ exiting }: { exiting: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [available, setAvailable] = useState(true);
  const [playing, setPlaying] = useState(() => typeof window !== "undefined" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !available) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let inView = false;
    let active = true;
    const syncPlayback = () => {
      if (playing && !exiting && inView && !document.hidden) {
        void video.play().catch(() => { if (active) setPlaying(false); });
      } else video.pause();
    };
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      syncPlayback();
    }, { threshold: 0 });
    const motionChanged = () => {
      if (reducedMotion.matches) {
        video.pause();
        setPlaying(false);
      } else syncPlayback();
    };
    observer.observe(video);
    document.addEventListener("visibilitychange", syncPlayback);
    reducedMotion.addEventListener("change", motionChanged);
    return () => {
      active = false;
      observer.disconnect();
      document.removeEventListener("visibilitychange", syncPlayback);
      reducedMotion.removeEventListener("change", motionChanged);
      video.pause();
    };
  }, [available, playing, exiting]);

  const label = playing ? m.vera_landing_pause_video() : m.vera_landing_play_video();
  return (
    <>
      <div className="vera-hero-backdrop" aria-hidden="true">
        <img className="vera-hero-media" src="/vera-book-poster.webp" alt="" decoding="async" />
        {available && <video ref={videoRef} className="vera-hero-media" src="/vera-book-loop.mp4" poster="/vera-book-poster.webp" muted loop playsInline preload="metadata" disablePictureInPicture tabIndex={-1} onError={() => setAvailable(false)} />}
        <span className="vera-hero-veil" />
      </div>
      {available && <IconButton className="vera-hero-video-control" shape="circle" onClick={() => setPlaying((value) => !value)} disabled={exiting} aria-label={label} title={label}>
        {playing ? <Pause size={15} aria-hidden="true" /> : <Play size={15} aria-hidden="true" />}
      </IconButton>}
    </>
  );
}
