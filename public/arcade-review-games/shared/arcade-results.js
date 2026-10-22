(() => {
  'use strict';
  const arcade = '/arcade-review-games/';
  const difficulties = ['Easy', 'Medium', 'Hard'];
  const teamModes = ['Timed', 'Target', 'Domination'].flatMap(mode => ['Standard', 'Challenge', 'Mixed'].map(level => `${mode} · ${level}`));
  const games = [
    {id:'territory', title:'Territory Takedown — Scientific Method', route:'territory-takedown/', kind:'territory', screen:'#winnerView', replay:'#rematchBtn', modes:teamModes},
    {id:'survey', title:'Survey Showdown', route:'survey-showdown/', kind:'survey', screen:'#winner', replay:'#rematch', modes:['Classroom review', 'Survey']},
    {id:'revolution', title:'Territory Takedown — French Revolution', route:'territory-takedown/french-revolution/', kind:'territory', screen:'#winnerView', replay:'#rematchBtn', modes:teamModes},
    {id:'trench', title:'WWI Trench Run', route:'social-studies/wwi-trench-run.html', kind:'platform', modes:difficulties},
    {id:'pyramid', title:'Pyramid Escape Run', route:'social-studies/pyramid-escape-run.html', kind:'platform', modes:difficulties},
    {id:'cold-war', title:'Cold War Shadow Run', route:'social-studies/cold-war-shadow-run/game.html', kind:'cold-war', screen:'#finishModal', replay:'#resetRun', modes:['Mission']},
    {id:'constitution', title:'Constitution Courthouse Run', route:'social-studies/constitution-courthouse-run.html', kind:'adventure', modes:difficulties},
    {id:'volcano', title:'Volcano Ascent', route:'science/volcano-ascent/', kind:'platform', modes:difficulties},
    {id:'moon', title:'Moon Mission Run', route:'science/moon-mission-run.html', kind:'platform', modes:difficulties},
    {id:'cells', title:'Concept Stack: Cells', route:'science/concept-stack-cells/', kind:'cells', screen:'#gameover-modal', replay:'#replay-button', modes:['Middle School','High School'].flatMap(tier => ['Slow','Normal','Fast'].flatMap(speed => ['Off','On'].map(mis => `${tier} · ${speed} · Misconceptions ${mis}`)))},
    {id:'maze', title:'Scientific Method Maze', route:'science/scientific-method.html', kind:'maze', screen:'#endLayer', replay:'#playAgain', modes:difficulties},
    {id:'algebra', title:'Algebra City Run', route:'math/algebra-city-run.html', kind:'platform', modes:difficulties},
    {id:'slope', title:'Slope Street Sprint', route:'math/slope-street-sprint.html', kind:'platform', modes:difficulties},
    {id:'racer', title:'Math Track Racer', route:'math/math-track-racer.html', kind:'racer', screen:'#overlay', replay:'#btnStart', modes:['Mixed','Addition','Subtraction','Multiplication','Division'].flatMap(mode => ['Primary','Elementary','Upper Elementary','Middle'].map(level => `${mode} · ${level}`))},
    {id:'rush', title:'Math Rush Genesis — Addition', route:'math/math-rush-genesis-addition.html', kind:'rush', screen:'#end-overlay', replay:'#restart-btn', modes:['Addition']},
    {id:'grammar', title:'Grammar Gauntlet', route:'ela/grammar-gauntlet.html', kind:'grammar', screen:'#endOverlay', replay:'#replayBtn', modes:['Grammar review']},
    {id:'rifts', title:'Undertext Rifts — Mood & Tone', route:'ela/undertext-rifts-mood-tone.html', kind:'rifts', screen:'#endOverlay', replay:'#playAgainButton', modes:['Hallway run']}
  ].map(game => ({...game, route:arcade + game.route, ...(game.kind==='platform' ? {screen:'#results-modal', replay:'#replay'} : {})}));

  const text = value => String(value ?? '').replace(/\s+/g, ' ').trim();
  const $ = selector => document.querySelector(selector);
  const value = selector => text($(selector)?.textContent);
  const selected = selector => text($(selector)?.selectedOptions?.[0]?.textContent);
  const metric = (label, result) => ({label, value:text(result) || '—'});
  const titleCase = word => text(word).replace(/\b\w/g, char => char.toUpperCase());
  const style = document.createElement('style');
  style.textContent = `
    .ta-results-dialog{padding:0;border:1px solid #344563;border-radius:22px;width:min(780px,calc(100vw - 28px));max-width:none;max-height:calc(100dvh - 28px);background:#101d32;color:#f4f7ff;box-shadow:0 24px 100px #0009;overflow:hidden}
    .ta-results-dialog::backdrop{background:rgba(3,9,19,.92)}
    .ta-results-card,.ta-results-card *{box-sizing:border-box}
    .ta-results-card{font:16px/1.5 system-ui,sans-serif;text-align:left;color:#f4f7ff;background:linear-gradient(140deg,#162b48,#0d182a 70%);border:1px solid #344563;border-radius:20px;overflow:hidden;max-height:calc(100dvh - 32px);display:flex;flex-direction:column;width:100%;margin:0}
    .ta-results-dialog>.ta-results-card{border:0;border-radius:0}
    .ta-results-body{padding:clamp(20px,4vw,32px);overflow:auto;min-height:0;overscroll-behavior:contain}
    .ta-results-card .ta-results-kicker{font-size:11px;font-weight:800;letter-spacing:.15em;color:#63e4e5;margin:0 0 8px;text-transform:uppercase}
    .ta-results-card .ta-results-game{font-size:15px;font-weight:600;color:#c5d2e9;margin:0 0 8px}
    .ta-results-card h2{font:800 clamp(24px,4vw,36px)/1.15 system-ui,sans-serif;color:#fff;margin:0 0 12px;letter-spacing:-.025em}
    .ta-results-card .ta-results-mode{display:inline-block;font-size:12px;font-weight:700;color:#e1eafe;background:#223653;border:1px solid #3b5271;border-radius:100px;padding:5px 10px;margin:0 0 20px}
    .ta-results-card h3{font:700 14px/1.5 system-ui,sans-serif;color:#c5d2e9;margin:0 0 10px}
    .ta-results-metrics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:0}
    .ta-results-metric{background:#0a1628;border:1px solid #2d405d;border-radius:12px;padding:14px;min-width:0}
    .ta-results-metric dt{color:#a9bedb;font-size:12px;margin:0 0 6px}
    .ta-results-metric dd{font-size:clamp(18px,3vw,25px);font-weight:800;color:#fff;margin:0;overflow-wrap:anywhere}
    .ta-results-detail{margin-top:20px;border-top:1px solid #344563;padding-top:16px}
    .ta-results-detail p{font-size:14px;color:#c5d2e9;margin:7px 0;overflow-wrap:anywhere}
    .ta-results-actions{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;padding:16px clamp(20px,4vw,32px);border-top:1px solid #344563;background:#0b1628;flex-shrink:0}
    .ta-results-actions button,.ta-results-actions a{display:flex;align-items:center;justify-content:center;min-height:48px;margin:0;padding:10px 12px;border-radius:10px;border:1px solid #4b607e;text-decoration:none;text-align:center;font:750 14px/1.25 system-ui,sans-serif;cursor:pointer;background:#1b2a41;color:#fff;letter-spacing:0}
    .ta-results-actions .ta-results-download{background:#ffcd4b;color:#182234;border-color:#ffcd4b}
    .ta-results-actions .ta-results-replay{background:#64e1e4;color:#082c38;border-color:#64e1e4}
    .ta-results-actions button:hover,.ta-results-actions a:hover{filter:brightness(1.1)}
    .ta-results-actions button:focus-visible,.ta-results-actions a:focus-visible{outline:3px solid #fff;outline-offset:3px}
    @media(max-width:520px){.ta-results-actions{grid-template-columns:1fr;gap:7px;padding:12px 20px}.ta-results-actions button,.ta-results-actions a{min-height:44px}.ta-results-metric{padding:11px}.ta-results-body{padding:20px}}
    @media(max-height:500px) and (min-width:521px){.ta-results-body{padding:16px 24px}.ta-results-metrics{grid-template-columns:repeat(3,minmax(0,1fr))}.ta-results-mode{margin-bottom:10px!important}}
  `;
  document.head.append(style);

  function element(tag, className, content) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (content != null) node.textContent = content;
    return node;
  }
  function reportText(result) {
    return [result.game, 'Teach Arcade · Arcade Review Results', `Completed: ${result.completedAt || new Date().toLocaleString()}`,
      result.sample ? 'SAMPLE RESULTS — demonstration data' : '', `Outcome: ${result.outcome}`, `Mode: ${result.mode || 'Standard'}`, '', 'Performance',
      ...result.metrics.map(item => `${item.label}: ${item.value}`), ...(result.details?.length ? ['', 'Review details', ...result.details] : []), ...(result.reportLines?.length ? ['', ...result.reportLines] : [])].join('\n') + '\n';
  }
  function download(result) {
    const url = URL.createObjectURL(new Blob([reportText(result)], {type:'text/plain;charset=utf-8'}));
    const link = element('a');
    link.href = url;
    link.download = (result.sample ? 'sample-' : '') + result.game.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/-$/,'') + '-results.txt';
    document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function render(result, playAgain) {
    // Freeze this run's values, so replay and later DOM changes cannot alter its report.
    const snapshot = JSON.parse(JSON.stringify({...result, completedAt:result.completedAt || new Date().toLocaleString()}));
    const card = element('section', 'ta-results-card');
    const body = element('div', 'ta-results-body');
    body.append(element('p','ta-results-kicker', snapshot.sample ? 'Sample game results' : 'Game results'), element('p','ta-results-game',snapshot.game));
    const heading = element('h2','',snapshot.outcome || 'Game complete');
    heading.id = 'ta-results-title'; body.append(heading);
    body.append(element('p','ta-results-mode',snapshot.mode || 'Standard'), element('h3','','Performance'));
    const metrics = element('dl','ta-results-metrics');
    snapshot.metrics.forEach(item => { const group=element('div','ta-results-metric'); group.append(element('dt','',item.label),element('dd','',item.value)); metrics.append(group); });
    body.append(metrics);
    if (snapshot.details?.length) {
      const detail = element('div','ta-results-detail'); detail.append(element('h3','','Review details'));
      snapshot.details.forEach(line => detail.append(element('p','',line))); body.append(detail);
    }
    const actions = element('div','ta-results-actions'); actions.setAttribute('aria-label','Results actions');
    const save = element('button','ta-results-download','Download results'); save.type='button'; save.addEventListener('click',() => download(snapshot));
    const replay = element('button','ta-results-replay','Play Again'); replay.type='button'; replay.addEventListener('click',playAgain);
    const back = element('a','','Return to Arcade'); back.href=arcade;
    actions.append(save,replay,back); card.append(body,actions); return card;
  }
  let dialog = null;
  function show(result, playAgain) {
    if (dialog) { dialog.close(); dialog.remove(); }
    dialog = element('dialog','ta-results-dialog');
    dialog.setAttribute('aria-labelledby','ta-results-title');
    dialog.addEventListener('cancel',event => event.preventDefault());
    dialog.addEventListener('keydown',event => event.stopPropagation());
    dialog.append(render(result,() => { const old=dialog; dialog=null; old.close(); old.remove(); playAgain(); }));
    (document.fullscreenElement || document.body).append(dialog);
    dialog.showModal();
    dialog.querySelector('button').focus();
  }
  function settings(game) {
    if (game.kind==='platform') return titleCase(window.TA_ACTIVE_GAME?.difficulty || 'Easy');
    if (game.kind==='territory') return `${titleCase($('[name=mode]:checked')?.value || 'timed')} · ${selected('#difficulty')}`;
    if (game.kind==='survey') return $('#reviewMode')?.checked ? 'Classroom review' : 'Survey';
    if (game.kind==='cells') return `${selected('#tier-select')} · ${selected('#speed-select')} · Misconceptions ${$('#misconception-toggle')?.checked ? 'On' : 'Off'}`;
    if (game.kind==='racer') return `${selected('#modeSelect')} · ${selected('#difficultySelect')}`;
    if (game.kind==='maze') return selected('#difficulty');
    return game.modes[0];
  }
  function read(game, screen) {
    let outcome='Game complete', metrics=[], details=[];
    const data=window.TA_ARCADE_PERFORMANCE || {};
    if (game.kind==='platform') {
      outcome=value('#results-title');
      metrics=[...screen.querySelectorAll('.result-card')].map(card => metric(text(card.querySelector('span')?.textContent),text(card.querySelector('b')?.textContent)));
    } else if (game.kind==='territory') {
      outcome=value('#winnerTitle'); details=[value('#winnerReason')];
      metrics=[...screen.querySelectorAll('#finalScores > span')].map(row => { const [label,...rest]=text(row.textContent).split(':'); return metric(label,rest.join(':')); });
    } else if (game.kind==='survey') {
      outcome=value('#winnerTitle'); details=[value('#winnerText')];
      metrics=[...screen.querySelectorAll('#finalScores > div')].map(row => metric([...row.childNodes].filter(node => node.nodeType===3).map(node => node.textContent).join(''),text(row.querySelector('strong')?.textContent)+' points'));
    } else if (game.kind==='cold-war') {
      outcome=value('#finishTitle'); details=[value('#finishText')];
      metrics=[metric('Stability',data.stability),metric('Correct answers',`${data.correct ?? 0} / ${data.answered ?? 0}`),metric('Accuracy',data.answered ? Math.round(data.correct/data.answered*100)+'%' : 'No questions answered'),metric('Time',`${data.elapsed ?? 0} sec`)];
    } else if (game.kind==='cells') {
      outcome='Stack complete';
      const match=value('#gameover-summary').match(/score (\d+)\. Accuracy (\d+)% with (\d+)\/(\d+)/i);
      metrics=match ? [metric('Score',match[1]),metric('Accuracy',match[2]+'%'),metric('Correct answers',`${match[3]} / ${match[4]}`)] : [metric('Summary',value('#gameover-summary'))];
      details=[...screen.querySelectorAll('#category-summary li')].map(row => text(row.textContent));
      const missed=[...screen.querySelectorAll('#missed-list li')].map(row => text(row.textContent));
      if (missed.length) details.push('Prompts to revisit:',...missed);
    } else if (game.kind==='maze') {
      outcome=value('#endTitle'); details=[value('#endText')];
      metrics=[metric('Score',data.score),metric('Accuracy',data.answered ? Math.round(data.correct/data.answered*100)+'%' : 'No questions answered'),metric('Correct answers',`${data.correct ?? 0} / ${data.answered ?? 0}`),metric('Stations completed',`${data.stations ?? 0} / 5`),metric('Evidence collected',`${data.evidence ?? 0} / ${data.evidenceTotal ?? 0}`),metric('Time',`${data.elapsed ?? 0} sec`)];
    } else if (game.kind==='racer') {
      outcome='Race complete';
      metrics=[metric('Score',data.score),metric('Accuracy',data.answered ? Math.round(data.correct/data.answered*100)+'%' : 'No answers'),metric('Correct answers',`${data.correct ?? 0} / ${data.answered ?? 0}`),metric('Best streak',data.bestStreak ?? 0),metric('Missed questions',data.missed ?? 0),metric('Time','60 sec')];
    } else if (game.kind==='rush') {
      outcome='Run complete'; details=[value('#summary-main')];
      metrics=[metric('Score',value('#sum-score')),metric('Accuracy',value('#sum-acc')),metric('Best streak',value('#sum-streak')),metric('Time',value('#sum-time'))];
    } else if (game.kind==='grammar') {
      outcome='Gauntlet complete';
      const match=value('#endSummary').match(/Score: (.*?) points \| Accuracy: (.*?) \((.*?)\)/);
      metrics=match ? [metric('Score',match[1]),metric('Correct on first try',match[2]),metric('Accuracy',match[3])] : [metric('Summary',value('#endSummary'))];
    } else if (game.kind==='rifts') {
      outcome='Hallway run complete'; details=[value('#finalRank')];
      metrics=[metric('Score',value('#finalScore')),metric('Questions answered',`${value('#finalQuestions')} / 15`),metric('Time',value('#finalTime')+' sec')];
    }
    return {game:game.title,outcome,mode:settings(game),metrics,details:details.filter(Boolean)};
  }
  function visible(screen) {
    if (!screen || screen.hidden || screen.getAttribute('aria-hidden')==='true') return false;
    const css=getComputedStyle(screen);
    return css.display!=='none' && css.visibility!=='hidden' && Number(css.opacity)>0 && screen.getClientRects().length>0;
  }
  const route=location.pathname.replace(/\/index\.html$/,'/');
  const game=games.find(item => item.route===route);
  if (game?.screen) {
    let armed=true, scheduled=false;
    function check() {
      scheduled=false;
      const source=$(game.screen);
      const ended=visible(source) && (game.kind!=='racer' || value('#overlayTitle')==='Time!');
      if (!ended) { armed=true; return; }
      if (!armed) return;
      armed=false;
      const replay=game.replay ? $(game.replay) : null;
      show(read(game,source),() => replay ? replay.click() : location.reload());
    }
    const observer=new MutationObserver(records => {
      if (scheduled || records.every(record => record.target.closest?.('.ta-results-dialog'))) return;
      scheduled=true; setTimeout(check,0);
    });
    observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['hidden','style','class','aria-hidden']});
    check();
  }
  window.TAArcadeResults={games,read,render,show,reportText,download};
})();
