import type { Chunk, BuildContext } from '@firec/map-module';
import { TILES } from '../Types';
import type { RegionMap } from '../../services/RegionMap';
import { REGION_DEFINITIONS } from '../../content/regions/definitions';
import { OpenFieldGenerator } from './IcedFieldsGenerator';
import { platformWallAt, regionCenterTile } from './structures';

/**
 * Стеклянная равнина: открытое поле осколков с алтарной платформой
 * Стеклянного стража в центре региона.
 */
export class GlassPlainGenerator extends OpenFieldGenerator {
	readonly id = 'glass';
	protected readonly clusterRange: [number, number] = [1, 4];

	constructor(private readonly regionMap: RegionMap) {
		super();
	}

	canGenerate(chunkX: number, chunkY: number): boolean {
		return this.regionMap.regionAtChunk(chunkX, chunkY).generator === this.id;
	}

	protected buildChunk(chunk: Chunk, ctx: BuildContext): void {
		super.buildChunk(chunk, ctx);
		const rect = REGION_DEFINITIONS.glass_plain.rect;
		if (!rect) return;
		const center = regionCenterTile(rect);
		const originX = chunk.x * chunk.size;
		const originY = chunk.y * chunk.size;
		for (let ly = 0; ly < chunk.size; ly++) {
			for (let lx = 0; lx < chunk.size; lx++) {
				const gx = originX + lx;
				const gy = originY + ly;
				if (platformWallAt(gx, gy, center.x, center.y)) {
					chunk.setTile(lx, ly, TILES.WALL);
				}
			}
		}
	}
}
