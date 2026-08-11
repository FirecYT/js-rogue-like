import { BaseGenerator, SeededRandom } from './BaseGenerator';
import {
	OptimizedChunk,
	TileType,
	RegionType,
	CHUNK_CONFIG,
	StructureType,
} from '../Types';

/**
 * Генератор арены босса: круг стен с четырьмя входами, центральная платформа.
 * @remarks Создаёт замкнутую арену для финальных боёв.
 */
export class BossAltarGenerator extends BaseGenerator {
	/**
	 * Генерирует чанк с ареной босса.
	 * @param chunkX - X координата чанка
	 * @param chunkY - Y координата чанка
	 * @param seed - Seed для детерминированной генерации (опционально)
	 * @returns Оптимизированный чанк с ареной
	 */
	generate(chunkX: number, chunkY: number, seed?: number): OptimizedChunk {
		const rng = this.createRng(chunkX, chunkY, seed);
		const chunk = this.createEmptyChunk(
			chunkX,
			chunkY,
			RegionType.BOSS_ALTAR,
			rng.getSeed()
		);

		this.generateArena(chunk, rng);

		// Центральная платформа для босса
		const centerX = Math.floor(CHUNK_CONFIG.SIZE / 2);
		const centerY = Math.floor(CHUNK_CONFIG.SIZE / 2);

		for (let x = -1; x <= 1; x++) {
			for (let y = -1; y <= 1; y++) {
				this.setTile(
					chunk,
					x + centerX,
					y + centerY,
					TileType.BUILDING
				);
			}
		}

		// Добавляем структуру центральной платформы
		this.addStructure(
			chunk,
			StructureType.LOOT_ZONE,
			{
				x: centerX - 1,
				y: centerY - 1,
				w: 3,
				h: 3,
			},
			{
				lootTable: 'boss_reward',
				difficulty: 5,
			}
		);

		this.finalizeChunk(chunk, true);
		return chunk;
	}

	/**
	 * Генерирует круглую арену с четырьмя входами.
	 * @param chunk - Чанк для заполнения
	 * @param rng - Генератор случайных чисел
	 */
	private generateArena(chunk: OptimizedChunk, rng: SeededRandom): void {
		const centerX = Math.floor(CHUNK_CONFIG.SIZE / 2);
		const centerY = Math.floor(CHUNK_CONFIG.SIZE / 2);
		const radius = 5 + rng.nextInt(0, 2); // Вариация радиуса 5-6

		// Создаём круг из стен
		for (let x = 0; x < CHUNK_CONFIG.SIZE; x++) {
			for (let y = 0; y < CHUNK_CONFIG.SIZE; y++) {
				const distance = Math.sqrt(
					(x - centerX) ** 2 + (y - centerY) ** 2
				);

				if (Math.abs(distance - radius) < 0.8) {
					this.setTile(chunk, x, y, TileType.WALL);
				}
			}
		}

		// 4 входа в арену (север, юг, запад, восток)
		// Добавляем небольшую вариацию в позиции входов для разнообразия
		const entranceOffsets = [
			{ dx: 0, dy: -radius }, // north
			{ dx: 0, dy: radius }, // south
			{ dx: -radius, dy: 0 }, // west
			{ dx: radius, dy: 0 }, // east
		];

		for (const offset of entranceOffsets) {
			// Небольшое смещение для естественности
			const offsetX = rng.nextInt(-1, 2);
			const offsetY = rng.nextInt(-1, 2);
			this.setTile(
				chunk,
				centerX + offset.dx + offsetX,
				centerY + offset.dy + offsetY,
				TileType.EMPTY
			);
		}

		// Добавляем структуру арены
		this.addStructure(
			chunk,
			StructureType.ROOM,
			{
				x: centerX - radius,
				y: centerY - radius,
				w: radius * 2 + 1,
				h: radius * 2 + 1,
			},
			{
				difficulty: 5,
				lootTable: 'boss_arena',
				connections: ['north', 'south', 'west', 'east'],
			}
		);
	}
}
