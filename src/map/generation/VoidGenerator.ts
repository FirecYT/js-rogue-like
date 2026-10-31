import { BaseGenerator } from '@firec/map-module';
import type { Chunk, BuildContext } from '@firec/map-module';
import { TILES } from '../Types';
import type { RegionMap } from '../../services/RegionMap';

export class VoidGenerator extends BaseGenerator {
	readonly id = 'void';

	/**
	 * @param regionMap - Карта регионов: пустота занимает свой прямоугольник
	 */
	constructor(private readonly regionMap: RegionMap) {
		super();
	}

	canGenerate(chunkX: number, chunkY: number): boolean {
		return this.regionMap.regionAtChunk(chunkX, chunkY).generator === this.id;
	}

	/**
	 * Заполняет весь чанк ровным полом: ядро пустоты — безопасная плоскость
	 * в центре мира без структур и спавнов.
	 */
	protected buildChunk(chunk: Chunk, _ctx: BuildContext): void {
		chunk.fill(TILES.FLOOR);
	}
}
