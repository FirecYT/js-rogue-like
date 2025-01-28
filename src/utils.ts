export function pir(
	point: {
		x: number,
		y: number
	},
	rect: {
		x: number,
		y: number,
		width: number,
		height: number
	}
) {
	return point.x > rect.x &&
		point.y > rect.y &&
		point.x < rect.x + rect.width &&
		point.y < rect.y + rect.height;
}
