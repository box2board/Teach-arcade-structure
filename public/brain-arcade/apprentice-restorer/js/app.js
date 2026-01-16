import {
  gamePillars,
  coreSystems,
  regions,
  notebookTemplate,
  npcLines,
  classroomModes
} from "./game-data.js";

const renderList = (items, renderItem) => items.map(renderItem).join("");

const pillarsTarget = document.querySelector("[data-pillars]");
const systemsTarget = document.querySelector("[data-systems]");
const regionsTarget = document.querySelector("[data-regions]");
const notebookTarget = document.querySelector("[data-notebook]");
const npcTarget = document.querySelector("[data-npc]");
const classroomTarget = document.querySelector("[data-classroom]");
const classroomNotice = document.querySelector("[data-classroom-note]");

if (pillarsTarget) {
  pillarsTarget.innerHTML = renderList(gamePillars, (pillar) => {
    return `
      <div class="card">
        <h3>${pillar.title}</h3>
        <p>${pillar.detail}</p>
      </div>
    `;
  });
}

if (systemsTarget) {
  systemsTarget.innerHTML = renderList(coreSystems, (system) => {
    return `
      <div class="card">
        <h3>${system.title}</h3>
        <ul>
          ${system.points.map((point) => `<li>${point}</li>`).join("")}
        </ul>
      </div>
    `;
  });
}

if (regionsTarget) {
  regionsTarget.innerHTML = renderList(regions, (region) => {
    return `
      <article class="card">
        <h3>${region.name}</h3>
        <p><strong>Theme:</strong> ${region.theme}</p>
        <p><strong>Concepts:</strong> ${region.concepts.join(", ")}</p>
        <p><strong>Tools:</strong> ${region.tools.join(", ")}</p>
        <p><strong>Encounter:</strong> ${region.enemy}</p>
        <p><strong>Experience loop:</strong></p>
        <ul>
          ${region.experiences.map((item) => `<li>${item}</li>`).join("")}
        </ul>
        <p><strong>Reflection:</strong> ${region.reflection}</p>
      </article>
    `;
  });
}

if (notebookTarget) {
  notebookTarget.innerHTML = renderList(notebookTemplate, (section) => {
    return `
      <div class="card">
        <h3>${section.section}</h3>
        <ul>
          ${section.entries.map((entry) => `<li>${entry}</li>`).join("")}
        </ul>
      </div>
    `;
  });
}

if (npcTarget) {
  npcTarget.innerHTML = renderList(npcLines, (line) => {
    return `<span>${line}</span>`;
  });
}

if (classroomTarget) {
  classroomTarget.innerHTML = renderList(classroomModes, (mode, index) => {
    const id = `mode-${mode.title.toLowerCase()}`;
    return `
      <div class="toggle">
        <label for="${id}">
          <input type="radio" name="classroom-mode" id="${id}" value="${mode.title}"
            ${index === 1 ? "checked" : ""}>
          ${mode.title}
        </label>
        <small>${mode.description}</small>
      </div>
    `;
  });
}

const updateClassroomNotice = (mode) => {
  if (!classroomNotice) return;
  classroomNotice.textContent = `Classroom Mode: ${mode} — students see the same UI, but hints and vocabulary timing shift in the background.`;
};

const modeInputs = document.querySelectorAll("input[name='classroom-mode']");
modeInputs.forEach((input) => {
  input.addEventListener("change", (event) => {
    updateClassroomNotice(event.target.value);
  });
});

updateClassroomNotice("Standard");
