// One coherent academic mission, layered over the existing world/art package.
const base = window.TA3DAdventureConfig;
const question = (title, evidence, text, answers, correct, explanation) => Object.freeze({
  title, evidence, text, answers: Object.freeze(answers), correct,
  correctFeedback: explanation,
  wrongFeedback: `Recheck the evidence. ${explanation}`,
});
const observations = {
  solar: question('Station 1 · Compare the hemispheres',
    'OBSERVATION RECORD\nJune: Northern Hemisphere summer; Southern Hemisphere winter.\nDecember: Northern Hemisphere winter; Southern Hemisphere summer.\nBoth hemispheres are on the same Earth, at essentially the same distance from the Sun.',
    'Which claim does this evidence challenge?',
    ['Seasons reverse between the hemispheres.', 'Summer happens mainly because the whole Earth is closer to the Sun.', 'Earth orbits the Sun.', 'A model of seasons must explain both hemispheres.'], 1,
    'A change in the whole Earth’s distance cannot explain opposite seasons at the same time.'),
  lunar: question('Station 2 · Compare daylight duration',
    'SIMPLIFIED MODEL · Same Northern Hemisphere location\nJune: about 15 hours of daylight.\nDecember: about 9 hours of daylight.\nCompare duration only; cloud cover and sunlight angle are held aside in this model.',
    'What does the June record show about the daily opportunity to receive sunlight?',
    ['There are 6 more hours of daylight than in December.', 'Sunlight must be twice as intense every hour.', 'There are 6 fewer hours of daylight.', 'The Sun produces more energy in June.'], 0,
    '15 − 9 = 6 additional daylight hours. Duration alone does not measure hourly intensity.'),
  stellar: question('Station 3 · Test sunlight angle',
    'CONTROLLED LIGHT MODEL\nThe same amount of light falls on a surface.\nMore direct beam: light covers 100 square units.\nSlanted beam: that light spreads across 200 square units.',
    'How does the energy received per square unit compare?',
    ['The slanted beam provides twice as much.', 'Both surfaces receive the same energy per square unit.', 'The slanted beam provides half as much.', 'The surface area cannot affect the energy per square unit.'], 2,
    'The same energy spread across twice the area provides half as much energy per square unit.'),
};
const objective = (title, detail) => Object.freeze({title, detail});
window.TA3DAdventureConfig = Object.freeze({
  ...base,
  version: '1.3-seasons-investigation',
  // Old mission checkpoints must not skip newly required evidence tasks.
  storageNamespace: 'teachArcade3D.silentObservatory.seasons.v1',
  migrateLegacyCheckpoint: false,
  // Restore to the investigation entrance; do not auto-answer evidence tasks.
  checkpoints: Object.freeze(['start','cell','terminal','entrance','facility']),
  learning: Object.freeze({
    goal: 'Explain seasons using Earth’s axial tilt, sunlight angle and daylight duration.',
    story: 'The observatory is forecasting summer for both hemispheres at once. Its distance-only model is wrong. Recover the prism to restart the research systems, investigate three evidence stations, and repair the forecast.',
  }),
  exterior: Object.freeze({
    ...base.exterior,
    objectives: Object.freeze({...base.exterior.objectives,
      start: objective('Repair the faulty season forecast.', 'The observatory predicts summer everywhere. Recover the glowing prism to restart its research systems.'),
      terminal: objective('Check the faulty forecast.', 'Bring the prism to the blue console and compare the hemispheres.'),
      entrance: objective('Investigate the evidence.', 'Enter the observatory. Read the research plan and complete its three stations.'),
    }),
  }),
  relayPuzzle: Object.freeze({
    ...base.relayPuzzle,
    panelLabel: 'RESEARCH PLAN',
    stations: Object.freeze(Object.fromEntries(Object.entries(base.relayPuzzle.stations).map(([id,s]) => [id,Object.freeze({
      ...s, label: {solar:'HEMISPHERES',lunar:'DAYLIGHT',stellar:'SUNLIGHT ANGLE'}[id], evidenceQuestion: observations[id],
    })]))),
    feedback: Object.freeze({reset:'RECHECK THE RESEARCH PLAN',progress:'EVIDENCE {current}/{total} INTERPRETED',complete:'EVIDENCE COMPLETE · Explanation console unlocked'}),
  }),
  mission: Object.freeze({
    ...base.mission,
    archiveConsole: Object.freeze({...base.mission.archiveConsole,label:'Build an explanation from the evidence',completeLabel:'Explanation supported'}),
    commandCore: Object.freeze({...base.mission.commandCore,label:'Test the repaired forecast',completeLabel:'Forecast verified'}),
    objectives: Object.freeze({
      ...base.mission.objectives,
      start: objective('Investigate why seasons differ.', 'Read the research plan. Interpret the evidence at each named station to activate it.'),
      relayProgress: objective('Continue the investigation.', 'Evidence recorded. Investigate {next} next.'),
      relayProgressUnguided: objective('Continue the investigation.', 'Use the research plan to choose the next evidence station.'),
      archive: objective('Explain the pattern.', 'Take the evidence to the violet console in the rear chamber.'),
      core: objective('Test your explanation.', 'Use the green forecast console to predict conditions in a new situation.'),
      stabilizing: objective('Updating the season forecast…', 'The observatory is applying the evidence-supported model.'),
      complete: objective('Forecast repaired!', 'Axial tilt changes sunlight angle and daylight duration, producing opposite seasons in the hemispheres.'),
    }),
    toasts: Object.freeze({...base.mission.toasts,start:'INVESTIGATION · Why can one hemisphere have summer while the other has winter?',archiveVerified:'EXPLANATION SUPPORTED · Test your prediction',complete:'FORECAST REPAIRED'}),
    completion: Object.freeze({eyebrow:'INVESTIGATION COMPLETE',heading:'You repaired the season forecast.',body:'You challenged the distance-only claim, compared daylight duration, tested sunlight angle, and applied an axial-tilt explanation to a new prediction. Earth’s tilt changes both the concentration and daily duration of sunlight in each hemisphere.'}),
  }),
  questions: Object.freeze({
    ...base.questions,
    exteriorTerminal: question('Find the forecast error',
      'FAULTY FORECAST: “Earth is nearer the Sun, so both hemispheres must have summer.”\nOBSERVATION: In June, the Northern Hemisphere has summer while the Southern Hemisphere has winter.',
      'What should the observatory investigate?',
      ['Why the Sun switches off over one hemisphere.', 'Whether both hemispheres always receive identical sunlight.', 'How sunlight conditions can differ between hemispheres on the same Earth.', 'Why Earth stops orbiting in December.'],2,
      'A useful explanation must account for different sunlight conditions and opposite seasons on the same planet.'),
    archive: question('Choose the explanation supported by the evidence',
      'YOUR EVIDENCE\n1. The hemispheres have opposite seasons at the same time.\n2. This northern location has longer daylight in June.\n3. More direct light concentrates energy on a smaller area.\nMODEL FACT: Earth’s axis is tilted about 23.5° and stays nearly parallel to itself through one orbit.',
      'Which explanation connects all three observations?',
      ['Earth’s tilt makes one hemisphere’s sunlight more direct and its days longer while the other has winter.', 'Earth’s distance makes the entire planet have summer together.', 'The Sun increases its total energy output only for the northern summer.', 'Earth’s axis reverses direction every six months.'],0,
      'Axial tilt produces changing sunlight angle and daylight duration as Earth orbits; the hemispheres experience opposite seasons.'),
    commandCore: question('Predict a new situation',
      'FORECAST TEST\nSix months after the northern June summer, Earth is on the opposite side of its orbit. Its axis still points in nearly the same direction in space.',
      'Which forecast follows from the axial-tilt explanation?',
      ['Both hemispheres now have summer.', 'The northern location has more direct sunlight and longer days than in June.', 'The Sun becomes colder for the whole planet.', 'The northern location has less direct sunlight and shorter days; southern midlatitudes have summer.'],3,
      'The Northern Hemisphere now tilts away from the Sun. Southern midlatitudes receive more direct sunlight and longer days.'),
  }),
});
