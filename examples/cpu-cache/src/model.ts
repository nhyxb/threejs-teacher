export interface CacheLine { block: number | null; usedAt: number }
export interface CacheEvent {
  index: number; element: number; block: number; hit: boolean; slot: number;
  evictedBlock: number | null; before: CacheLine[]; after: CacheLine[];
  hits: number; misses: number;
}
export const EVENT_SECONDS = 2.8;
export const SEQUENTIAL = Array.from({ length: 16 }, (_, i) => i);
export const INTERLEAVED = Array.from({ length: 16 }, (_, i) => Math.floor(i / 4) + (i % 4) * 4);
export const REPLACEMENT = [0, 4, 0, 8, 4];

export function simulate(sequence: readonly number[], capacity: number): CacheEvent[] {
  if (capacity !== 2 && capacity !== 4) throw new RangeError('教学模型支持 2 行或 4 行缓存');
  const cache: CacheLine[] = Array.from({ length: capacity }, () => ({ block: null, usedAt: -1 }));
  let hits = 0, misses = 0;
  return sequence.map((element, index) => {
    if (!Number.isInteger(element) || element < 0 || element >= 16) throw new RangeError('数组下标须为 0…15 的整数');
    const block = Math.floor(element / 4); const before = cache.map(line => ({ ...line }));
    let slot = cache.findIndex(line => line.block === block);
    const hit = slot >= 0; let evictedBlock: number | null = null;
    if (hit) hits++;
    else {
      misses++; slot = cache.findIndex(line => line.block === null);
      if (slot < 0) { slot = cache.reduce((oldest, line, i) => line.usedAt < cache[oldest].usedAt ? i : oldest, 0); evictedBlock = cache[slot].block; }
    }
    cache[slot] = { block, usedAt: index };
    return { index, element, block, hit, slot, evictedBlock, before, after: cache.map(line => ({ ...line })), hits, misses };
  });
}

export function sample(events: readonly CacheEvent[], time: number) {
  if (!Number.isFinite(time) || time < 0) throw new RangeError('时间须为非负有限值');
  if (events.length === 0) return { event: undefined, phase: 0, complete: 0, hits: 0, misses: 0, cache: [] as CacheLine[] };
  const index = Math.min(Math.floor(time / EVENT_SECONDS), events.length - 1);
  const phase = Math.min(1, (time - index * EVENT_SECONDS) / EVENT_SECONDS);
  const event = events[index], complete = index + (phase >= 0.92 ? 1 : 0), completed = events[complete - 1];
  return { event, phase, complete, hits: completed?.hits ?? 0, misses: completed?.misses ?? 0, cache: phase >= 0.64 ? event.after : event.before };
}

export function sequenceFor(stepId: string, pattern: string): number[] {
  switch (stepId) {
    case 'cold': return [0];
    case 'reuse': return [0, 0, 1, 2, 3];
    case 'replace': return REPLACEMENT;
    case 'compare': return pattern === 'interleaved' ? INTERLEAVED : SEQUENTIAL;
    default: return [];
  }
}
