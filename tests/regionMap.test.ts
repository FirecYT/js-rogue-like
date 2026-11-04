import { describe, it, expect } from 'vitest';
import { RegionMap } from '../src/services/RegionMap';

/**
 * RegionMap: макрораскладка регионов (фиксирована, не зависит от забега).
 * chunkSize 16 × tileSize 32 = 512px на чанк.
 */
describe('RegionMap', () => {
	const map = new RegionMap(16, 32);

	it('спавн — в Void, руины — fallback', () => {
		expect(map.regionAtWorld(0, 0).id).toBe('void_core');
		// Далёкая точка вне всех прямоугольников — руины
		expect(map.regionAtWorld(999999, 999999).id).toBe('ruins');
	});

	it('город вверх от спавна, бункер вправо от города', () => {
		// city: чанки {-20,-70,40×40} → центр около (-10, -50) чанков
		expect(map.regionAtChunk(-10, -50).id).toBe('city');
		// bunker: {80,-70,40×40} → центр около (100, -50)
		expect(map.regionAtChunk(100, -50).id).toBe('bunker');
	});

	it('ледяные поля и стеклянная равнина зеркальны по X', () => {
		// iced_fields {-230,-30,60×60} → центр (-200, 0)
		expect(map.regionAtChunk(-200, 0).id).toBe('iced_fields');
		// glass_plain {170,-30,60×60} → центр (200, 0)
		expect(map.regionAtChunk(200, 0).id).toBe('glass_plain');
	});

	it('южные регионы: кристальные залы под бункером, пепел под льдами', () => {
		// crystal_halls {80,30,40×40} → центр (100, 50)
		expect(map.regionAtChunk(100, 50).id).toBe('crystal_halls');
		// ash_wastes {-230,30,60×60} → центр (-200, 60)
		expect(map.regionAtChunk(-200, 60).id).toBe('ash_wastes');
		// Между бункером и залами (y=0..29) — руины
		expect(map.regionAtChunk(100, 0).id).toBe('ruins');
	});

	it('regionAtWorld согласован с regionAtChunk', () => {
		const wx = -10 * 512 + 256;
		const wy = -50 * 512 + 256;
		expect(map.regionAtWorld(wx, wy).id).toBe('city');
		expect(map.regionCenterWorld('city')).not.toBeNull();
	});
});
