const KEY_MAP = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  w: "up",
  a: "left",
  s: "down",
  d: "right",
  W: "up",
  A: "left",
  S: "down",
  D: "right"
};

export function createInput({ dpadButtons, interactButton }) {
  const pressed = new Set();
  let interactQueued = false;

  function onKeyDown(event) {
    const dir = KEY_MAP[event.key];
    if (dir) {
      pressed.add(dir);
      return;
    }
    if (event.key === "e" || event.key === "E" || event.key === "Enter") {
      interactQueued = true;
    }
  }

  function onKeyUp(event) {
    const dir = KEY_MAP[event.key];
    if (dir) {
      pressed.delete(dir);
    }
  }

  function handlePointer(button, dir) {
    const start = (event) => {
      event.preventDefault();
      pressed.add(dir);
    };
    const end = (event) => {
      event.preventDefault();
      pressed.delete(dir);
    };

    button.addEventListener("touchstart", start, { passive: false });
    button.addEventListener("touchend", end, { passive: false });
    button.addEventListener("touchcancel", end, { passive: false });
    button.addEventListener("mousedown", start);
    button.addEventListener("mouseup", end);
    button.addEventListener("mouseleave", end);
  }

  dpadButtons.forEach((button) => {
    const dir = button.dataset.dir;
    if (dir) {
      handlePointer(button, dir);
    }
  });

  const handleInteractStart = (event) => {
    event.preventDefault();
    interactQueued = true;
  };

  interactButton.addEventListener("touchstart", handleInteractStart, { passive: false });
  interactButton.addEventListener("mousedown", handleInteractStart);

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);

  return {
    getVector() {
      let x = 0;
      let y = 0;
      if (pressed.has("left")) x -= 1;
      if (pressed.has("right")) x += 1;
      if (pressed.has("up")) y -= 1;
      if (pressed.has("down")) y += 1;
      const length = Math.hypot(x, y);
      if (length > 0) {
        x /= length;
        y /= length;
      }
      return { x, y, moving: length > 0 };
    },
    consumeInteract() {
      if (interactQueued) {
        interactQueued = false;
        return true;
      }
      return false;
    },
    reset() {
      pressed.clear();
      interactQueued = false;
    }
  };
}
