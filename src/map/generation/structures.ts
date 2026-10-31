import type { RegionRect } from '../../content/regions/definitions';

/**
 * Кольцо алтарной платформы: квадратная стена вокруг центра региона.
 * @param gx - Глобальный тайл X
 * @param gy - Глобальный тайл Y
 * @param cx - Центр платформы X
 * @param cy - Центр платформы Y
 * @param radius - Полуширина кольца (Chebyshev)
 * @returns true, если тайл — стена кольца
 */
export function platformWallAt(
	gx: number,
	gy: number,
	cx: number,
	cy: number,
	radius = 5
): boolean {
	const dx = Math.abs(gx - cx);
	const dy = Math.abs(gy - cy);
	if (Math.max(dx, dy) !== radius) return false;
	// Вход с юга: три тайла без стены
	if (dy === radius && dx <= 1) return false;
	return true;
}

/**
 * Центр прямоугольника региона в тайлах.
 * @param rect - Прямоугольник региона в чанках
 * @returns Координаты центрального тайла
 */
export function regionCenterTile(rect: RegionRect): { x: number; y: number } {
	return {
		x: Math.floor((rect.x + rect.w / 2) * 16),
		y: Math.floor((rect.y + rect.h / 2) * 16),
	};
}
