import { BaseGenerator } from '@firec/map-module';
import type { Chunk, BuildContext } from '@firec/map-module';
import { TILES } from '../Types';

export class VoidGenerator extends BaseGenerator {
	readonly id = 'void';

	protected buildChunk(chunk: Chunk, _ctx: BuildContext): void {
		chunk.fill(TILES.FLOOR);
	}
}
