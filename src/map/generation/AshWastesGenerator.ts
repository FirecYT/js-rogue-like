import type { Chunk, BuildContext } from '@firec/map-module';
import { TILES } from '../Types';
import type { RegionMap } from '../../services/RegionMap';
import { REGION_DEFINITIONS } from '../../content/regions/definitions';
import { OpenFieldGenerator } from './IcedFieldsGenerator';
import { platformWallAt, regionCenterTile } from './structures';

/**
 * Пепельные пустоши: открытое поле с густыми скоплениями обломков и
 * алтарной платформой Скрепного тирана в центре региона.
 */
export class AshWastesGenerator extends OpenFieldGenerator {
	readonly id = 'ash';
	protected readonly clusterRange: [number, number] = [1, 5];

	constructor(private readonly regionMap: RegionMap) {
		super();
	}

	canGenerate(chunkX: number, chunkY: number): boolean {
		return this.regionMap.regionAtChunk(chunkX, chunkY).generator === this.id;
	}

	protected buildChunk(chunk: Chunk, ctx: BuildContext): void {
		super.buildChunk(chunk, ctx);
		const rect = REGION_DEFINITIONS.ash_wastes.rect;
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
					Math.abs(gx - center.x) <= 6 &&
					Math.abs(gy - center.y) <= 6
				) {
					chunk.setTile(lx, ly, TILES.FLOOR);
				}
			}
		}
	}
}
