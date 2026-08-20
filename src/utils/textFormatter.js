/**
 * Helper to parse markdown & Telegram-style formatting syntax into clean HTML.
 * Preserves multi-line spacing, lists, line breaks, spoilers, underlines, etc.
 */

export const renderFormattedText = (text) => {
  if (!text) return '';

  // Escape basic HTML entities to prevent XSS
  let escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Telegram Spoilers ||text|| (Blur to reveal on click)
  escaped = escaped.replace(/\|\|([^|]+)\|\|/g, '<span class="bg-slate-700 text-transparent select-none cursor-pointer rounded px-1 transition-colors hover:text-slate-100 hover:bg-slate-800" onclick="this.classList.remove(\'text-transparent\')">$1</span>');

  // Telegram Underline <u>text</u> or __text__
  escaped = escaped.replace(/__([^_]+)__/g, '<u class="underline decoration-indigo-400 decoration-2">$1</u>');
  escaped = escaped.replace(/&lt;u&gt;(.*?)&lt;\/u&gt;/g, '<u class="underline decoration-indigo-400 decoration-2">$1</u>');

  // Code blocks `code`
  escaped = escaped.replace(/`([^`]+)`/g, '<code class="bg-slate-800 text-cyan-300 px-1.5 py-0.5 rounded font-mono text-xs border border-slate-700">$1</code>');

  // Bold *bold*
  escaped = escaped.replace(/\*([^*]+)\*/g, '<strong class="font-bold text-white">$1</strong>');

  // Italic _italic_
  escaped = escaped.replace(/_([^_]+)_/g, '<em class="italic text-slate-200">$1</em>');

  // Strikethrough ~strikethrough~
  escaped = escaped.replace(/~([^~]+)~'/g, '<del class="line-through text-slate-400">$1</del>');

  // Markdown links [text](url)
  escaped = escaped.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-indigo-400 hover:text-indigo-300 underline font-medium">$1</a>');

  // Raw URLs
  const urlRegex = /(?<!href=")(https?:\/\/[^\s<]+)/g;
  escaped = escaped.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-indigo-400 hover:text-indigo-300 underline break-all">$1</a>');

  // Blockquotes (lines starting with &gt; or >)
  const lines = escaped.split('\n');
  const processedLines = lines.map(line => {
    if (line.startsWith('&gt; ')) {
      return `<blockquote class="border-l-4 border-indigo-500 pl-3 py-1 my-1 italic bg-indigo-950/30 text-indigo-200 rounded-r">${line.slice(5)}</blockquote>`;
    }
    return line;
  });

  return processedLines.join('\n');
};

/**
 * Inserts markdown & Telegram formatting symbols into composer text input around selected range.
 */
export const insertFormattingSymbol = (text, symbol, selectionStart, selectionEnd) => {
  const before = text.substring(0, selectionStart);
  const selected = text.substring(selectionStart, selectionEnd) || 'text';
  const after = text.substring(selectionEnd);

  let formatted = '';
  switch (symbol) {
    case 'bold':
      formatted = `${before}*${selected}*${after}`;
      break;
    case 'italic':
      formatted = `${before}_${selected}_${after}`;
      break;
    case 'underline':
      formatted = `${before}__${selected}__${after}`;
      break;
    case 'strikethrough':
      formatted = `${before}~${selected}~${after}`;
      break;
    case 'code':
    case 'monospace':
      formatted = `${before}\`${selected}\`${after}`;
      break;
    case 'spoiler':
      formatted = `${before}||${selected}||${after}`;
      break;
    case 'quote':
      formatted = `${before}\n> ${selected}${after}`;
      break;
    case 'link':
      formatted = `${before}[${selected}](https://)${after}`;
      break;
    default:
      formatted = text;
  }
  return formatted;
};
