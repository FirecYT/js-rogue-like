import type { Item } from '../Item';

/**
 * Состояние набираемого «каста»: модификаторы из очереди, ожидающие снаряда.
 * Живёт один цикл разрешения очереди (pullCast).
 */
export interface CastState {
	/** Плоская добавка к урону снаряда. */
	damageAdd: number;
	/** Множитель урона снаряда. */
	damageMult: number;
	/** Снаряд проходит сквозь цели. */
	pierce: boolean;
	/** Синусоидальное отклонение траектории или null. */
	wave: { amplitude: number; frequency: number } | null;
	/**
	 * Мультикаст: сколько копий снаряда породит следующий снаряд-заклинание
	 * и общий угол разброса веера (в радианах). null — одна копия.
	 */
	multicast: { count: number; spread: number } | null;
}

/** Создаёт пустое состояние каста. */
export function freshCastState(): CastState {
	return {
		damageAdd: 0,
		damageMult: 1,
		pierce: false,
		wave: null,
		multicast: null,
	};
}

/**
 * Спецификация снаряда, готовая к материализации в Effect.
 * Результат разрешения очереди заклинаний: система эффектов не знает
 * ни об очереди, ни о модификаторах — только о готовых спецификациях.
 */
export interface ProjectileSpec {
	/** Идентификатор снаряда для фабрики эффектов ('bullet', 'rocket', ...). */
	projectileId: string;
	/** Угол выстрела в радианах (с учётом разброса мультикаста). */
	angle: number;
	/** Итоговый урон (база снаряда + модификаторы + множитель оболочки). */
	damage: number;
	/** Проходит ли сквозь цели. */
	pierce: boolean;
	/** Синусоидальное отклонение или null. */
	wave: { amplitude: number; frequency: number } | null;
}

/**
 * Заклинание — элемент очереди оружия (система в духе Noita).
 * Само является предметом (Item): карточки заклинаний подбираются,
 * переставляются и выбрасываются как обычные предметы.
 *
 * - kind 'projectile': завершает цикл каста и порождает снаряд(ы);
 * - kind 'modifier': накапливается в CastState и consumes следующим снарядом.
 */
export interface Spell extends Item {
	type: 'spell';
	/** Роль заклинания в очереди. */
	kind: 'projectile' | 'modifier';
	/** Описание для тултипа. */
	description: string;

	/**
	 * Модификатор: пополняет состояние каста.
	 * @param state - Набираемое состояние каста
	 */
	applyToCast?(state: CastState): void;

	/**
	 * Снаряд: добавляет спецификации снарядов в результат каста
	 * (несколько — при активном мультикасте).
	 * @param specs - Аккумулятор спецификаций
	 * @param angle - Базовый угол выстрела
	 * @param state - Состояние каста (модификаторы, накопленные до снаряда)
	 * @param damageMultiplier - Множитель урона оболочки оружия
	 */
	emitSpecs?(
		specs: ProjectileSpec[],
		angle: number,
		state: CastState,
		damageMultiplier: number
	): void;
}

/** Type guard: предмет является заклинанием. */
export function isSpell(item: Item): item is Spell {
	return item.type === 'spell';
}

/**
 * Базовая реализация снарядного заклинания: считает урон и разброс мультикаста.
 * Конкретные снаряды задают projectileId и базовый урон.
 */
export abstract class ProjectileSpell implements Spell {
	abstract id: string;
	abstract name: string;
	abstract description: string;
	type = 'spell' as const;
	kind = 'projectile' as const;
	/** Идентификатор снаряда для фабрики эффектов. */
	abstract projectileId: string;
	/** Базовый урон снаряда (до модификаторов). */
	abstract damage: number;

	emitSpecs(
		specs: ProjectileSpec[],
		angle: number,
		state: CastState,
		damageMultiplier: number
	): void {
		const damage = Math.max(
			1,
			Math.floor((this.damage + state.damageAdd) * state.damageMult * damageMultiplier)
		);
		const mc = state.multicast;
		if (!mc || mc.count <= 1) {
			specs.push(this.spec(angle, damage, state));
			return;
		}
		// Веер мультикаста: равномерный разброс вокруг базового угла
		for (let i = 0; i < mc.count; i++) {
			const t = i / (mc.count - 1) - 0.5;
			specs.push(this.spec(angle + t * mc.spread, damage, state));
		}
	}

	private spec(angle: number, damage: number, state: CastState): ProjectileSpec {
		return {
			projectileId: this.projectileId,
			angle,
			damage,
			pierce: state.pierce,
			wave: state.wave,
		};
	}
}

/**
 * Базовая реализация заклинания-модификатора: применяет функцию к состоянию каста.
 */
export abstract class ModifierSpell implements Spell {
	abstract id: string;
	abstract name: string;
	abstract description: string;
	type = 'spell' as const;
	kind = 'modifier' as const;

	abstract applyToCast(state: CastState): void;
}
