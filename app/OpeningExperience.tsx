"use client";

import { useState } from "react";

const splats = Array.from({ length: 54 }, (_, index) => ({
  left: 4 + ((index * 17) % 92),
  top: 6 + ((index * 29) % 84),
  width: 14 + (index % 7) * 7,
  height: 5 + (index % 5) * 3,
  rotation: (index * 37) % 180,
  delay: (index % 9) * 18,
}));

export function OpeningExperience() {
  const [run, setRun] = useState(0);
  const [paused, setPaused] = useState(false);

  return (
    <main className="opening-page">
      <section
        className={`opening-sequence${paused ? " is-paused" : ""}`}
        key={run}
        aria-label="From Images to Places opening sequence"
      >
        <header className="site-header">
          <a href="#opening" aria-label="From Images to Places home">
            From Images to Places
          </a>
          <p>A spatial record · Columbia GSAPP</p>
        </header>

        <div className="opening-copy" id="opening">
          <div className="copy-state copy-state--one" aria-hidden="true">
            <p>We live in 3D.</p>
            <h1>We remember<br />in 2D.</h1>
          </div>
          <div className="copy-state copy-state--two" aria-hidden="true">
            <p>An ordinary camera can now</p>
            <h2>capture<br />a field.</h2>
          </div>
          <div className="copy-state copy-state--three" aria-hidden="true">
            <p>From measurement to presence</p>
            <h2>Not a virtual world.<br />A captured one.</h2>
          </div>
          <p className="sr-only">
            We live in three dimensions, but preserve places as flat images. Ordinary cameras can now capture spatial fields. The sequence moves from LiDAR samples and a photogrammetry mesh toward Gaussian Splatting.
          </p>
        </div>

        <div className="visual-stage" aria-hidden="true">
          <div className="spatial-object">
            <div className="depth-slice depth-slice--back" />
            <div className="depth-slice depth-slice--middle" />
            <div className="depth-slice depth-slice--front" />

            <div className="room-artifact">
              <div className="room-texture" />
              <div className="field-reveal" />
              <div className="comparison-veil" />
              <div className="mode-layer mode-lidar" />
              <div className="mode-layer mode-mesh" />
              <div className="mode-layer mode-gaussian">
                {splats.map((splat, index) => (
                  <i
                    key={index}
                    style={{
                      "--left": `${splat.left}%`,
                      "--top": `${splat.top}%`,
                      "--width": `${splat.width}px`,
                      "--height": `${splat.height}px`,
                      "--rotation": `${splat.rotation}deg`,
                      "--delay": `${splat.delay}ms`,
                    } as React.CSSProperties}
                  />
                ))}
              </div>
              <div className="scan-plane" />
              <span className="artifact-edge artifact-edge--top" />
              <span className="artifact-edge artifact-edge--right" />
              <span className="artifact-edge artifact-edge--bottom" />
              <span className="artifact-edge artifact-edge--left" />
            </div>

            <div className="phone-capture">
              <i className="phone-camera" />
              <span />
            </div>
          </div>
        </div>

        <footer className="sequence-footer">
          <div className="sequence-status" aria-hidden="true">
            <span>Space</span>
            <span>Surface</span>
            <span>Field</span>
            <i />
          </div>
          <div className="sequence-controls">
            <button type="button" onClick={() => setPaused((value) => !value)}>
              {paused ? "Play" : "Pause"}
            </button>
            <button
              type="button"
              onClick={() => {
                setPaused(false);
                setRun((value) => value + 1);
              }}
            >
              Replay
            </button>
          </div>
        </footer>
      </section>
    </main>
  );
}
