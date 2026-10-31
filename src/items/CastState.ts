/**
 * Состояние каста: накапливается модификаторами оружия и применяется
 * к собственному снаряду оружия при выстреле. Снаряд нельзя заменить —
 * можно изменить только его поведение (урон, копии, траектория, взрыв…).
 */
export interface CastState {
	/** Плоская прибавка к урону снаряда. */
	damageAdd: number;
	/** Множитель урона снаряда. */
	damageMult: number;
	/** Снаряд проходит сквозь цели. */
	pierce: boolean;
	/** Параметры синусоидального смещения траектории (null — без волны). */
	wave: { amplitude: number; frequency: number } | null;
	/** Множитель числа копий снаряда (мультикаст). */
	copies: number;
	/** Добавочный разброс копий веером, радианы. */
	spread: number;
	/** Взрыв при пронзании цели и в конце полёта. */
	explodeOnHit: boolean;
	/** Снаряд разрушает непроходимые тайлы на своём пути. */
	destruct: boolean;
}

/**
 * Создаёт нейтральное состояние каста (единичные множители, без эффектов).
 */
export function freshCastState(): CastState {
	return {
		damageAdd: 0,
		damageMult: 1,
		pierce: false,
		wave: null,
		copies: 1,
		spread: 0,
		explodeOnHit: false,
		destruct: false,
	};
}

/**
 * Спецификация снаряда: единственный контракт между разрешением выстрела
 * (Weapon) и материализацией эффектов (EffectSystem).
 */
export interface ProjectileSpec {
	/** Идентификатор снаряда оружия ('bullet', 'laser', 'rocket', 'fire_zone'). */
	projectileId: string;
	/** Угол полёта в радианах. */
	angle: number;
	/** Итоговый урон. */
	damage: number;
	/** Пронзание целей. */
	pierce: boolean;
	/** Синусоидальное смещение траектории (null — прямая). */
	wave: { amplitude: number; frequency: number } | null;
	/** Взрыв при пронзании и в конце полёта. */
	explodeOnHit: boolean;
	/** Разрушение тайлов на пути. */
	destruct: boolean;
}
