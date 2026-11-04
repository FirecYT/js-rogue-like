import type { Chunk, BuildContext } from '@firec/map-module';
import { TILES } from '../Types';
import { REGION_DEFINITIONS } from '../../content/regions/definitions';
import { BunkerGenerator } from './BunkerGenerator';
import { platformWallAt, regionCenterTile } from './structures';

/** Полуширина расчищенной арены вокруг алтаря в центре зала, тайлы. */
const ARENA_HALF = 8;

/**
 * Кристальные залы: комнатная планировка бункера (сетка комнат с дверными
 * проёмами и воротами по центрам сторон), но в центре региона вырублена
 * открытая арена с кольцом-подиумом — там система фич ставит алтарь
 * Кристального змея.
 */
export class CrystalHallsGenerator extends BunkerGenerator {
	readonly id = 'crystal';

	canGenerate(chunkX: number, chunkY: number): boolean {
		return this.regionMap.regionAtChunk(chunkX, chunkY).generator === this.id;
	}

	protected buildChunk(chunk: Chunk, ctx: BuildContext): void {
		super.buildChunk(chunk, ctx);
		const rect = REGION_DEFINITIONS.crystal_halls.rect;
		if (!rect) return;
		const center = regionCenterTile(rect);
		const originX = ctx.chunkX * chunk.size;
		const originY = ctx.chunkY * chunk.size;
		for (let ly = 0; ly < chunk.size; ly++) {
			for (let lx = 0; lx < chunk.size; lx++) {
				const gx = originX + lx;
				const gy = originY + ly;
				if (platformWallAt(gx, gy, center.x, center.y)) {
					chunk.setTile(lx, ly, TILES.WALL);
				} else if (
					Math.abs(gx - center.x) <= ARENA_HALF &&
					Math.abs(gy - center.y) <= ARENA_HALF
				) {
					chunk.setTile(lx, ly, TILES.FLOOR);
				}
			}
		}
	}
}
