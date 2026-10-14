/** Unwrap `{ success, data }` API envelopes. Axios already returns response.data. */
export const unwrapData = (res) => {
  if (res == null) return null;
  if (typeof res === 'object' && res.success === true && 'data' in res) {
    return res.data;
  }
  return res;
};

export const formatScorePercent = (score) =>
  score != null && !Number.isNaN(Number(score)) ? `${Math.round(score)}%` : 'Not analyzed';
