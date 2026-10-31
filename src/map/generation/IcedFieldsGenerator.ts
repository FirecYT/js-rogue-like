import { BaseGenerator, SeededRandom } from '@firec/map-module';
import type { Chunk, BuildContext } from '@firec/map-module';
import { TILES } from '../Types';
import type { RegionMap } from '../../services/RegionMap';

/**
 * Генератор открытых полей: ровный пол с детерминированными скоплениями
 * обломков. Базовый класс для ледяных и стеклянных равнин.
 */
export abstract class OpenFieldGenerator extends BaseGenerator {
	/** Минимальное и максимальное число скоплений на чанк. */
	protected abstract readonly clusterRange: [number, number];

	protected buildChunk(chunk: Chunk, _ctx: BuildContext): void {
		chunk.fill(TILES.FLOOR);
		const rng = new SeededRandom(chunk.seed);
		const [minC, maxC] = this.clusterRange;
		const clusters = rng.nextInt(minC, maxC + 1);
		for (let i = 0; i < clusters; i++) {
			const cx = rng.nextInt(0, chunk.size);
			const cy = rng.nextInt(0, chunk.size);
			const r = rng.nextInt(1, 4);
			for (let dy = -r; dy <= r; dy++) {
				for (let dx = -r; dx <= r; dx++) {
					if (dx * dx + dy * dy > r * r) continue;
					const lx = cx + dx;
					const ly = cy + dy;
					if (lx < 0 || ly < 0 || lx >= chunk.size || ly >= chunk.size) {
						continue;
					}
					if (rng.next() < 0.7) chunk.setTile(lx, ly, TILES.ROCK);
				}
			}
		}
	}
}

/** Ледяные поля: снег, лёд и редкие торосы. */
export class IcedFieldsGenerator extends OpenFieldGenerator {
	readonly id = 'iced';
	protected readonly clusterRange: [number, number] = [0, 3];

	constructor(private readonly regionMap: RegionMap) {
		super();
	}

	canGenerate(chunkX: number, chunkY: number): boolean {
		return this.regionMap.regionAtChunk(chunkX, chunkY).generator === this.id;
	}
}
