import Entity from '../entities/Entity';
import { Item } from './Item';
import Cooldown from '../components/Cooldown';
import { eventBus } from '../events/EventBus';
import type { Modifier } from './modifiers/Modifier';
import type { ProjectileSpec } from './CastState';
import { freshCastState } from './CastState';

/**
 * Оружие-оболочка: корпус с характеристиками (fireRate, damageMultiplier),
 * СОБСТВЕННЫЙ неизменяемый снаряд и упорядоченные слоты модификаторов.
 *
 * Снаряд нельзя заменить модификаторами: пистолет всегда стреляет пулями,
 * ракетница — ракетами. Модификаторы в слотах изменяют поведение
 * этого снаряда при каждом выстреле (урон, копии, траектория, взрыв, разрушение).
 *
 * Слоты модификаторов принадлежат экземпляру оружия: подобранное оружие
 * приносит свои модификаторы с собой, выброшенное — уносит их.
 */
export abstract class Weapon implements Item {
	abstract id: string;
	abstract name: string;
	type = 'weapon' as const;
	/** Интервал между выстрелами в тиках. */
	abstract fireRate: number;
	/** Ёмкость слотов модификаторов. */
	abstract modifierSlotsCount: number;

	/** Идентификатор собственного снаряда оружия ('bullet', 'laser', …). */
	abstract projectileId: string;
	/** Название собственного снаряда (для UI). */
	abstract projectileName: string;
	/** Базовый урон собственного снаряда. */
	abstract baseDamage: number;
	/** Собственное число снарядов за выстрел (дробовик > 1). */
	shots = 1;
	/** Собственный разброс снарядов веером, радианы. */
	shotSpread = 0;

	/** Множитель урона корпуса: применяется ко всем снарядам выстрела. */
	damageMultiplier = 1;

	/** Перезарядка между выстрелами; длительность синхронизируется с fireRate при выстреле. */
	cooldown = new Cooldown(20);

	private slots: (Modifier | null)[] | null = null;

	/** Слоты модификаторов оружия (лениво создаются под modifierSlotsCount). */
	get modifierSlots(): (Modifier | null)[] {
		if (this.slots === null) {
			this.slots = Array<Modifier | null>(this.modifierSlotsCount).fill(null);
		}
		return this.slots;
	}

	/**
	 * Заполняет слоты стартовым набором модификаторов (конструкторы конкретных оружий).
	 * @param modifiers - Модификаторы по порядку слотов
	 */
	protected setDefaultModifiers(modifiers: Modifier[]): void {
		const slots = this.modifierSlots;
		modifiers.forEach((modifier, i) => {
			if (i < slots.length) {
				slots[i] = modifier;
			}
		});
	}

	/**
	 * Производит выстрел: все модификаторы слотов (по порядку) накапливают
	 * состояние каста, затем собственный снаряд оружия выпускается с учётом
	 * состояния (копии веером, урон, пронзание, волна, взрыв, разрушение).
	 * Эмитит weaponFired со спецификациями снарядов.
	 * @param source - Сущность-источник
	 * @param angle - Угол выстрела в радианах
	 */
	fire(source: Entity, angle: number): void {
		const specs = this.resolveShot(angle);
		if (specs.length > 0) {
			eventBus.emit('weaponFired', { source, specs });
		}
	}

	/**
	 * Разрешает выстрел: сворачивает модификаторы в состояние каста и строит
	 * спецификации снарядов (копии распределяются веером вокруг угла выстрела).
	 * @param angle - Базовый угол выстрела
	 * @returns Спецификации снарядов выстрела
	 */
	private resolveShot(angle: number): ProjectileSpec[] {
		const state = freshCastState();
		for (const modifier of this.modifierSlots) {
			modifier?.applyToCast(state);
		}

		const copies = Math.max(1, this.shots * state.copies);
		const spread = this.shotSpread + state.spread;
		const damage =
			(this.baseDamage + state.damageAdd) *
			state.damageMult *
			this.damageMultiplier;

		const specs: ProjectileSpec[] = [];
		for (let i = 0; i < copies; i++) {
			const offset =
				copies > 1 ? -spread / 2 + (spread * i) / (copies - 1) : 0;
			specs.push({
				projectileId: this.projectileId,
				angle: angle + offset,
				damage,
				pierce: state.pierce,
				wave: state.wave,
				explodeOnHit: state.explodeOnHit,
				destruct: state.destruct,
				homing: state.homing,
			});
		}
		return specs;
	}
}

/**
 * Type guard: проверяет, является ли предмет оружием.
 * @param item - Предмет
 * @returns true, если item.type === 'weapon'
 */
export function isWeapon(item: Item): item is Weapon {
	return item.type === 'weapon';
}
