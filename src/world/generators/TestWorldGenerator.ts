// world/generators/TestWorldGenerator.ts
import { BaseGenerator } from './BaseGenerator';
import { Chunk, RegionType, TileType, CHUNK_CONFIG } from '../Types';

export class TestWorldGenerator extends BaseGenerator {
  generate(chunkX: number, chunkY: number): Chunk {
    const chunk = this.createEmptyChunk(chunkX, chunkY);
    chunk.regionType = RegionType.VOID; // Using VOID as base for test world

    // Fill the chunk with various tile types for testing
    for (let x = 0; x < CHUNK_CONFIG.SIZE; x++) {
      for (let y = 0; y < CHUNK_CONFIG.SIZE; y++) {
        // Create a pattern that shows all tile types
        const tileIndex = (x + y) % 5;
        
        switch (tileIndex) {
          case 0:
            this.setTile(chunk, x, y, TileType.EMPTY);
            break;
          case 1:
            this.setTile(chunk, x, y, TileType.WALL);
            break;
          case 2:
            this.setTile(chunk, x, y, TileType.ROCK);
            break;
          case 3:
            this.setTile(chunk, x, y, TileType.BUILDING);
            break;
          case 4:
            this.setTile(chunk, x, y, TileType.WATER);
            break;
        }
      }
    }

    // Add some walls in a pattern for visual interest
    for (let x = 2; x < CHUNK_CONFIG.SIZE - 2; x++) {
      for (let y = 2; y < CHUNK_CONFIG.SIZE - 2; y++) {
        if (x % 5 === 0 && y % 5 === 0) {
          this.setTile(chunk, x, y, TileType.WALL);
        }
      }
    }

    return chunk;
  }
}