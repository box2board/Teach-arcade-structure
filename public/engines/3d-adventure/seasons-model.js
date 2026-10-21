// Qualitative model at midlatitudes, not a temperature or weather forecast.
export function modelOutcome({ month, tilt, axis }) {
  if (!['june', 'december'].includes(month) || !['none', 'tilted'].includes(tilt) || !['fixed', 'tracks'].includes(axis)) return null;
  if (tilt === 'none') return { hemisphere: 'neither', daylight: 'Similar daylight in both tests', angle: 'No seasonal change in sunlight angle' };
  const northern = axis === 'tracks' || month === 'june';
  return { hemisphere: northern ? 'north' : 'south', daylight: northern ? 'Longer northern days' : 'Shorter northern days', angle: northern ? 'More direct northern sunlight' : 'Less direct northern sunlight' };
}

export function testSeasonModel(settings, prediction) {
  const outcome = modelOutcome(settings);
  const expected = settings.month === 'june' ? 'north' : 'south';
  return { outcome, matchesRecord: outcome?.hemisphere === expected, predictionMatches: prediction === outcome?.hemisphere };
}

export function mountSeasonsModel({ container, heading, questionText, feedback, onComplete }) {
  heading.textContent = 'Repair and test the season model';
  questionText.textContent = 'Keep one model for both observations: June has northern summer; December has southern summer. Choose the tilt and axis behavior, predict each month, then run both tests.';
  const oldEvidence = document.getElementById('ta3dQuestionEvidence');
  if (oldEvidence) oldEvidence.hidden = true;
  container.innerHTML = '';
  const form = document.createElement('div');
  form.className = 'seasons-model';
  const controls = {};
  const select = (name, label, values) => {
    const wrapper = document.createElement('label');
    wrapper.textContent = label;
    const input = document.createElement('select');
    input.id = `season-${name}`;
    input.setAttribute('aria-label', label);
    for (const [value, text] of values) {
      const option = document.createElement('option'); option.value = value; option.textContent = text; input.appendChild(option);
    }
    input.value = values[0][0];
    controls[name] = input; wrapper.appendChild(input); form.appendChild(wrapper);
    return input;
  };
  select('tilt', 'Earth’s axial tilt', [['none','No tilt'],['tilted','About 23.5°']]);
  select('axis', 'Axis behavior during the orbit', [['tracks','North axis turns to face the Sun'],['fixed','Axis keeps the same direction in space']]);
  select('month', 'Observation to test', [['june','June'],['december','December']]);
  select('prediction', 'Predict which midlatitudes have summer', [['','Choose your prediction'],['north','Northern'],['south','Southern'],['neither','Neither has a summer pattern']]);
  const diagram = document.createElement('div'); diagram.className = 'season-diagram'; form.appendChild(diagram);
  const status = document.createElement('p'); status.setAttribute('role','status'); form.appendChild(status);
  const run = document.createElement('button'); run.id = 'season-run'; run.type = 'button'; run.textContent = 'Run forecast test'; form.appendChild(run);
  const apply = document.createElement('button'); apply.id = 'season-apply'; apply.type = 'button'; apply.textContent = 'Apply verified model'; apply.disabled = true; form.appendChild(apply);
  container.appendChild(form);
  let passed = new Set(), completed = false;
  const settings = () => ({ month: controls.month.value, tilt: controls.tilt.value, axis: controls.axis.value });
  const render = () => {
    const s = settings(), june = s.month === 'june', x = june ? 430 : 110;
    const dx = s.tilt === 'none' ? 0 : (s.axis === 'tracks' && !june ? 20 : -20);
    diagram.innerHTML = `<svg viewBox="0 0 540 175" role="img" aria-label="${june ? 'June' : 'December'} model. Sun in the center; the white line shows Earth’s axis, with north at its upper end."><ellipse cx="270" cy="85" rx="160" ry="57" fill="none" stroke="#8395b5" stroke-dasharray="5 6"/><circle cx="270" cy="85" r="25" fill="#ffd36b"/><text x="270" y="130" text-anchor="middle" fill="currentColor">Sun</text><line x1="${june ? 300 : 240}" y1="85" x2="${june ? x-32 : x+32}" y2="85" stroke="#ffd36b" stroke-width="4"/><circle cx="${x}" cy="85" r="25" fill="#368ac5"/><line x1="${x-dx}" y1="125" x2="${x+dx}" y2="45" stroke="white" stroke-width="3"/><text x="${x+dx}" y="31" fill="currentColor" text-anchor="middle">N</text><text x="${x}" y="155" fill="currentColor" text-anchor="middle">${june ? 'June' : 'December'} Earth</text></svg>`;
    status.textContent = `Records matched: ${passed.has('june') ? 'June ✓' : 'June —'} · ${passed.has('december') ? 'December ✓' : 'December —'}`;
    apply.disabled = passed.size !== 2 || completed;
  };
  for (const name of ['tilt','axis']) controls[name].addEventListener('change', () => { passed.clear(); controls.prediction.value=''; feedback.textContent='Model changed. Retest both observations.'; render(); });
  controls.month.addEventListener('change', () => { controls.prediction.value=''; feedback.textContent='Predict this observation before running the test.'; render(); });
  run.addEventListener('click', () => {
    if (completed) return;
    if (!controls.prediction.value) { feedback.textContent='Choose your prediction first.'; return; }
    const result = testSeasonModel(settings(), controls.prediction.value);
    feedback.textContent = `${result.outcome.daylight}; ${result.outcome.angle.toLowerCase()}. `;
    if (!result.matchesRecord) { passed.delete(controls.month.value); feedback.textContent += 'This model disagrees with the observation. Revise the model and retest both months.'; }
    else if (!result.predictionMatches) { feedback.textContent += 'The model matches the record, but your prediction differs. Compare the result and revise your prediction.'; }
    else { passed.add(controls.month.value); feedback.textContent += 'Your prediction and this observation agree.'; }
    render();
  });
  apply.addEventListener('click', () => { if (passed.size !== 2 || completed) return; completed = true; apply.disabled = true; onComplete(); });
  render();
}
