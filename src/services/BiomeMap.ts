import {
	BIOME_DEFINITIONS,
	type BiomeDefinition,
} from '../content/biomes/definitions';

/** Размер зоны в чанках (сторона квадрата). */
const ZONE_CHUNKS = 4;
/** Зоны одного биома группируются в пятна 2×2 зоны. */
const PATCH_ZONES = 2;

/**
 * Карта зон забега: макросетка зон, каждая зона относится к биому из
 * реестра по seed забега. Детерминирована: в пределах забега мир стабилен,
 * между забегами раскладка биомов новая.
 */
export class BiomeMap {
	/** Список биомов для выбора по хешу (порядок реестра). */
	private readonly biomes: BiomeDefinition[];

	/**
	 * @param runSeed - Seed забега (новый на каждую партию)
	 * @param chunkSize - Размер чанка в тайлах
	 * @param tileSize - Размер тайла в пикселях
	 */
	constructor(
		private readonly runSeed: number,
		private readonly chunkSize = 16,
		private readonly tileSize = 32
	) {
		this.biomes = Object.values(BIOME_DEFINITIONS);
	}

	/**
	 * Биом чанка по его координатам.
	 * @param chunkX - Координата чанка X
	 * @param chunkY - Координата чанка Y
	 * @returns Определение биома зоны
	 */
	biomeAtChunk(chunkX: number, chunkY: number): BiomeDefinition {
		const zoneX = Math.floor(chunkX / ZONE_CHUNKS);
		const zoneY = Math.floor(chunkY / ZONE_CHUNKS);
		const patchX = Math.floor(zoneX / PATCH_ZONES);
		const patchY = Math.floor(zoneY / PATCH_ZONES);
		const index =
			this.hash(patchX, patchY) % this.biomes.length;
		return this.biomes[index];
	}

	/**
	 * Биом мировой позиции в пикселях.
	 * @param worldX - Мировая координата X
	 * @param worldY - Мировая координата Y
	 * @returns Определение биома зоны
	 */
	biomeAtWorld(worldX: number, worldY: number): BiomeDefinition {
		const tile = this.tileSize;
		const chunk = this.chunkSize;
		return this.biomeAtChunk(
			Math.floor(worldX / (tile * chunk)),
			Math.floor(worldY / (tile * chunk))
		);
	}

	/**
	 * Координаты зоны мировой позиции (для UX-меток и событий).
	 * @param worldX - Мировая координата X
	 * @param worldY - Мировая координата Y
	 * @returns Пара_zone-координат
	 */
	zoneAtWorld(worldX: number, worldY: number): { x: number; y: number } {
		const tile = this.tileSize;
		const chunk = this.chunkSize;
		return {
			x: Math.floor(Math.floor(worldX / (tile * chunk)) / ZONE_CHUNKS),
			y: Math.floor(Math.floor(worldY / (tile * chunk)) / ZONE_CHUNKS),
		};
	}

	/**
	 * Детерминированный хеш координат пятна зон с seed забега.
	 * @param x - Координата пятна X
	 * @param y - Координата пятна Y
	 * @returns Неотрицательный целочисленный хеш
	 */
	private hash(x: number, y: number): number {
		let h = this.runSeed ^ 0x9e3779b9;
		h = Math.imul(h ^ (x | 0), 0x85ebca6b);
		h = Math.imul(h ^ (y | 0), 0xc2b2ae35);
		h ^= h >>> 15;
		return Math.abs(h | 0);
	}
}
