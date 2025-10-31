// world/generators/VoidGenerator.ts
import { BaseGenerator } from './BaseGenerator';
import { Chunk, RegionType } from '../Types';

export class VoidGenerator extends BaseGenerator {
	generate(chunkX: number, chunkY: number): Chunk {
		const chunk = this.createEmptyChunk(chunkX, chunkY);
		chunk.regionType = RegionType.VOID;

		return chunk;
	}
}
