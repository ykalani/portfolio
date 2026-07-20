const MINUTES_1 = 60 * 1000;
const MINUTES_10 = 10 * 60 * 1000;

function nextReview(currentInterval, ef, quality) {
  if (quality === 0) return MINUTES_1;
  if (quality === 1) return MINUTES_10;
  if (quality === 2) {
    if (currentInterval < 1000) return MINUTES_1;
    return currentInterval * ef;
  }
  if (quality === 3) {
    if (currentInterval < 1000) return MINUTES_10;
    return currentInterval * ef * 1.3;
  }
  return MINUTES_1;
}

function updateEF(ef, quality) {
  const n = ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  return Math.max(1.3, n);
}

module.exports = { nextReview, updateEF };
