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

	applyToCast(state: CastState): void {
		state.damageAdd += 3;
	}
}

/** Множитель урона снаряда. */
export class DamageMultModifier implements Modifier {
	id = 'mod_damage_mult';
	name = 'Урон ×2';
	type = 'modifier' as const;
	description = 'Урон снаряда оружия удваивается.';

	applyToCast(state: CastState): void {
		state.damageMult *= 2;
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

	applyToCast(state: CastState): void {
		state.wave = { amplitude: 24, frequency: 0.15 };
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
