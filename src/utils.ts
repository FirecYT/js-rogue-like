import { ChipPickup } from './entities/ChipPickup';
import { ModifierPickup } from './entities/ModifierPickup';
import { PickupItem } from './entities/PickupItem';
import { WeaponPickup } from './entities/WeaponPickup';
import { isChip } from './items/Chip';
import { Item } from './items/Item';
import { isModifier } from './items/modifiers/Modifier';
import { isWeapon } from './items/Weapon';

/**
 * Линейная интерполяция между двумя цветами в формате HEX.
 * @param color1 - Первый цвет (например, '#ff0000')
 * @param color2 - Второй цвет
 * @param factor - Коэффициент от 0 до 1 (0 = color1, 1 = color2)
 * @returns Цвет в формате '#rrggbb'
 */
export function interpolateColor(
	color1: string,
	color2: string,
	factor: number
): string {
	const hexToRgb = (hex: string) => {
		hex = hex.replace(/^#/, '');
		if (hex.length === 3) {
			hex = hex
				.split('')
				.map((char) => char + char)
				.join('');
		}
		const result = /^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
		if (!result) {
			console.warn(`Invalid hex color: ${hex}`);
			return { r: 0, g: 0, b: 0 };
		}
		return {
			r: parseInt(result[1], 16),
			g: parseInt(result[2], 16),
			b: parseInt(result[3], 16),
		};
	};

	const rgbToHex = (r: number, g: number, b: number) => {
		return (
			'#' +
			[r, g, b]
				.map((x) => {
					const hex = Math.round(x).toString(16);
					return hex.length === 1 ? '0' + hex : hex;
				})
				.join('')
		);
	};

	const rgb1 = hexToRgb(color1);
	const rgb2 = hexToRgb(color2);
	const r = rgb1.r + (rgb2.r - rgb1.r) * factor;
	const g = rgb1.g + (rgb2.g - rgb1.g) * factor;
	const b = rgb1.b + (rgb2.b - rgb1.b) * factor;
	return rgbToHex(r, g, b);
}

/**
 * Создаёт объект подбираемого предмета (PickupItem) по типу предмета и координатам.
 * @param item - Предмет (оружие, заклинание или чип)
 * @param x - Мировая координата X
 * @param y - Мировая координата Y
 * @returns Экземпляр WeaponPickup, ModifierPickup или ChipPickup
 * @throws TypeError если тип предмета не распознан
 */
export function createPickupFromItem(
	item: Item,
	x: number,
	y: number
): PickupItem {
	y += 10;
	if (isWeapon(item)) {
		return new WeaponPickup(x, y, item);
	} else if (isModifier(item)) {
		return new ModifierPickup(x, y, item);
	} else if (isChip(item)) {
		return new ChipPickup(x, y, item);
	}
	throw new TypeError('Неизвестный тип предмета');
}
