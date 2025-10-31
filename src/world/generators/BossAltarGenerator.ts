// world/generators/BossAltarGenerator.ts
import { BaseGenerator } from './BaseGenerator';
import { Chunk, TileType, RegionType, CHUNK_CONFIG } from '../Types';

export class BossAltarGenerator extends BaseGenerator {
  generate(chunkX: number, chunkY: number): Chunk {
    const chunk = this.createEmptyChunk(chunkX, chunkY);
    chunk.regionType = RegionType.BOSS_ALTAR;

    // Создаём круговую арену
    this.generateArena(chunk);

    // Алтарь в центре
    const centerX = CHUNK_CONFIG.SIZE / 2;
    const centerY = CHUNK_CONFIG.SIZE / 2;

	for (let x = -1; x <= 1; x++) {
		for (let y = -1; y <= 1; y++) {
			this.setTile(chunk, x + centerX, y + centerY, TileType.BUILDING);
		}
	}

    return chunk;
  }

  private generateArena(chunk: Chunk) {
    const centerX = CHUNK_CONFIG.SIZE / 2;
    const centerY = CHUNK_CONFIG.SIZE / 2;
    const radius = 5;

    // Создаём круг из стен
    for (let x = 0; x < CHUNK_CONFIG.SIZE; x++) {
      for (let y = 0; y < CHUNK_CONFIG.SIZE; y++) {
        const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);

        if (Math.abs(distance - radius) < 0.8) {
          this.setTile(chunk, x, y, TileType.WALL);
        }
      }
    }

    // 4 входа в арену
    this.setTile(chunk, centerX, centerY - radius, TileType.EMPTY);
    this.setTile(chunk, centerX, centerY + radius, TileType.EMPTY);
    this.setTile(chunk, centerX - radius, centerY, TileType.EMPTY);
    this.setTile(chunk, centerX + radius, centerY, TileType.EMPTY);
  }
}
