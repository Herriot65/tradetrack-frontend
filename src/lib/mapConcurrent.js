// Keep large histories from flooding the API/database connection pool.
export async function mapConcurrent(items, concurrency, mapper) {
  if (!Number.isInteger(concurrency) || concurrency < 1) throw new RangeError('Concurrency must be a positive integer');
  const results = new Array(items.length);
  let next = 0;
  let failed = false;
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (!failed && next < items.length) {
      const index = next++;
      try { results[index] = await mapper(items[index], index); }
      catch (error) { failed = true; throw error; }
    }
  }));
  return results;
}
