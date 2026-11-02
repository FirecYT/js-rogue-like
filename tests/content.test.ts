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

	it('у каждого региона есть имя и лор-описание', () => {
		for (const regionId of REGION_ORDER) {
			const region = REGION_DEFINITIONS[regionId];
			expect(region.name.length).toBeGreaterThan(0);
			expect(region.description.length).toBeGreaterThan(20);
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
