(() => {
 const TA=window.TASideScroller=window.TASideScroller||{};
 TA.showQuestion=(q,done)=>{const modal=document.getElementById('question-modal'),text=document.getElementById('question-text'),choices=document.getElementById('question-choices');text.textContent=q.text;choices.innerHTML='';q.choices.forEach((choice,i)=>{const b=document.createElement('button');b.textContent=choice;b.onclick=()=>{modal.hidden=true;done(i===q.correctIndex)};choices.appendChild(b)});modal.hidden=false;};
})();