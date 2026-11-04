import type { Modifier } from './Modifier';
import type { CastState } from '../CastState';

/**
 * Каталог карт модификаторов. Каждая карта изменяет поведение собственного
 * снаряда оружия; сам снаряд заменить нельзя.
 */

/** Плоская прибавка к урону снаряда. */
export class DamagePlusModifier implements Modifier {
	id = 'mod_damage_plus';
	name = 'Урон +3';
	type = 'modifier' as const;
	description = 'Снаряд оружия получает +3 к урону.';
	/** Прибавка урона (настраивается админ-панелью полигона). */
	public bonus = 3;

	applyToCast(state: CastState): void {
		state.damageAdd += this.bonus;
	}
}

/** Множитель урона снаряда. */
export class DamageMultModifier implements Modifier {
	id = 'mod_damage_mult';
	name = 'Урон ×2';
	type = 'modifier' as const;
	description = 'Урон снаряда оружия удваивается.';
	/** Множитель урона (настраивается админ-панелью полигона). */
	public factor = 2;

	applyToCast(state: CastState): void {
		state.damageMult *= this.factor;
	}
}

/** Пронзание: снаряд не застревает в первой цели. */
export class PierceModifier implements Modifier {
	id = 'mod_pierce';
	name = 'Пронзание';
	type = 'modifier' as const;
	description = 'Снаряд проходит сквозь цели, поражая всех на линии.';

	applyToCast(state: CastState): void {
		state.pierce = true;
	}
}

/** Синусоидальная траектория снаряда. */
export class SinusoidalModifier implements Modifier {
	id = 'mod_sinusoidal';
	name = 'Синусоида';
	type = 'modifier' as const;
	description = 'Траектория снаряда колеблется перпендикулярно курсу.';
	/** Амплитуда волны, px (настраивается админ-панелью полигона). */
	public amplitude = 24;
	/** Частота волны (настраивается админ-панелью полигона). */
	public frequency = 0.15;

	applyToCast(state: CastState): void {
		state.wave = { amplitude: this.amplitude, frequency: this.frequency };
	}
}

/**
 * Мультикаст: снаряд выпускается веером из нескольких копий.
 * Копии от нескольких карт перемножаются, разброс складывается.
 */
export class MulticastModifier implements Modifier {
	id = 'mod_multicast';
	type = 'modifier' as const;

	/**
	 * @param count - Количество копий снаряда
	 * @param spread - Разброс копий веером в радианах
	 */
	constructor(
		public count = 3,
		public spread = 0.4,
		public name = `Мультикаст ×${count}`,
		public description = `Снаряд выпускается веером из ${count} копий.`
	) {}

	applyToCast(state: CastState): void {
		state.copies *= this.count;
		state.spread += this.spread;
	}
}

/** Взрыв при пронзании цели и в конце полёта снаряда. */
export class ExplosiveEndModifier implements Modifier {
	id = 'mod_explosive_end';
	name = 'Разрывной снаряд';
	type = 'modifier' as const;
	description = 'Снаряд взрывается при пронзании цели и в конце полёта.';

	applyToCast(state: CastState): void {
		state.explodeOnHit = true;
	}
}

/** Снаряд разрушает непроходимые тайлы (стены, укрытия) на своём пути. */
export class DestructModifier implements Modifier {
	id = 'mod_destruct';
	name = 'Разрушение';
	type = 'modifier' as const;
	description = 'Снаряд разрушает стены и укрытия на своём пути.';

	applyToCast(state: CastState): void {
		state.destruct = true;
	}
}

/** Самонаведение: снаряд доворачивает курс к ближайшей враждебной цели. */
export class HomingModifier implements Modifier {
	id = 'mod_homing';
	name = 'Самонаведение';
	type = 'modifier' as const;
	description = 'Снаряд доворачивает курс к ближайшей враждебной цели.';

	applyToCast(state: CastState): void {
		state.homing = true;
	}
}

/** Расщепление: широкий веер из трёх копий снаряда. */
export class SplitModifier implements Modifier {
	id = 'mod_split';
	name = 'Расщепление';
	type = 'modifier' as const;
	description = 'Снаряд расщепляется на три копии в широком веере.';
	/** Число копий (настраивается админ-панелью полигона). */
	public count = 3;
	/** Разброс веера, радианы (настраивается админ-панелью полигона). */
	public spread = 1.4;

	applyToCast(state: CastState): void {
		state.copies *= this.count;
		state.spread += this.spread;
	}
}
