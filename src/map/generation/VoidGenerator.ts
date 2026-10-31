import { BaseGenerator } from '@firec/map-module';
import type { Chunk, BuildContext } from '@firec/map-module';
import { TILES } from '../Types';

export class VoidGenerator extends BaseGenerator {
	readonly id = 'void';

	canGenerate(chunkX: number, chunkY: number): boolean {
		if (Math.hypot(chunkX, chunkY) < 2) return true;
		if (chunkX == 0 || chunkY == 0) return true;

		return false;
	}

	/**
	 * Заполняет весь чанк тайлом VOID (непроходимая пустота).
	 * Используется для центральных чанков и осей X/Y.
	 */
	protected buildChunk(chunk: Chunk, _ctx: BuildContext): void {
		chunk.fill(TILES.FLOOR);
	}
}
