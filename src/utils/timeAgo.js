/**
 * Formats timestamps into human readable relative time or localized time strings (English).
 */
export const formatTimeAgo = (timestamp) => {
  if (!timestamp) return '';

  let date;
  if (timestamp.toDate && typeof timestamp.toDate === 'function') {
    date = timestamp.toDate();
  } else if (timestamp.seconds) {
    date = new Date(timestamp.seconds * 1000);
  } else {
    date = new Date(timestamp);
  }

  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 15) return 'Just now';
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

/**
 * Returns exact clock time (e.g. 10:45 PM).
 */
export const formatClockTime = (timestamp) => {
  if (!timestamp) return '';
  let date;
  if (timestamp.toDate && typeof timestamp.toDate === 'function') {
    date = timestamp.toDate();
  } else if (timestamp.seconds) {
    date = new Date(timestamp.seconds * 1000);
  } else {
    date = new Date(timestamp);
  }
  if (isNaN(date.getTime())) return '';

  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

/**
 * Formats time remaining for access code expiration countdowns.
 */
export const formatRemainingTime = (expiresAt) => {
  if (!expiresAt) return 'Unlimited (No Expiry)';
  let date;
  if (expiresAt.toDate && typeof expiresAt.toDate === 'function') {
    date = expiresAt.toDate();
  } else if (expiresAt.seconds) {
    date = new Date(expiresAt.seconds * 1000);
  } else {
    date = new Date(expiresAt);
  }

  if (isNaN(date.getTime())) return 'Unlimited (No Expiry)';

  const now = new Date();
  const diffInMs = date - now;
  if (diffInMs <= 0) return 'Expired';

  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const hours = Math.floor(diffInMinutes / 60);
  const mins = diffInMinutes % 60;
  const secs = diffInSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${mins}m left`;
  }
  if (mins > 0) {
    return `${mins}m ${secs}s left`;
  }
  return `${secs}s left`;
};
