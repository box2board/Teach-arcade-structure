(() => {
  const STORAGE_KEY = "ta_flags_of_our_fathers_focus_tracker_v1";
  const RESUME_KEY = "ta_flags_of_our_fathers_resume_v1";
  const tracker = document.querySelector("[data-focus-tracker]");
  if (!tracker) return;

  const fallback = tracker.closest(".wh-focus-tracker")?.querySelector("[data-fallback]");
  if (fallback) fallback.hidden = true;

  const entriesContainer = tracker.querySelector("[data-entries]");
  const emptyState = tracker.querySelector("[data-empty]");
  const status = tracker.querySelector(".wh-tracker-status");
  const categoryButtons = tracker.querySelectorAll("[data-category]");
  const copyButton = tracker.querySelector("[data-copy]");
  const resetButton = tracker.querySelector("[data-reset]");

  const entries = [];

  const storageAvailable = (() => {
    try {
      const testKey = "ta_storage_test";
      window.localStorage.setItem(testKey, "1");
      window.localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      return false;
    }
  })();

  const setStatus = (message) => {
    if (!status) return;
    status.textContent = message;
  };

  const syncEmptyState = () => {
    if (!emptyState) return;
    emptyState.style.display = entries.length ? "none" : "block";
  };

  const saveEntries = () => {
    if (!storageAvailable) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch (error) {
      setStatus("Notes are not saving on this device. You can still use the tracker.");
    }
  };

  const loadEntries = () => {
    if (!storageAvailable) return;
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return;
      parsed.forEach((entry) => addEntry(entry.category, entry, { silent: true }));
    } catch (error) {
      setStatus("Saved notes could not be loaded.");
    }
  };

  const updateEntry = (id, updates) => {
    const entry = entries.find((item) => item.id === id);
    if (!entry) return;
    Object.assign(entry, updates);
    saveEntries();
  };

  const removeEntry = (id, element) => {
    const index = entries.findIndex((item) => item.id === id);
    if (index === -1) return;
    entries.splice(index, 1);
    element.remove();
    saveEntries();
    syncEmptyState();
    setStatus("Entry removed.");
  };

  const buildEntryElement = (entry) => {
    const wrapper = document.createElement("div");
    wrapper.className = "wh-tracker-entry";

    const header = document.createElement("div");
    header.className = "wh-tracker-entry-header";

    const category = document.createElement("div");
    category.className = "wh-entry-category";
    category.textContent = entry.category;

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "wh-entry-delete";
    deleteButton.textContent = "Delete";

    header.appendChild(category);
    header.appendChild(deleteButton);

    const timeLabel = document.createElement("label");
    timeLabel.className = "wh-entry-time";
    timeLabel.textContent = "Timestamp (optional)";

    const timeInput = document.createElement("input");
    timeInput.type = "text";
    timeInput.className = "wh-entry-input";
    timeInput.placeholder = "e.g., 00:42:10";
    timeInput.value = entry.timestamp || "";

    const noteLabel = document.createElement("label");
    noteLabel.className = "wh-entry-time";
    noteLabel.textContent = "Note";

    const noteInput = document.createElement("textarea");
    noteInput.className = "wh-entry-note";
    noteInput.placeholder = "Write a brief observation.";
    noteInput.value = entry.note || "";

    timeInput.addEventListener("input", (event) => {
      updateEntry(entry.id, { timestamp: event.target.value });
    });

    noteInput.addEventListener("input", (event) => {
      updateEntry(entry.id, { note: event.target.value });
    });

    deleteButton.addEventListener("click", () => removeEntry(entry.id, wrapper));

    wrapper.appendChild(header);
    wrapper.appendChild(timeLabel);
    wrapper.appendChild(timeInput);
    wrapper.appendChild(noteLabel);
    wrapper.appendChild(noteInput);

    return wrapper;
  };

  const addEntry = (category, seed = {}, options = {}) => {
    const entry = {
      id: seed.id || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      category,
      timestamp: seed.timestamp || "",
      note: seed.note || "",
    };

    entries.push(entry);
    const element = buildEntryElement(entry);
    entriesContainer.appendChild(element);
    syncEmptyState();
    saveEntries();
    if (!options.silent) {
      setStatus(`${category} entry added.`);
    }
  };

  const buildCopyText = () => {
    if (!entries.length) return "No focus tracker notes yet.";
    return [
      "Flags of Our Fathers Focus Tracker Notes",
      "",
      ...entries.map((entry, index) => {
        const timeText = entry.timestamp ? ` (Time: ${entry.timestamp})` : "";
        const noteText = entry.note ? ` - ${entry.note}` : "";
        return `${index + 1}. ${entry.category}${timeText}${noteText}`;
      }),
    ].join("\n");
  };

  categoryButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const category = button.getAttribute("data-category");
      if (!category) return;
      addEntry(category);
    });
  });

  copyButton?.addEventListener("click", async () => {
    const text = buildCopyText();
    if (!navigator.clipboard || !navigator.clipboard.writeText) {
      setStatus("Clipboard copy isn’t available. Please select and copy your notes manually.");
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      setStatus("Notes copied to clipboard.");
    } catch (error) {
      setStatus("Copy failed. Please select and copy your notes manually.");
    }
  });

  resetButton?.addEventListener("click", () => {
    entries.length = 0;
    entriesContainer.querySelectorAll(".wh-tracker-entry").forEach((entry) => entry.remove());
    syncEmptyState();
    saveEntries();
    setStatus("Tracker reset.");
  });

  const resumePanel = document.querySelector("[data-resume-panel]");
  if (resumePanel) {
    const resumeCode = resumePanel.querySelector("[data-resume-code]");
    const resumeStatus = resumePanel.querySelector("[data-resume-status]");
    const resumeCopy = resumePanel.querySelector("[data-resume-copy]");
    const resumeReset = resumePanel.querySelector("[data-resume-reset]");

    const updateResumeStatus = (message) => {
      if (!resumeStatus) return;
      resumeStatus.textContent = message;
    };

    const generateResumeCode = () => {
      const chunk = () => Math.random().toString(36).slice(2, 6).toUpperCase();
      return `TA-${chunk()}-${chunk()}`;
    };

    const loadResumeCode = () => {
      if (!storageAvailable) return generateResumeCode();
      const stored = window.localStorage.getItem(RESUME_KEY);
      return stored || generateResumeCode();
    };

    const saveResumeCode = (code) => {
      if (!storageAvailable) return;
      window.localStorage.setItem(RESUME_KEY, code);
    };

    let currentCode = loadResumeCode();
    if (resumeCode) resumeCode.textContent = currentCode;
    if (storageAvailable) {
      saveResumeCode(currentCode);
    } else {
      updateResumeStatus("Resume codes aren’t saved on this device.");
    }

    resumeCopy?.addEventListener("click", async () => {
      if (!navigator.clipboard || !navigator.clipboard.writeText) {
        updateResumeStatus("Clipboard copy isn’t available. Copy manually.");
        return;
      }
      try {
        await navigator.clipboard.writeText(currentCode);
        updateResumeStatus("Resume code copied.");
      } catch (error) {
        updateResumeStatus("Copy failed. Please copy manually.");
      }
    });

    resumeReset?.addEventListener("click", () => {
      currentCode = generateResumeCode();
      if (resumeCode) resumeCode.textContent = currentCode;
      saveResumeCode(currentCode);
      updateResumeStatus("New resume code generated.");
    });
  }

  if (!storageAvailable) {
    setStatus("Notes won’t be saved on this device. You can still use the tracker.");
  }

  loadEntries();
  syncEmptyState();
})();
