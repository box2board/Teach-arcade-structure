const isTouchDevice = navigator.maxTouchPoints > 0 || window.matchMedia?.("(pointer: coarse)").matches;

if (isTouchDevice) {
  document.documentElement.classList.add("touch-device");

  const controls = document.getElementById("touchControls");
  const joystickZone = document.getElementById("touchJoystickZone");
  const stick = document.getElementById("touchJoystickStick");
  const jumpButton = document.getElementById("touchJump");
  const interactButton = document.getElementById("touchInteract");
  const runButton = document.getElementById("touchRun");
  const keyboardHint = document.getElementById("controlsHint");
  const interactionPrompt = document.getElementById("interactionPrompt");
  const questionFooter = document.querySelector("#questionDialog .dialog-footer > span");

  if (controls && joystickZone && stick && jumpButton && interactButton && runButton) {
    controls.hidden = false;
    if (keyboardHint) keyboardHint.hidden = true;
    if (questionFooter) questionFooter.textContent = "Tap an answer to choose it.";

    const interactionKey = interactionPrompt?.querySelector("kbd");
    if (interactionKey) interactionKey.textContent = "ACTION";

    const movementKeys = new Set();
    let joystickPointer = null;
    let runActive = false;

    function emitKey(type, code) {
      window.dispatchEvent(new KeyboardEvent(type, {
        code,
        key: code === "Space" ? " " : code.replace(/^Key/, "").replace("ShiftLeft", "Shift"),
        bubbles: true,
        cancelable: true,
      }));
    }

    function press(code) {
      emitKey("keydown", code);
    }

    function release(code) {
      emitKey("keyup", code);
    }

    function tapKey(code) {
      press(code);
      window.setTimeout(() => release(code), 45);
    }

    function syncMovement(nextKeys) {
      for (const code of movementKeys) {
        if (!nextKeys.has(code)) {
          release(code);
          movementKeys.delete(code);
        }
      }
      for (const code of nextKeys) {
        if (!movementKeys.has(code)) {
          movementKeys.add(code);
          press(code);
        }
      }
    }

    function updateJoystick(event) {
      const rect = joystickZone.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const maxRadius = Math.min(rect.width, rect.height) * 0.29;
      let dx = event.clientX - centerX;
      let dy = event.clientY - centerY;
      const length = Math.hypot(dx, dy);
      if (length > maxRadius) {
        const scale = maxRadius / length;
        dx *= scale;
        dy *= scale;
      }

      stick.style.transform = `translate(${dx}px, ${dy}px)`;

      const nx = dx / maxRadius;
      const ny = dy / maxRadius;
      const deadzone = 0.24;
      const next = new Set();
      if (ny < -deadzone) next.add("KeyW");
      if (ny > deadzone) next.add("KeyS");
      if (nx < -deadzone) next.add("KeyA");
      if (nx > deadzone) next.add("KeyD");
      syncMovement(next);
    }

    function resetJoystick() {
      syncMovement(new Set());
      stick.style.transform = "translate(0px, 0px)";
      joystickPointer = null;
      joystickZone.classList.remove("active");
    }

    joystickZone.addEventListener("pointerdown", (event) => {
      if (joystickPointer !== null) return;
      joystickPointer = event.pointerId;
      joystickZone.classList.add("active");
      joystickZone.setPointerCapture?.(event.pointerId);
      updateJoystick(event);
      event.preventDefault();
    }, { passive: false });

    joystickZone.addEventListener("pointermove", (event) => {
      if (event.pointerId !== joystickPointer) return;
      updateJoystick(event);
      event.preventDefault();
    }, { passive: false });

    joystickZone.addEventListener("pointerup", (event) => {
      if (event.pointerId !== joystickPointer) return;
      resetJoystick();
      event.preventDefault();
    }, { passive: false });

    joystickZone.addEventListener("pointercancel", resetJoystick);
    joystickZone.addEventListener("lostpointercapture", () => {
      if (joystickPointer !== null) resetJoystick();
    });

    jumpButton.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      tapKey("Space");
      jumpButton.classList.add("pressed");
    }, { passive: false });
    jumpButton.addEventListener("pointerup", () => jumpButton.classList.remove("pressed"));
    jumpButton.addEventListener("pointercancel", () => jumpButton.classList.remove("pressed"));

    interactButton.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      tapKey("KeyE");
      interactButton.classList.add("pressed");
    }, { passive: false });
    interactButton.addEventListener("pointerup", () => interactButton.classList.remove("pressed"));
    interactButton.addEventListener("pointercancel", () => interactButton.classList.remove("pressed"));

    runButton.addEventListener("click", (event) => {
      event.preventDefault();
      runActive = !runActive;
      runButton.classList.toggle("active", runActive);
      runButton.setAttribute("aria-pressed", String(runActive));
      if (runActive) press("ShiftLeft");
      else release("ShiftLeft");
    });

    window.addEventListener("blur", () => {
      resetJoystick();
      if (runActive) {
        runActive = false;
        runButton.classList.remove("active");
        runButton.setAttribute("aria-pressed", "false");
        release("ShiftLeft");
      }
    });

    document.addEventListener("contextmenu", (event) => {
      if (event.target.closest?.("#touchControls, #gameMount")) event.preventDefault();
    });
  }
}
