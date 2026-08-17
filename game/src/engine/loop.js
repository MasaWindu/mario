// Fixed-timestep game loop with render interpolation.

const STEP = 1 / 120; // physics substep for stability
const MAX_FRAME = 0.25; // clamp huge gaps (tab was backgrounded)

export function startLoop({ update, render }) {
  let acc = 0;
  let last = performance.now();
  let frames = 0;
  let fpsTimer = 0;
  let fps = 0;

  function tick(now) {
    let dt = (now - last) / 1000;
    last = now;
    if (dt > MAX_FRAME) dt = MAX_FRAME;
    acc += dt;

    fpsTimer += dt;
    frames++;
    if (fpsTimer >= 0.5) {
      fps = Math.round(frames / fpsTimer);
      frames = 0;
      fpsTimer = 0;
    }

    while (acc >= STEP) {
      update(STEP);
      acc -= STEP;
    }
    render(acc / STEP, fps);
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

export { STEP };
