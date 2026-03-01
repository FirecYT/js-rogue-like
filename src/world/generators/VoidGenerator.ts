import { BaseGenerator } from './BaseGenerator';
import { Chunk, RegionType } from '../Types';

/**
 * Генератор пустых чанков (void): только проходимые тайлы.
 */
export class VoidGenerator extends BaseGenerator {
	/**
	 * @param chunkX - X чанка
	 * @param chunkY - Y чанка
	 * @returns Пустой чанк с regionType VOID
	 */
	generate(chunkX: number, chunkY: number): Chunk {
		const chunk = this.createEmptyChunk(chunkX, chunkY);
		chunk.regionType = RegionType.VOID;

		return chunk;
	}
}
