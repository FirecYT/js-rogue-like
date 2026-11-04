import { describe, it, expect } from 'vitest';
import { ITEM_DEFINITIONS } from '../src/content/items/definitions';
import {
	REGION_DEFINITIONS,
	REGION_ORDER,
} from '../src/content/regions/definitions';
import { ENTITY_DEFINITIONS } from '../src/content/entities/definitions';

/**
 * Целостность контент-таблиц: достижимость предметов в обычной игре,
 * валидность ссылок лута, наличие описаний у журнала.
 */
describe('Контент-таблицы', () => {
	/** Все id предметов, которые можно найти/получить без debug-хуков. */
	function obtainableIds(): Set<string> {
		const ids = new Set<string>(['pistol']); // стартовое оружие игрока
		for (const regionId of REGION_ORDER) {
			for (const factory of REGION_DEFINITIONS[regionId].loot) {
				ids.add(factory().id);
			}
		}
		return ids;
	}

	it('каждый предмет реестра достижим в обычной игре', () => {
		const obtainable = obtainableIds();
		const missing = Object.keys(ITEM_DEFINITIONS).filter(
			(id) => !obtainable.has(id)
		);
		expect(missing).toEqual([]);
	});

	it('лут регионов ссылается только на предметы из реестра', () => {
		for (const regionId of REGION_ORDER) {
			for (const factory of REGION_DEFINITIONS[regionId].loot) {
				const item = factory();
				expect(ITEM_DEFINITIONS[item.id], `${regionId}: ${item.id}`).toBeTruthy();
			}
		}
	});

	it('регион с пулом лута спавнит тайники (lootChance > 0)', () => {
		for (const regionId of REGION_ORDER) {
			const region = REGION_DEFINITIONS[regionId];
			if (region.loot.length) {
				expect(
					region.lootChance ?? 0,
					`${regionId}: пул лута есть, но тайники не спавнятся`
				).toBeGreaterThan(0);
			}
		}
	});

	it('у каждого региона есть имя и лор-описание', () => {
		for (const regionId of REGION_ORDER) {
			const region = REGION_DEFINITIONS[regionId];
			expect(region.name.length).toBeGreaterThan(0);
			expect(region.description.length).toBeGreaterThan(20);
		}
	});

	it('каждый журнальный враг встречается в таблице спавна региона', () => {
		const spawned = new Set<string>();
		for (const regionId of REGION_ORDER) {
			for (const entry of REGION_DEFINITIONS[regionId].spawns) {
				if (entry.weight > 0) spawned.add(entry.defId);
			}
		}
		const missing = Object.values(ENTITY_DEFINITIONS).filter(
			(def) => def.journal === 'enemy' && !spawned.has(def.id)
		);
		expect(missing.map((d) => d.id)).toEqual([]);
	});

	it('каждый босс доступен: алтарь региона или спавн-таблица', () => {
		const reachable = new Set<string>();
		for (const regionId of REGION_ORDER) {
			const region = REGION_DEFINITIONS[regionId];
			if (region.bossDefId) reachable.add(region.bossDefId);
			for (const entry of region.spawns) {
				if (entry.weight > 0) reachable.add(entry.defId);
			}
		}
		const missing = Object.values(ENTITY_DEFINITIONS).filter(
			(def) => def.journal === 'boss' && !reachable.has(def.id)
		);
		expect(missing.map((d) => d.id)).toEqual([]);
	});

	it('прямоугольники регионов не пересекаются', () => {
		const rects = REGION_ORDER.map((id) => ({
			id,
			rect: REGION_DEFINITIONS[id].rect,
		})).filter((r): r is { id: string; rect: NonNullable<typeof r.rect> } =>
			Boolean(r.rect)
		);
		for (let i = 0; i < rects.length; i++) {
			for (let j = i + 1; j < rects.length; j++) {
				const a = rects[i].rect;
				const b = rects[j].rect;
				const overlap =
					a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
				expect(overlap, `${rects[i].id} × ${rects[j].id}`).toBe(false);
			}
		}
	});

	it('у каждой журнальной сущности есть описание', () => {
		for (const def of Object.values(ENTITY_DEFINITIONS)) {
			if (def.journal) {
				expect(
					(def.description ?? '').length,
					`${def.id}: journal without description`
				).toBeGreaterThan(20);
			}
		}
	});
});
