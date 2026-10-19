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
    if (document.querySelector(".overlay.active, .results-screen.active") || document.getElementById("start-screen").style.display !== "none") return;
    const dir = KEY_MAP[event.key];
    if (dir) {
      event.preventDefault();
      pressed.add(dir);
      return;
    }
    if (event.key === "e" || event.key === "E" || event.key === "Enter" || event.code === "Space") {
      if (event.target.closest("button, a")) return;
      event.preventDefault();
      if (!event.repeat) interactQueued = true;
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

    button.addEventListener("pointerdown", (event) => {
      button.setPointerCapture(event.pointerId);
      start(event);
    });
    button.addEventListener("pointerup", end);
    button.addEventListener("pointercancel", end);
    button.addEventListener("lostpointercapture", end);
  }

  dpadButtons.forEach((button) => {
    const dir = button.dataset.dir;
    if (dir) {
      handlePointer(button, dir);
    }
  });

  interactButton.addEventListener("click", () => {
    if (!interactButton.disabled) interactQueued = true;
  });
  window.addEventListener("blur", () => { pressed.clear(); interactQueued = false; });

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
