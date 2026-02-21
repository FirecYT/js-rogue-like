import { ChipPickup } from "./entities/ChipPickup";
import { ModifierPickup } from "./entities/ModifierPickup";
import { PickupItem } from "./entities/PickupItem";
import { WeaponPickup } from "./entities/WeaponPickup";
import { isChip } from "./items/Chip";
import { Item } from "./items/Item";
import { isModifier } from "./items/Modifier";
import { isWeapon } from "./items/Weapon";

export function pir(
	point: {
		x: number;
		y: number;
	},
	rect: {
		x: number;
		y: number;
		width: number;
		height: number;
	}
) {
	return (
		point.x > rect.x &&
		point.y > rect.y &&
		point.x < rect.x + rect.width &&
		point.y < rect.y + rect.height
	);
}

export function interpolateColor(color1: string, color2: string, factor: number): string {
	// Преобразуем hex в RGB
	const hexToRgb = (hex: string) => {
		// Убираем # если есть
		hex = hex.replace(/^#/, '');

		// Если короткая форма (#rgb) - преобразуем в полную (#rrggbb)
		if (hex.length === 3) {
			hex = hex.split('').map(char => char + char).join('');
		}

		const result = /^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);

		if (!result) {
			console.warn(`Invalid hex color: ${hex}`);
			return { r: 0, g: 0, b: 0 };
		}

		return {
			r: parseInt(result[1], 16),
			g: parseInt(result[2], 16),
			b: parseInt(result[3], 16)
		};
	};

	// Преобразуем RGB в hex
	const rgbToHex = (r: number, g: number, b: number) => {
		return '#' + [r, g, b].map(x => {
			const hex = Math.round(x).toString(16);
			return hex.length === 1 ? '0' + hex : hex;
		}).join('');
	};

	const rgb1 = hexToRgb(color1);
	const rgb2 = hexToRgb(color2);

	// Интерполируем каждый канал
	const r = rgb1.r + (rgb2.r - rgb1.r) * factor;
	const g = rgb1.g + (rgb2.g - rgb1.g) * factor;
	const b = rgb1.b + (rgb2.b - rgb1.b) * factor;

	return rgbToHex(r, g, b);
}

export function getAngleBetweenPoints(x1: number, y1: number, x2: number, y2: number): number {
	return Math.atan2(y2 - y1, x2 - x1);
}

export function createPickupFromItem(item: Item, x: number, y: number): PickupItem {
	y += 10;

	if (isWeapon(item)) {
		return new WeaponPickup(x, y, item);
	} else if (isModifier(item)) {
		return new ModifierPickup(x, y, item);
	} else if (isChip(item)) {
		return new ChipPickup(x, y, item);
	}

	throw new TypeError("Undefiend type for item");
}
