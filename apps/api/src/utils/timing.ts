export async function withTiming<T>(_label: string, fn: () => Promise<T>): Promise<{ ms: number; result: T }> {
  const start = performance.now();
  const result = await fn();
  return { ms: Math.round(performance.now() - start), result };
}
