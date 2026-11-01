import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { StatsService } from '../src/services/StatsService';
import { eventBus } from '../src/events/EventBus';
import { loadMeta } from '../src/services/MetaStorage';
import type Entity from '../src/entities/Entity';
import type { Item } from '../src/items/Item';

/**
 * StatsService: статистика забега по событиям шины и слияние в мету.
 */
describe('StatsService', () => {
	let stats: StatsService;
	const player = { id: 'player' } as unknown as Entity;

	beforeEach(() => {
		localStorage.clear();
		stats = new StatsService(() => player);
	});

	afterEach(() => stats.dispose());

	it('считает только убийства своего игрока', () => {
		const victim = { definition: { id: 'rust_grunt' } } as unknown as Entity;
		const other = { id: 'other' } as unknown as Entity;
		eventBus.emit('entityKilled', { killer: player, victim });
		eventBus.emit('entityKilled', { killer: player, victim });
		eventBus.emit('entityKilled', { killer: other, victim });

		const run = stats.getRunStats();
		expect(run.kills['rust_grunt']).toBe(2);
		expect(run.killsTotal).toBe(2);
	});

	it('боссы и предметы попадают в счётчики забега', () => {
		const boss = {
			definition: { id: 'glass_warden', journal: 'boss' },
		} as unknown as Entity;
		eventBus.emit('entityKilled', { killer: player, victim: boss });
		eventBus.emit('itemPicked', {
			item: { id: 'damage_plus' } as unknown as Item,
			by: player,
		});
		eventBus.emit('barterCompleted', { offerId: 'a', playerId: 'b' });

		const run = stats.getRunStats();
		expect(run.bosses).toBe(1);
		expect(run.pickups).toBe(1);
		expect(run.trades).toBe(1);
	});

	it('endRun однократно сливает забег в мету', () => {
		const victim = { definition: { id: 'ice_shard' } } as unknown as Entity;
		eventBus.emit('entityKilled', { killer: player, victim });
		stats.endRun(true);
		stats.endRun(true); // повтор игнорируется

		const meta = loadMeta();
		expect(meta.stats.runsEnded).toBe(1);
		expect(meta.stats.totalDeaths).toBe(1);
		expect(meta.stats.totalKills).toBe(1);
	});
});
