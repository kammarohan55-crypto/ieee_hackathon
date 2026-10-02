// Two hours is a presentation expiry, not an environmental threshold.
const maxAge = 2 * 60 * 60 * 1000;
export function weatherFreshness(modelTime: string, fetchedAt: string, now: number) {
  const modelAt = Date.parse(`${modelTime}Z`), fetched = Date.parse(fetchedAt);
  const verified = Number.isFinite(modelAt) && Number.isFinite(fetched) && Number.isFinite(now)
    && modelAt <= now + 300000 && fetched <= now + 300000;
  return {
    stale: !verified || now - modelAt > maxAge || now - fetched > maxAge,
    verified,
  };
}
