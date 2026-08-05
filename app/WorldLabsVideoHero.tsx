"use client";

/* eslint-disable @next/next/no-img-element -- the fallback must remain available if video decoding fails */

import { useEffect, useRef, useState } from "react";

export function WorldLabsVideoHero({ active }: { active: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) setReady(true);

    if (!active) {
      video.pause();
      return;
    }

    void video.play().catch(() => {
      // The official poster remains visible if a browser blocks playback.
    });
  }, [active]);

  return (
    <div className={`worldlabs-video-hero ${ready ? "is-ready" : ""} ${failed ? "is-failed" : ""}`}>
      <img
        src="/media/world-labs/ancient-stone-crypt-thumbnail.webp"
        alt="World Labs Marble ancient stone crypt Gaussian splat world"
      />
      <video
        ref={videoRef}
        muted
        loop
        playsInline
        preload="auto"
        poster="/media/world-labs/ancient-stone-crypt-thumbnail.webp"
        aria-label="Official World Labs Marble Gaussian splat world video"
        onLoadedData={() => setReady(true)}
        onCanPlay={() => setReady(true)}
        onError={() => setFailed(true)}
      >
        <source src="/media/world-labs/ancient-stone-crypt-official.mp4" type="video/mp4" />
      </video>
    </div>
  );
}
