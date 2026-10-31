import { createSeedFromCoords, SeededRandom } from '@firec/map-module';

/** Сторона блока размещения домов в чанках (8 чанков = 128 тайлов). */
const BLOCK_CHUNKS = 8;
/** Габарит дома по внешнему контуру стен, тайлы. */
const HOUSE_W = 12;
const HOUSE_H = 10;
/** Шанс дома в блоке. */
const HOUSE_CHANCE = 0.45;

/** Дом: внешний прямоугольник стен с проёмом двери с юга. */
export interface HouseRect {
	/** Координата внешнего угла стен в тайлах. */
	x: number;
	y: number;
	w: number;
	h: number;
}

/**
 * Дом блока размещения (детерминированно от seed забега).
 * @param bx - Индекс блока X
 * @param by - Индекс блока Y
 * @param runSeed - Seed забега
 * @returns Прямоугольник дома или null, если в блоке дома нет
 */
export function houseOfBlock(
	bx: number,
	by: number,
	runSeed: number
): HouseRect | null {
	const rng = new SeededRandom(createSeedFromCoords(bx, by, runSeed ^ 0x405e));
	if (rng.next() >= HOUSE_CHANCE) return null;
	const ox = rng.nextInt(8, 128 - HOUSE_W - 8);
	const oy = rng.nextInt(8, 128 - HOUSE_H - 8);
	return { x: bx * 128 + ox, y: by * 128 + oy, w: HOUSE_W, h: HOUSE_H };
}

/**
 * Все дома, пересекающие чанк (включая соседние блоки).
 * @param chunkX - Координата чанка X
 * @param chunkY - Координата чанка Y
 * @param runSeed - Seed забега
 * @returns Список прямоугольников домов
 */
export function housesForChunk(
	chunkX: number,
	chunkY: number,
	runSeed: number
): HouseRect[] {
	const result: HouseRect[] = [];
	const bx0 = Math.floor(chunkX / BLOCK_CHUNKS);
	const by0 = Math.floor(chunkY / BLOCK_CHUNKS);
	const minX = chunkX * 16;
	const minY = chunkY * 16;
	for (let by = by0 - 1; by <= by0 + 1; by++) {
		for (let bx = bx0 - 1; bx <= bx0 + 1; bx++) {
			const house = houseOfBlock(bx, by, runSeed);
			if (!house) continue;
			if (
				house.x < minX + 16 &&
				house.x + house.w > minX &&
				house.y < minY + 16 &&
				house.y + house.h > minY
			) {
				result.push(house);
			}
		}
	}
	return result;
}

/**
 * Тайл внешнего контура дома является стеной (с учётом двери с юга).
 * @param house - Прямоугольник дома
 * @param gx - Глобальный тайл X
 * @param gy - Глобальный тайл Y
 * @returns true, если тайл — стена дома
 */
export function houseWallAt(
	house: HouseRect,
	gx: number,
	gy: number
): boolean {
	const onRing =
		gx === house.x ||
		gx === house.x + house.w - 1 ||
		gy === house.y ||
		gy === house.y + house.h - 1;
	if (!onRing) return false;
	// Дверь: два тайла в центре южной стены
	if (gy === house.y + house.h - 1) {
		const doorX = house.x + Math.floor(house.w / 2);
		if (gx === doorX || gx === doorX - 1) return false;
	}
	return true;
}

/** Внутренняя область дома (без стен), тайлы. */
export function houseInterior(house: HouseRect): HouseRect {
	return { x: house.x + 1, y: house.y + 1, w: house.w - 2, h: house.h - 2 };
}
