"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type CameraPathMessage = {
  source?: string;
  action?: string;
};

export function ContinentalCameraPathHero({ active }: { active: boolean }) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);

  const sendPlaybackState = useCallback((shouldPlay: boolean) => {
    frameRef.current?.contentWindow?.postMessage(
      {
        source: "continental-camera-path",
        action: shouldPlay ? "play" : "pause",
      },
      window.location.origin,
    );
  }, []);

  useEffect(() => {
    sendPlaybackState(active);
  }, [active, sendPlaybackState]);

  useEffect(() => {
    const onMessage = (event: MessageEvent<CameraPathMessage>) => {
      if (event.origin !== window.location.origin || event.source !== frameRef.current?.contentWindow) return;
      if (event.data?.source !== "continental-camera-path") return;

      if (event.data.action === "ready") {
        setReady(true);
        sendPlaybackState(active);
      }

      if (event.data.action === "advance") {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: " ", code: "Space", bubbles: true }));
      }
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [active, sendPlaybackState]);

  return (
    <div className={`continental-camera-path-hero ${ready ? "is-ready" : ""}`}>
      <iframe
        ref={frameRef}
        src="/media/continental-camera-path/index.html?embed=1&autoplay=0"
        title="Interactive Continental Rooftop Gaussian Splatting camera path"
        aria-label="Interactive Continental Rooftop Gaussian Splatting camera path"
        loading="eager"
        allow="autoplay; fullscreen"
        onLoad={() => sendPlaybackState(active)}
      />
      <div className="camera-path-interaction" aria-hidden="true">Drag to orbit · Scroll to zoom</div>
    </div>
  );
}
