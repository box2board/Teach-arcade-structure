(() => {
  'use strict';

  const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
  const nonEmpty = (value) => typeof value === 'string' && value.trim().length > 0;

  function validatePuzzle(puzzle, path, errors) {
    if (!isRecord(puzzle)) {
      errors.push(`${path} must be an object.`);
      return;
    }
    if (!nonEmpty(puzzle.type)) errors.push(`${path}.type is required.`);
    if (!nonEmpty(puzzle.prompt)) errors.push(`${path}.prompt is required.`);

    // Validate the engine's built-in types. Other types remain valid so a room
    // pack can add a renderer without changing this shared data contract.
    if (puzzle.type === 'choice') {
      if (!Array.isArray(puzzle.choices) || puzzle.choices.length < 2) {
        errors.push(`${path}.choices must contain at least two options.`);
      } else if (!puzzle.choices.every(nonEmpty)) {
        errors.push(`${path}.choices must contain non-empty text options.`);
      }
      if (!Number.isInteger(puzzle.answer) || puzzle.answer < 0 || puzzle.answer >= (puzzle.choices || []).length) {
        errors.push(`${path}.answer must be a valid choice index.`);
      }
    } else if (puzzle.type === 'text') {
      const accepted = Array.isArray(puzzle.answer) ? puzzle.answer : [puzzle.answer];
      if (!accepted.length || !accepted.every(nonEmpty)) {
        errors.push(`${path}.answer must contain at least one accepted text response.`);
      }
    }
  }

  function validatePack(pack) {
    const errors = [];
    if (!isRecord(pack)) return ['Room pack must be an object.'];
    if (!nonEmpty(pack.id)) errors.push('pack.id is required.');
    if (!nonEmpty(pack.title)) errors.push('pack.title is required.');
    if (!Array.isArray(pack.rooms) || pack.rooms.length === 0) {
      errors.push('pack.rooms must contain at least one room.');
      return errors;
    }

    const roomIds = new Set();
    for (const [roomIndex, room] of pack.rooms.entries()) {
      const path = `rooms[${roomIndex}]`;
      if (!isRecord(room)) {
        errors.push(`${path} must be an object.`);
        continue;
      }
      if (!nonEmpty(room.id)) errors.push(`${path}.id is required.`);
      else if (roomIds.has(room.id)) errors.push(`${path}.id duplicates "${room.id}".`);
      else roomIds.add(room.id);
      if (!nonEmpty(room.title)) errors.push(`${path}.title is required.`);

      const scene = room.scene;
      if (!isRecord(scene)) errors.push(`${path}.scene is required.`);
      else {
        if (!Array.isArray(scene.dimensions) || scene.dimensions.length !== 3 ||
            !scene.dimensions.every((number) => Number.isFinite(number) && number > 0)) {
          errors.push(`${path}.scene.dimensions must be three positive numbers.`);
        }
        if (!Array.isArray(scene.interactables)) errors.push(`${path}.scene.interactables must be an array.`);
      }

      if (!Array.isArray(room.hotspots) || room.hotspots.length === 0) {
        errors.push(`${path}.hotspots must contain at least one clue.`);
        continue;
      }
      const clueIds = new Set();
      for (const [clueIndex, clue] of room.hotspots.entries()) {
        const cluePath = `${path}.hotspots[${clueIndex}]`;
        if (!isRecord(clue)) {
          errors.push(`${cluePath} must be an object.`);
          continue;
        }
        if (!nonEmpty(clue.id)) errors.push(`${cluePath}.id is required.`);
        else if (clueIds.has(clue.id)) errors.push(`${cluePath}.id duplicates "${clue.id}".`);
        else clueIds.add(clue.id);
        for (const field of ['title', 'prompt', 'clue']) {
          if (!nonEmpty(clue[field])) errors.push(`${cluePath}.${field} is required.`);
        }
        validatePuzzle(clue, cluePath, errors);
      }

      if (isRecord(scene) && Array.isArray(scene.interactables)) {
        const targetIds = new Set();
        for (const [targetIndex, target] of scene.interactables.entries()) {
          const targetPath = `${path}.scene.interactables[${targetIndex}]`;
          if (!isRecord(target) || !nonEmpty(target.id)) {
            errors.push(`${targetPath}.id is required.`);
            continue;
          }
          if (targetIds.has(target.id)) errors.push(`${targetPath}.id duplicates "${target.id}".`);
          targetIds.add(target.id);
          if (!Array.isArray(target.position) || target.position.length !== 3 || !target.position.every(Number.isFinite)) {
            errors.push(`${targetPath}.position must be three finite numbers.`);
          }
        }
        for (const clueId of clueIds) {
          if (!targetIds.has(clueId)) errors.push(`${path} clue "${clueId}" has no matching scene interactable.`);
        }
        for (const targetId of targetIds) {
          if (!clueIds.has(targetId)) errors.push(`${path} interactable "${targetId}" has no matching clue.`);
        }
      }

      validatePuzzle(room.solution, `${path}.solution`, errors);
    }
    return errors;
  }

  window.ESCAPE_V2_VALIDATE_PACK = validatePack;
})();
