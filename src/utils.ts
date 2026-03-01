import { ChipPickup } from "./entities/ChipPickup";
import { ModifierPickup } from "./entities/ModifierPickup";
import { PickupItem } from "./entities/PickupItem";
import { WeaponPickup } from "./entities/WeaponPickup";
import { isChip } from "./items/Chip";
import { Item } from "./items/Item";
import { isModifier } from "./items/Modifier";
import { isWeapon } from "./items/Weapon";

/**
 * Проверяет, находится ли точка внутри прямоугольника.
 * @param point - Точка с координатами x, y
 * @param rect - Прямоугольник с полями x, y, width, height
 * @returns true, если точка внутри прямоугольника (включая границы)
 */
export function pir(
	point: { x: number; y: number },
	rect: { x: number; y: number; width: number; height: number }
): boolean {
	return (
		point.x > rect.x &&
		point.y > rect.y &&
		point.x < rect.x + rect.width &&
		point.y < rect.y + rect.height
	);
}

/**
 * Линейная интерполяция между двумя цветами в формате HEX.
 * @param color1 - Первый цвет (например, '#ff0000')
 * @param color2 - Второй цвет
 * @param factor - Коэффициент от 0 до 1 (0 = color1, 1 = color2)
 * @returns Цвет в формате '#rrggbb'
 */
export function interpolateColor(color1: string, color2: string, factor: number): string {
	const hexToRgb = (hex: string) => {
		hex = hex.replace(/^#/, '');
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

	const rgbToHex = (r: number, g: number, b: number) => {
		return '#' + [r, g, b].map(x => {
			const hex = Math.round(x).toString(16);
			return hex.length === 1 ? '0' + hex : hex;
		}).join('');
	};

	const rgb1 = hexToRgb(color1);
	const rgb2 = hexToRgb(color2);
	const r = rgb1.r + (rgb2.r - rgb1.r) * factor;
	const g = rgb1.g + (rgb2.g - rgb1.g) * factor;
	const b = rgb1.b + (rgb2.b - rgb1.b) * factor;
	return rgbToHex(r, g, b);
}

/**
 * Вычисляет угол (в радианах) от точки (x1, y1) к точке (x2, y2).
 * @param x1 - X первой точки
 * @param y1 - Y первой точки
 * @param x2 - X второй точки
 * @param y2 - Y второй точки
 * @returns Угол в радианах (результат Math.atan2)
 */
export function getAngleBetweenPoints(x1: number, y1: number, x2: number, y2: number): number {
	return Math.atan2(y2 - y1, x2 - x1);
}

/**
 * Создаёт объект подбираемого предмета (PickupItem) по типу предмета и координатам.
 * @param item - Предмет (оружие, модификатор или чип)
 * @param x - Мировая координата X
 * @param y - Мировая координата Y
 * @returns Экземпляр WeaponPickup, ModifierPickup или ChipPickup
 * @throws TypeError если тип предмета не распознан
 */
export function createPickupFromItem(item: Item, x: number, y: number): PickupItem {
	y += 10;
	if (isWeapon(item)) {
		return new WeaponPickup(x, y, item);
	} else if (isModifier(item)) {
		return new ModifierPickup(x, y, item);
	} else if (isChip(item)) {
		return new ChipPickup(x, y, item);
	}
	throw new TypeError("Неизвестный тип предмета");
}

/**
 * Возвращает функцию-заменитель для JSON.stringify, заменяющую циклические ссылки на строку "[Circular]".
 * @returns Функция (key, value) для использования как replacer в JSON.stringify
 */
export function getCircularReplacer(): (this: object, key: string, value: object) => unknown {
	const ancestors: object[] = [];
	return function (this: object, key: string, value: object) {
		if (typeof value !== "object" || value === null) {
			return value;
		}
		while (ancestors.length > 0 && ancestors.at(-1) !== this) {
			ancestors.pop();
		}
		if (ancestors.includes(value)) {
			return "[Circular]";
		}
		ancestors.push(value);
		return value;
	};
}
