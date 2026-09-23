export const VIEWPORT_PAD = 12;

export function shiftToFitViewport(
  box: { x: number; y: number; width: number; height: number },
  viewport: { width: number; height: number },
  pad = VIEWPORT_PAD,
): { dx: number; dy: number } {
  const maxW = Math.max(0, viewport.width - pad * 2);
  const maxH = Math.max(0, viewport.height - pad * 2);
  const width = Math.min(box.width, maxW);
  const height = Math.min(box.height, maxH);
  let x = box.x;
  let y = box.y;
  if (x + width > viewport.width - pad) x = viewport.width - pad - width;
  if (x < pad) x = pad;
  if (y + height > viewport.height - pad) y = viewport.height - pad - height;
  if (y < pad) y = pad;
  return { dx: x - box.x, dy: y - box.y };
}

export function applyViewportClamp(el: HTMLElement, pad = VIEWPORT_PAD): void {
  el.style.marginLeft = '0px';
  el.style.marginTop = '0px';
  const box = el.getBoundingClientRect();
  const { dx, dy } = shiftToFitViewport(
    { x: box.x, y: box.y, width: box.width, height: box.height },
    { width: window.innerWidth, height: window.innerHeight },
    pad,
  );
  el.style.marginLeft = `${dx}px`;
  el.style.marginTop = `${dy}px`;
}
