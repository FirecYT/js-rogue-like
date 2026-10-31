import type Entity from '../entities/Entity';

/**
 * Вариант улучшения, предлагаемый при повышении уровня.
 * Контент отделён от систем: новые улучшения добавляются сюда данными.
 */
export interface UpgradeOption {
	/** Стабильный идентификатор (для сохранений/статистики в будущем). */
	id: string;
	/** Текст кнопки в окне повышения уровня. */
	label: string;
	/** Применяет улучшение к сущности. */
	apply(entity: Entity): void;
}

/**
 * Пул улучшений уровня.
 */
export const LEVEL_UP_UPGRADES: readonly UpgradeOption[] = [
	{
		id: 'weapon_damage',
		label: 'Урон оружия +15%',
		apply: (entity) => {
			const weapon = entity.inventory.weapon;
			if (weapon) {
				weapon.damage = Math.max(1, Math.round(weapon.damage * 1.15));
			}
		},
	},
	{
		id: 'weapon_speed',
		label: 'Перезарядка оружия −10%',
		apply: (entity) => {
			const weapon = entity.inventory.weapon;
			if (!weapon) return;
			weapon.fireRate = Math.max(3, Math.round(weapon.fireRate * 0.9));
			weapon.cooldown.setDuration(weapon.fireRate);
		},
	},
	{
		id: 'max_health',
		label: 'Здоровье +50',
		apply: (entity) => {
			entity.maxHP += 50;
			entity.heal(50);
		},
	},
];
