import type { BiomeDefinition } from './definitions';

/** Размер тайла в пикселях для процедурных спрайтов. */
const TILE = 32;

const cache = new Map<string, HTMLCanvasElement>();

/**
 * Процедурный спрайт пола биома: базовый цвет с шумовыми разводами.
 * @param biome - Определение биома
 * @param variant - Вариант тайла (0..2)
 * @returns Канвас спрайта (кэшируется)
 */
export function biomeFloorCanvas(
	biome: BiomeDefinition,
	variant: number
): HTMLCanvasElement {
	const key = `${biome.id}:floor:${variant}`;
	const cached = cache.get(key);
	if (cached) return cached;

	const canvas = document.createElement('canvas');
	canvas.width = TILE;
	canvas.height = TILE;
	const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
	const base = biome.palette.floor[variant % biome.palette.floor.length];
	ctx.fillStyle = base;
	ctx.fillRect(0, 0, TILE, TILE);

	// Шумовые разводы и редкие трещины
	let seed = variant * 7919 + biome.id.length * 131;
	const rnd = () => {
		seed = (seed * 1103515245 + 12345) & 0x7fffffff;
		return seed / 0x7fffffff;
	};
	for (let i = 0; i < 40; i++) {
		const x = Math.floor(rnd() * TILE);
		const y = Math.floor(rnd() * TILE);
		const w = 1 + Math.floor(rnd() * 3);
		ctx.fillStyle = `rgba(255,255,255,${0.02 + rnd() * 0.05})`;
		ctx.fillRect(x, y, w, 1);
	}
	ctx.strokeStyle = 'rgba(0,0,0,0.25)';
	ctx.lineWidth = 1;
	ctx.strokeRect(0.5, 0.5, TILE - 1, TILE - 1);

	cache.set(key, canvas);
	return canvas;
}

/**
 * Процедурный спрайт стены биома: блок с верхней подсветкой и кромкой.
 * @param biome - Определение биома
 * @returns Канвас спрайта (кэшируется)
 */
export function biomeWallCanvas(biome: BiomeDefinition): HTMLCanvasElement {
	const key = `${biome.id}:wall`;
	const cached = cache.get(key);
	if (cached) return cached;

	const canvas = document.createElement('canvas');
	canvas.width = TILE;
	canvas.height = TILE;
	const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
	ctx.fillStyle = biome.palette.wall;
	ctx.fillRect(0, 0, TILE, TILE);
	ctx.fillStyle = biome.palette.wallDark;
	ctx.fillRect(0, TILE - 8, TILE, 8);
	ctx.fillStyle = 'rgba(255,255,255,0.18)';
	ctx.fillRect(0, 0, TILE, 4);
	ctx.strokeStyle = 'rgba(0,0,0,0.4)';
	ctx.lineWidth = 1;
	ctx.strokeRect(0.5, 0.5, TILE - 1, TILE - 1);

	cache.set(key, canvas);
	return canvas;
}
