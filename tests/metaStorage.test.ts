import { describe, it, expect, beforeEach } from 'vitest';
import { loadMeta, saveMeta } from '../src/services/MetaStorage';

/**
 * MetaStorage: чтение/запись мета-состояния между забегами.
 */
describe('MetaStorage', () => {
	beforeEach(() => localStorage.clear());

	it('возвращает дефолты при пустом хранилище', () => {
		const meta = loadMeta();
		expect(meta.journal).toEqual([]);
		expect(meta.journalNew).toEqual([]);
		expect(meta.stats.runs).toBe(0);
		expect(meta.stats.bestRunTicks).toBeNull();
	});

	it('сохраняет и читает состояние (round-trip)', () => {
		const meta = loadMeta();
		meta.journal = ['e:rust_grunt', 'i:pistol'];
		meta.journalNew = ['e:rust_grunt'];
		meta.stats.runs = 3;
		meta.stats.totalKills = 12;
		saveMeta(meta);

		const loaded = loadMeta();
		expect(loaded.journal).toEqual(['e:rust_grunt', 'i:pistol']);
		expect(loaded.journalNew).toEqual(['e:rust_grunt']);
		expect(loaded.stats.runs).toBe(3);
		expect(loaded.stats.totalKills).toBe(12);
	});

	it('устойчиво к повреждённым данным', () => {
		localStorage.setItem('jsrl.meta.v1', '{не json');
		const meta = loadMeta();
		expect(meta.journal).toEqual([]);
		expect(meta.stats.runs).toBe(0);
	});
});
