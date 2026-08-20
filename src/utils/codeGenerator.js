/**
 * Generates formatted temporary access codes.
 * Example outputs: "ROOM-7K92-X4P8", "VORTEX-9B2M"
 */
export const generateAccessCode = (prefix = 'ROOM') => {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // Exclude ambiguous chars 0, O, 1, I
  const getRandomString = (len) => {
    let result = '';
    for (let i = 0; i < len; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const part1 = getRandomString(4);
  const part2 = getRandomString(4);
  return `${prefix}-${part1}-${part2}`;
};

/**
 * Normalizes user code input (strips hyphens, spaces, underscores, converts to uppercase).
 * Example: "ROOM-2KEE-GD2N" -> "ROOM2KEEGD2N"
 */
export const normalizeCode = (input) => {
  if (!input) return '';
  return input.trim().toUpperCase().replace(/[\s\-_]/g, '');
};
