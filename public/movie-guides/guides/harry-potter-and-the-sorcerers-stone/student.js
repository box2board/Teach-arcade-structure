(() => {
  const form = document.getElementById('wh-student-form');
  if (!form) return;
  const fields = [...form.querySelectorAll('input, textarea')];
  const status = document.getElementById('wh-save-status');
  const progress = document.getElementById('wh-progress');
  const exportStatus = document.getElementById('wh-export-status');
  const key = 'teacharcade-harry-potter-and-the-sorcerers-stone-full-worksheet-v1';
  const responses = () => Object.fromEntries(fields.map(field => [field.name, field.value]));
  const update = () => {
    const qs = fields.filter(field => field.tagName === 'TEXTAREA');
    progress.textContent = `${qs.filter(field => field.value.trim()).length} of ${qs.length} responses completed`;
  };
  const save = () => {
    try { localStorage.setItem(key, JSON.stringify(responses())); status.textContent = 'Progress saved on this browser and device.'; }
    catch (_) { status.textContent = 'Browser saving is unavailable. Download your responses before leaving.'; }
    update();
  };
  try {
    const previous = JSON.parse(localStorage.getItem(key) || '{}');
    fields.forEach(field => { if (typeof previous[field.name] === 'string') field.value = previous[field.name]; });
  } catch (_) { /* Saving feedback is handled below. */ }
  save();
  fields.forEach(field => field.addEventListener('input', save));
  document.getElementById('wh-reset').addEventListener('click', () => {
    if (!window.confirm('Start a new worksheet? This clears the saved name, class, date, and all responses on this browser. Download any work you want to keep first.')) return;
    fields.forEach(field => { field.value = ''; });
    try { localStorage.removeItem(key); } catch (_) { /* The form can still be cleared without storage. */ }
    document.getElementById('wh-export').hidden = true;
    document.getElementById('wh-export-text').textContent = '';
    const fallback = document.getElementById('wh-copy-fallback');
    fallback.hidden = true;
    fallback.value = '';
    exportStatus.textContent = '';
    save();
    form.elements.student_name.focus();
  });
  form.addEventListener('submit', event => event.preventDefault());
  const textReport = () => {
    const lines = ['Harry Potter and the Sorcerer’s Stone - Student Responses', `Name: ${form.elements.student_name.value || 'Not entered'}`, `Class: ${form.elements.class_period.value || 'Not entered'}`, `Date: ${form.elements.date.value || 'Not entered'}`, ''];
    form.querySelectorAll('.wh-part').forEach(part => {
      lines.push(part.querySelector('summary').textContent, '');
      part.querySelectorAll('.wh-question').forEach(question => {
        lines.push(question.querySelector('label').textContent, question.querySelector('textarea').value.trim() || '[No response]', '');
      });
    });
    return lines.join('\n');
  };
  const prepareReport = () => {
    document.getElementById('wh-export-text').textContent = textReport();
    document.getElementById('wh-export').hidden = false;
  };
  const downloadPdf = () => {
    prepareReport();
    if (!window.jspdf) { exportStatus.textContent = 'PDF generation did not load. Use Copy Responses or Print / Save as PDF below.'; return; }
    const doc = new window.jspdf.jsPDF({ unit:'pt', format:'letter' });
    let y = 46;
    const ascii = value => value.replace(/[\u2018\u2019]/g, "'").replace(/[\u201c\u201d]/g, '"').replace(/[\u2013\u2014]/g, '-').replace(/\u00b7/g, '-');
    const write = (value, bold = false) => {
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      doc.setFontSize(11);
      const lines = doc.splitTextToSize(ascii(value), 520);
      for (const line of lines) { if (y > 735) { doc.addPage(); y = 46; } doc.text(line, 46, y); y += 15; }
      y += 8;
    };
    write('Harry Potter and the Sorcerer’s Stone - Student Responses', true);
    write(`Name: ${form.elements.student_name.value || 'Not entered'} | Class: ${form.elements.class_period.value || 'Not entered'} | Date: ${form.elements.date.value || 'Not entered'}`);
    form.querySelectorAll('.wh-part').forEach(part => {
      write(part.querySelector('summary').textContent, true);
      part.querySelectorAll('.wh-question').forEach(question => {
        if (y > 680) { doc.addPage(); y = 46; }
        write(question.querySelector('label').textContent, true);
        write(question.querySelector('textarea').value.trim() || '[No response]');
      });
    });
    const pages = doc.getNumberOfPages();
    for (let page = 1; page <= pages; page++) { doc.setPage(page); doc.setFontSize(8); doc.text(`Teach Arcade | ${page} / ${pages}`, 46, 770); }
    const name = form.elements.student_name.value.trim().replace(/[^a-zA-Z0-9_-]+/g,'-') || 'student';
    doc.save(`harry-potter-and-the-sorcerers-stone-${name}-responses.pdf`);
    exportStatus.textContent = 'PDF downloaded. Attach it to the assignment your teacher provided. It has not been sent automatically.';
  };
  document.querySelectorAll('[data-wh-download]').forEach(button => button.addEventListener('click', downloadPdf));
  document.getElementById('wh-copy').addEventListener('click', async () => {
    prepareReport();
    try { await navigator.clipboard.writeText(textReport()); exportStatus.textContent = 'Responses copied. Paste them into your teacher’s assignment.'; }
    catch (_) { const field = document.getElementById('wh-copy-fallback'); field.hidden = false; field.value = textReport(); field.focus(); field.select(); exportStatus.textContent = 'Copy the selected text and paste it into your teacher’s assignment.'; }
  });
  document.getElementById('wh-print').addEventListener('click', () => { prepareReport(); window.print(); });
})();
