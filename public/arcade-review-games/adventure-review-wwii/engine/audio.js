const STORAGE_KEY = "ta-adventure-review-muted";

export function createAudio() {
  let muted = localStorage.getItem(STORAGE_KEY) === "true";

  function setMuted(value) {
    muted = value;
    localStorage.setItem(STORAGE_KEY, muted ? "true" : "false");
  }

  return {
    isMuted() {
      return muted;
    },
    toggle() {
      setMuted(!muted);
      return muted;
    },
    setMuted,
    play() {
      // Placeholder for future audio cues.
      return muted;
    }
  };
}
