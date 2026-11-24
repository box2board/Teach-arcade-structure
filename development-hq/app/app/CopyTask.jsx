'use client';
import { useState } from 'react';

export default function CopyTask({ task }) {
  const [copied, setCopied] = useState(false);
  async function copyTask() {
    const content = [
      'TEACH ARCADE — DEVELOPMENT TASK',
      'Project: ' + task.project,
      'Type: ' + task.category,
      'Task: ' + task.description,
      '',
      'Requirements:',
      '- Inspect existing code and project documentation before modifying anything.',
      '- Work on a new isolated branch; do not merge to main or deploy.',
      '- Preserve functioning gameplay, accounts, assets, and existing integrations.',
      '- Optimize for Chromebooks and responsive layouts.',
      '- Report actual tests, files changed, regressions, and a playable preview if available.',
      '- Do not use any separately billed OpenAI API service without explicit approval.',
    ].join('\n');
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
    } catch {
      setCopied(false);
      window.prompt('Copy development task:', content);
    }
  }
  return <button type="button" className="subtle" onClick={copyTask}>{copied ? 'Copied' : 'Copy for Codex'}</button>;
}
