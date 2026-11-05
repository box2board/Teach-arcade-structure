(() => {
  'use strict';

  const registry = new Map();
  window.ESCAPE_V2_PUZZLES = {
    register(type, render) {
      if (typeof type !== 'string' || !type.trim() || typeof render !== 'function') {
        throw new TypeError('Puzzle registration requires a type name and render function.');
      }
      registry.set(type, render);
    },
    get(type) {
      return registry.get(type);
    }
  };

  registry.set('choice', (puzzle, context) => {
    const list = document.createElement('div');
    list.className = 'choice-list';
    (puzzle.choices || []).forEach((choice, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'choice-btn';
      button.textContent = choice;
      button.addEventListener('click', () => {
        context.onAttempt();
        if (index === puzzle.answer) context.onCorrect();
        else context.setFeedback('That does not fit the evidence. Try again.', false);
      });
      list.appendChild(button);
    });
    context.container.appendChild(list);
  });

  registry.set('text', (puzzle, context) => {
    const form = document.createElement('form');
    form.className = 'answer-form';
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = puzzle.placeholder || 'Enter your answer';
    input.autocomplete = 'off';
    input.spellcheck = false;
    input.setAttribute('aria-label', puzzle.placeholder || 'Answer');
    const submit = document.createElement('button');
    submit.type = 'submit';
    submit.className = 'primary-btn';
    submit.textContent = 'Submit';
    form.append(input, submit);
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      context.onAttempt();
      if (context.matchesAnswer(input.value, puzzle.answer)) context.onCorrect();
      else context.setFeedback('That does not unlock it. Recheck the clue and try again.', false);
    });
    context.container.appendChild(form);
    requestAnimationFrame(() => input.focus());
  });
})();
