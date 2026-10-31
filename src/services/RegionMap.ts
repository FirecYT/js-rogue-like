import {
	REGION_DEFINITIONS,
	REGION_ORDER,
	type RegionDefinition,
} from '../content/regions/definitions';

/**
 * Карта регионов мира: макрораскладка прямоугольников чанков относительно
 * чанка спавна (декларативный реестр REGION_DEFINITIONS). Детерминирована
 * и стабильна: регион чанка не зависит от забега.
 */
export class RegionMap {
	/**
	 * @param chunkSize - Размер чанка в тайлах
	 * @param tileSize - Размер тайла в пикселях
	 */
	constructor(
		private readonly chunkSize = 16,
		private readonly tileSize = 32
	) {}

	/** Регион чанка по его координатам (первый подходящий прямоугольник). */
	regionAtChunk(chunkX: number, chunkY: number): RegionDefinition {
		for (const id of REGION_ORDER) {
			const def = REGION_DEFINITIONS[id];
			const rect = def.rect;
			if (!rect) continue;
			if (
				chunkX >= rect.x &&
				chunkX < rect.x + rect.w &&
				chunkY >= rect.y &&
				chunkY < rect.y + rect.h
			) {
				return def;
			}
		}
		return REGION_DEFINITIONS.ruins;
	}

	/** Регион мировой позиции в пикселях. */
	regionAtWorld(worldX: number, worldY: number): RegionDefinition {
		const chunkPixel = this.tileSize * this.chunkSize;
		return this.regionAtChunk(
			Math.floor(worldX / chunkPixel),
			Math.floor(worldY / chunkPixel)
		);
	}

	/** Центр прямоугольника региона в мировых координатах (для структур). */
	regionCenterWorld(id: string): { x: number; y: number } | null {
		const def = REGION_DEFINITIONS[id];
		const rect = def.rect;
		if (!rect) return null;
		const chunkPixel = this.tileSize * this.chunkSize;
		return {
			x: (rect.x + rect.w / 2) * chunkPixel,
			y: (rect.y + rect.h / 2) * chunkPixel,
		};
	}
}
