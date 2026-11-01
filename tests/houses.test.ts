import { describe, it, expect } from 'vitest';
import {
	housesForChunk,
	houseInterior,
	houseWallAt,
} from '../src/map/structures/houses';

/**
 * Дома руин: детерминированная генерация от seed забега.
 */
describe('houses', () => {
	it('детерминированы: один seed — одна раскладка', () => {
		const a = housesForChunk(10, -20, 12345);
		const b = housesForChunk(10, -20, 12345);
		expect(a).toEqual(b);
	});

	it('на площадке 40×40 чанков находятся дома', () => {
		let total = 0;
		for (let cy = -20; cy < 20; cy++) {
			for (let cx = 0; cx < 40; cx++) {
				total += housesForChunk(cx, cy, 777).length;
			}
		}
		expect(total).toBeGreaterThan(0);
	});

	it('интерьер внутри коробки, стены по границе', () => {
		let house = null;
		outer: for (let cy = -20; cy < 20; cy++) {
			for (let cx = 0; cx < 40; cx++) {
				const hs = housesForChunk(cx, cy, 777);
				if (hs.length) {
					house = hs[0];
					break outer;
				}
			}
		}
		expect(house).not.toBeNull();
		const interior = houseInterior(house!);
		expect(interior.x).toBeGreaterThan(house!.x);
		expect(interior.y).toBeGreaterThan(house!.y);
		expect(interior.x + interior.w).toBeLessThan(house!.x + house!.w);
		expect(interior.y + interior.h).toBeLessThan(house!.y + house!.h);
		// Точка внешнего контура — стена, центр интерьера — не стена
		expect(houseWallAt(house!, house!.x, house!.y)).toBe(true);
		expect(
			houseWallAt(
				house!,
				interior.x + (interior.w >> 1),
				interior.y + (interior.h >> 1)
			)
		).toBe(false);
	});
});
