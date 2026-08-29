/**
 * Guaranteed 100% exact character-for-character clipboard copy utility.
 * Preserves exact case (uppercase, lowercase), numbers, spaces, and symbols without string mutation.
 * Includes robust fallback for HTTP/mobile/insecure contexts where navigator.clipboard might fail.
 *
 * @param {string} text - The raw string to copy
 * @returns {Promise<boolean>} - Resolves to true if copy succeeded
 */
export const copyToClipboard = async (text) => {
  if (text === null || text === undefined) return false;
  const contentToCopy = String(text);

  // 1. Primary: Async Clipboard API
  if (navigator && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(contentToCopy);
      return true;
    } catch (err) {
      console.warn('Async Clipboard API failed, attempting execCommand fallback:', err);
    }
  }

  // 2. Secondary: Fallback execCommand with hidden textarea
  try {
    const textarea = document.createElement('textarea');
    textarea.value = contentToCopy;
    textarea.style.position = 'fixed';
    textarea.style.top = '-9999px';
    textarea.style.left = '-9999px';
    textarea.style.opacity = '0';
    textarea.style.pointerEvents = 'none';
    textarea.setAttribute('readonly', '');
    
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);

    const successful = document.execCommand('copy');
    document.body.removeChild(textarea);
    return successful;
  } catch (err) {
    console.error('Fallback clipboard copy failed:', err);
    return false;
  }
};
