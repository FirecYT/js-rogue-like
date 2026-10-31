import { BaseGenerator } from '@firec/map-module';
import type { Chunk, BuildContext } from '@firec/map-module';
import { TILES } from '../Types';
import type { RegionMap } from '../../services/RegionMap';
import { REGION_DEFINITIONS } from '../../content/regions/definitions';
import { platformWallAt, regionCenterTile } from './structures';

/**
 * Регион алтаря: ровная площадка с кольцом-подиумом в центре, где
 * система фич ставит алтарь босса региона.
 */
export class AltarRegionGenerator extends BaseGenerator {
	readonly id = 'altar';

	constructor(private readonly regionMap: RegionMap) {
		super();
	}

	canGenerate(chunkX: number, chunkY: number): boolean {
		return this.regionMap.regionAtChunk(chunkX, chunkY).generator === this.id;
	}

	protected buildChunk(chunk: Chunk, ctx: BuildContext): void {
		chunk.fill(TILES.FLOOR);
		const rect = REGION_DEFINITIONS.worm_altar.rect;
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
					Math.abs(gx - center.x) === 3 &&
					Math.abs(gy - center.y) === 3
				) {
					chunk.setTile(lx, ly, TILES.ROCK);
				}
			}
		}
	}
}
