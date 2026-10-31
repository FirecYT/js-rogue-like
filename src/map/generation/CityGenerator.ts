import {
	BaseGenerator,
	createSeedFromCoords,
	SeededRandom,
} from '@firec/map-module';
import type { Chunk, BuildContext } from '@firec/map-module';
import { TILES } from '../Types';
import type { RegionMap } from '../../services/RegionMap';

/** Сторона городской ячейки в тайлах (4 чанка). */
const CELL_TILES = 64;
/** Ширина проёма двери в тайлах. */
const DOOR_WIDTH = 4;

/**
 * Генератор города: сетка ячеек 4×4 чанка; ячейка — либо здание со
 * стенами и внутренними перегородками с проёмами, либо площадь с
 * редкими обломками. Стены считаются по глобальным координатам тайлов,
 * поэтому стыки чанков бесшовны.
 */
export class CityGenerator extends BaseGenerator {
	readonly id = 'city';

	/**
	 * @param regionMap - Карта регионов: город занимает свой прямоугольник
	 */
	constructor(private readonly regionMap: RegionMap) {
		super();
	}

	canGenerate(chunkX: number, chunkY: number): boolean {
		return this.regionMap.regionAtChunk(chunkX, chunkY).generator === this.id;
	}

	protected buildChunk(chunk: Chunk, ctx: BuildContext): void {
		const rng = new SeededRandom(chunk.seed);
		chunk.fill(TILES.FLOOR);

		for (let ly = 0; ly < chunk.size; ly++) {
			for (let lx = 0; lx < chunk.size; lx++) {
				const gx = ctx.chunkX * chunk.size + lx;
				const gy = ctx.chunkY * chunk.size + ly;
				if (this.cityWallAt(gx, gy)) {
					chunk.setTile(lx, ly, TILES.WALL);
				}
			}
		}

		// Площади: редкие обломки
		const debris = rng.nextInt(0, 3);
		for (let i = 0; i < debris; i++) {
			const lx = rng.nextInt(0, chunk.size);
			const ly = rng.nextInt(0, chunk.size);
			if (chunk.getTile(lx, ly) === TILES.FLOOR) {
				chunk.setTile(lx, ly, TILES.ROCK);
			}
		}
	}

	/**
	 * Тайл стены города по глобальным координатам: линии стен ячейки
	 * (внешние и перегородки) с детерминированными проёмами дверей.
	 */
	private cityWallAt(gx: number, gy: number): boolean {
		const cellX = Math.floor(gx / CELL_TILES);
		const cellY = Math.floor(gy / CELL_TILES);
		const rng = new SeededRandom(createSeedFromCoords(cellX, cellY, 0xc17a));
		const isBuilding = rng.next() < 0.55;
		if (!isBuilding) return false;

		const topGap = rng.nextInt(8, CELL_TILES - 12);
		const midGapX = rng.nextInt(8, CELL_TILES - 12);
		const leftGap = rng.nextInt(8, CELL_TILES - 12);
		const midGapY = rng.nextInt(8, CELL_TILES - 12);

		const ox = gx - cellX * CELL_TILES;
		const oy = gy - cellY * CELL_TILES;

		if (oy === 0 || oy === CELL_TILES / 2) {
			const gap = oy === 0 ? topGap : midGapX;
			if (ox >= gap && ox < gap + DOOR_WIDTH) return false;
			return true;
		}
		if (ox === 0 || ox === CELL_TILES / 2) {
			const gap = ox === 0 ? leftGap : midGapY;
			if (oy >= gap && oy < gap + DOOR_WIDTH) return false;
			return true;
		}
		return false;
	}
}
