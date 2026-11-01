import { describe, it, expect, beforeEach } from 'vitest';
import { JournalService } from '../src/services/JournalService';

/**
 * JournalService: открытие записей, метка «Новое», персистентность.
 */
describe('JournalService', () => {
	beforeEach(() => localStorage.clear());

	it('unlock открывает запись и помечает её новой', () => {
		const journal = new JournalService();
		expect(journal.isUnlocked('e:rust_grunt')).toBe(false);
		journal.unlock('e:rust_grunt');
		expect(journal.isUnlocked('e:rust_grunt')).toBe(true);
		expect(journal.isNew('e:rust_grunt')).toBe(true);
		expect(journal.getUnlocked()).toContain('e:rust_grunt');
	});

	it('markRead снимает метку «Новое», но запись остаётся открытой', () => {
		const journal = new JournalService();
		journal.unlock('i:pistol');
		journal.markRead('i:pistol');
		expect(journal.isNew('i:pistol')).toBe(false);
		expect(journal.isUnlocked('i:pistol')).toBe(true);
	});

	it('префиксы категорий и персистентность между экземплярами', () => {
		const first = new JournalService();
		first.unlockEntity('ice_shard');
		first.unlockItem('pistol');
		// Новый экземпляр читает то же localStorage-состояние
		const second = new JournalService();
		expect(second.isUnlocked('e:ice_shard')).toBe(true);
		expect(second.isUnlocked('i:pistol')).toBe(true);
		expect(second.isNew('e:ice_shard')).toBe(true);
	});
});
