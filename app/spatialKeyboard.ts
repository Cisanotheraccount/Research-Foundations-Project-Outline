export type SpatialKeyDirection = -1 | 0 | 1;

export function spatialKeyDirection(event: Pick<KeyboardEvent, "key" | "code">): SpatialKeyDirection {
  if (event.key === "ArrowUp") return -1;
  if (event.key === " " || event.code === "Space" || event.key === "Enter" || event.key === "ArrowDown") return 1;
  return 0;
}

export function keyboardTargetIsInteractive(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const interactive = target.closest<HTMLElement>("button, input, textarea, select, a, [contenteditable='true'], [tabindex]:not([tabindex='-1'])");
  if (!interactive) return false;

  // A control from the previous chapter can retain focus after a smooth scroll.
  // Do not let Enter reactivate that now-offscreen control and jump backward.
  const bounds = interactive.getBoundingClientRect();
  const style = window.getComputedStyle(interactive);
  const isVisible = bounds.bottom > 0
    && bounds.right > 0
    && bounds.top < window.innerHeight
    && bounds.left < window.innerWidth
    && style.display !== "none"
    && style.visibility !== "hidden";
  if (!isVisible) {
    interactive.blur();
    return false;
  }
  return true;
}

export function sectionOwnsViewportCenter(section: HTMLElement | null) {
  if (!section) return false;
  const bounds = section.getBoundingClientRect();
  const center = window.innerHeight * 0.5;
  return bounds.top <= center && bounds.bottom > center;
}
