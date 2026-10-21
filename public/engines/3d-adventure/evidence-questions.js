export function answerChoices(question, random = Math.random) {
  const choices = (question.answers || []).map((text, sourceIndex) => ({ text, sourceIndex }));
  if (question.shuffleAnswers) {
    for (let i = choices.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [choices[i], choices[j]] = [choices[j], choices[i]];
    }
  }
  return choices;
}

export function renderEvidence(question, questionText) {
  let evidence = document.getElementById('ta3dQuestionEvidence');
  if (!evidence) {
    evidence = document.createElement('p');
    evidence.id = 'ta3dQuestionEvidence';
    evidence.className = 'question-evidence';
    questionText.before(evidence);
  }
  evidence.textContent = question.evidence || '';
  evidence.hidden = !question.evidence;
  return evidence;
}

export function retryControl(answerList, onRetry) {
  let button = document.getElementById('ta3dEvidenceRetry');
  if (!button) {
    button = document.createElement('button');
    button.id = 'ta3dEvidenceRetry';
    button.type = 'button';
    button.className = 'secondary';
    button.textContent = 'Recheck evidence and try again';
    answerList.before(button);
  }
  button.textContent = 'Recheck evidence and try again';
  // Replace the handler when exterior/interior share the same dialog.
  button.onclick = onRetry;
  button.hidden = true;
  return button;
}

// Used only to reconstruct an already-earned checkpoint after reloading.
export function earnedAnswerButton(container, question) {
  const answer = question?.answers?.[question.correct];
  if (answer === undefined) return null;
  return [...(container?.children || [])].find(button => button.textContent.replace(/^\d+\.\s/, '') === answer) || null;
}
