import {
	BaseGenerator,
	createSeedFromCoords,
	SeededRandom,
} from '@firec/map-module';
import type { Chunk, BuildContext } from '@firec/map-module';
import { TILES } from '../Types';
import type { RegionMap } from '../../services/RegionMap';
import { REGION_DEFINITIONS } from '../../content/regions/definitions';

/** Шаг сетки комнат бункера в тайлах. */
const ROOM_TILES = 32;
/** Ширина дверного проёма. */
const DOOR_WIDTH = 4;
/** Полуширина ворот во внешней стене. */
const GATE_HALF = 4;

/**
 * Генератор бункера: замкнутый контур внешних стен с воротами по центрам
 * сторон и внутренняя сетка комнат 32×32 тайла с дверными проёмами.
 * Стены считаются по глобальным координатам — стыки чанков бесшовны.
 */
export class BunkerGenerator extends BaseGenerator {
	readonly id = 'bunker';

	/**
	 * @param regionMap - Карта регионов: бункер занимает свой прямоугольник
	 */
	constructor(private readonly regionMap: RegionMap) {
		super();
	}

	canGenerate(chunkX: number, chunkY: number): boolean {
		return this.regionMap.regionAtChunk(chunkX, chunkY).generator === this.id;
	}

	protected buildChunk(chunk: Chunk, ctx: BuildContext): void {
		chunk.fill(TILES.FLOOR);
		for (let ly = 0; ly < chunk.size; ly++) {
			for (let lx = 0; lx < chunk.size; lx++) {
				const gx = ctx.chunkX * chunk.size + lx;
				const gy = ctx.chunkY * chunk.size + ly;
				if (this.bunkerWallAt(gx, gy)) {
					chunk.setTile(lx, ly, TILES.WALL);
				}
			}
		}
	}

	/** Тайл стены бункера по глобальным координатам. */
	private bunkerWallAt(gx: number, gy: number): boolean {
		const rect = REGION_DEFINITIONS.bunker.rect;
		if (!rect) return false;
		const x0 = rect.x * 16;
		const y0 = rect.y * 16;
		const x1 = (rect.x + rect.w) * 16 - 1;
		const y1 = (rect.y + rect.h) * 16 - 1;
		const cx = (x0 + x1) / 2;
		const cy = (y0 + y1) / 2;

		// Внешний контур с воротами по центрам сторон
		if (gy === y0 || gy === y1) {
			return Math.abs(gx - cx) >= GATE_HALF;
		}
		if (gx === x0 || gx === x1) {
			return Math.abs(gy - cy) >= GATE_HALF;
		}
		if (gx < x0 || gx > x1 || gy < y0 || gy > y1) return false;

		// Внутренняя сетка комнат с проёмами
		const cellX = Math.floor(gx / ROOM_TILES);
		const cellY = Math.floor(gy / ROOM_TILES);
		const rng = new SeededRandom(createSeedFromCoords(cellX, cellY, 0xb0b1));
		const gapX = rng.nextInt(6, ROOM_TILES - 10);
		const gapY = rng.nextInt(6, ROOM_TILES - 10);
		const ox = gx - cellX * ROOM_TILES;
		const oy = gy - cellY * ROOM_TILES;
		if (oy === 0) return !(ox >= gapX && ox < gapX + DOOR_WIDTH);
		if (ox === 0) return !(oy >= gapY && oy < gapY + DOOR_WIDTH);
		return false;
	}
}
