/**
 * Helper to format timestamps into Messenger-style Date Separators
 * e.g., "Today", "Yesterday", "Monday, Sep 5", or "Sep 5, 2026"
 */

export const formatDateSeparator = (dateStringOrIso) => {
  if (!dateStringOrIso) return '';
  const date = new Date(dateStringOrIso);
  if (isNaN(date.getTime())) return '';

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const isSameDay = (d1, d2) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  if (isSameDay(date, today)) {
    return 'Today';
  }

  if (isSameDay(date, yesterday)) {
    return 'Yesterday';
  }

  const options = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
  };

  return date.toLocaleDateString(undefined, options);
};

export const isDifferentDay = (dateStr1, dateStr2) => {
  if (!dateStr1 || !dateStr2) return true;
  const d1 = new Date(dateStr1);
  const d2 = new Date(dateStr2);
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return true;

  return (
    d1.getFullYear() !== d2.getFullYear() ||
    d1.getMonth() !== d2.getMonth() ||
    d1.getDate() !== d2.getDate()
  );
};
