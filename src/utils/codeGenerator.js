/**
 * Generates formatted temporary access codes.
 * Example outputs: "ROOM-7K92-X4P8", "VORTEX-9B2M", "7K92X4P8"
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
 * Formats user code input into standard uppercase format.
 */
export const normalizeCode = (input) => {
  if (!input) return '';
  return input.trim().toUpperCase().replace(/\s+/g, '');
};
