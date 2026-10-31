import { ProjectileSpell } from './Spell';

/** Обычная пуля: быстрый прямой снаряд. */
export class BulletSpell extends ProjectileSpell {
	id = 'spell_bullet';
	name = 'Пуля';
	description = 'Быстрый прямой снаряд.';
	projectileId = 'bullet';
	damage = 5;
}

/** Тяжёлая пуля: медленнее, больнее. */
export class HeavyBulletSpell extends ProjectileSpell {
	id = 'spell_heavy_bullet';
	name = 'Тяжёлая пуля';
	description = 'Медленный, но мощный снаряд.';
	projectileId = 'bullet';
	damage = 12;
}

/** Ракета: летит и детонирует с уроном по площади. */
export class RocketSpell extends ProjectileSpell {
	id = 'spell_rocket';
	name = 'Ракета';
	description = 'Летит до столкновения и взрывается по площади.';
	projectileId = 'rocket';
	damage = 15;
}

/** Лазерный луч: мгновенно поражает линию. */
export class LaserSpell extends ProjectileSpell {
	id = 'spell_laser';
	name = 'Лазерный луч';
	description = 'Мгновенный луч, поражающий всех на линии.';
	projectileId = 'laser';
	damage = 25;
}

/** Огненная зона: область с периодическим уроном. */
export class FireZoneSpell extends ProjectileSpell {
	id = 'spell_fire_zone';
	name = 'Огненная зона';
	description = 'Создаёт зону огня с периодическим уроном.';
	projectileId = 'fire_zone';
	damage = 3;
}
