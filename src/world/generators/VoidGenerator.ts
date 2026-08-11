import { BaseGenerator } from './BaseGenerator';
import { OptimizedChunk, RegionType } from '../Types';

/**
 * Генератор пустых чанков (void): только проходимые тайлы.
 * @remarks Используется для стартовой зоны и тестовых областей.
 */
export class VoidGenerator extends BaseGenerator {
	/**
	 * Генерирует пустой проходимый чанк.
	 * @param chunkX - X координата чанка
	 * @param chunkY - Y координата чанка
	 * @param seed - Seed для детерминированной генерации (опционально)
	 * @returns Оптимизированный чанк с регионом VOID
	 */
	generate(chunkX: number, chunkY: number, seed?: number): OptimizedChunk {
		const chunk = this.createEmptyChunk(
			chunkX,
			chunkY,
			RegionType.VOID,
			seed ?? 0
		);
		// Пустой чанк уже создан с правильными параметрами
		// Просто финализируем его
		this.finalizeChunk(chunk, true);
		return chunk;
	}
}
