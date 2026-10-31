import type { EntityWorld } from '../core/EntityWorld';
import type Player from '../Player';
import { WeaponPickup } from '../entities/WeaponPickup';
import { SpellPickup } from '../entities/SpellPickup';
import { ChipPickup } from '../entities/ChipPickup';
import { TrainingDummy } from '../entities/TrainingDummy';
import { ShotgunWeapon } from '../items/weapons/ShotgunWeapon';
import { LaserGunWeapon } from '../items/weapons/LaserGunWeapon';
import { RocketLauncherWeapon } from '../items/weapons/RocketLauncherWeapon';
import { FlamethrowerWeapon } from '../items/weapons/FlamethrowerWeapon';
import {
	DamageMultSpell,
	PierceSpell,
	SinusoidalSpell,
	MulticastSpell,
} from '../items/spells/modifiers';
import { HeavyBulletSpell } from '../items/spells/projectiles';
import { TeleportChip } from '../items/chips/TeleportChip';
import { DashChip } from '../items/chips/DashChip';
import { RebirthChip } from '../items/chips/RebirthChip';
import { eventBus } from '../events/EventBus';

/**
 * Отладочный полигон: тестовые пикапы, манекены и стартовый набор предметов.
 * Включается параметром строки URL `?playground` и НЕ является частью
 * боевой сборки игры — production-фабрика создаёт только игрока с пистолетом.
 */

/**
 * Проверяет, запрошен ли отладочный полигон через URL (?playground).
 */
export function isPlaygroundEnabled(): boolean {
	return new URLSearchParams(window.location.search).has('playground');
}

/**
 * Наполняет мир тестовым контентом: всё оружие, заклинания, чипы и манекены
 * раскладываются рядом со спавном игрока; выдаёт игроку тестовый стартовый набор.
 * @param entityWorld - Контейнер сущностей мира
 * @param player - Игрок (получает стартовые чипы)
 */
export function populatePlayground(entityWorld: EntityWorld, player: Player): void {
	// Тестовый стартовый набор игрока
	player.inventory.addChip(new TeleportChip());
	player.inventory.addChip(new DashChip());
	player.inventory.addChip(new RebirthChip());

	// Все виды оружия
	entityWorld.spawn(new WeaponPickup(800, 0, new ShotgunWeapon()));
	entityWorld.spawn(new WeaponPickup(800, 50, new LaserGunWeapon()));
	entityWorld.spawn(new WeaponPickup(800, 100, new RocketLauncherWeapon()));
	entityWorld.spawn(new WeaponPickup(800, 150, new FlamethrowerWeapon()));

	// Заклинания-модификаторы и снаряды
	entityWorld.spawn(new SpellPickup(600, 0, new DamageMultSpell()));
	entityWorld.spawn(new SpellPickup(600, 50, new PierceSpell()));
	entityWorld.spawn(new SpellPickup(600, 100, new SinusoidalSpell()));
	entityWorld.spawn(new SpellPickup(600, 150, new MulticastSpell(3, 0.4)));
	entityWorld.spawn(new SpellPickup(600, 200, new HeavyBulletSpell()));

	// Чипы
	entityWorld.spawn(new ChipPickup(700, 0, new TeleportChip()));
	entityWorld.spawn(new ChipPickup(700, 50, new DashChip()));

	// Манекены для проверки урона
	entityWorld.spawn(new TrainingDummy(400, 0, 100));
	entityWorld.spawn(new TrainingDummy(400, 50, 50));
	entityWorld.spawn(new TrainingDummy(400, 100, 200));

	// Тестовая катсцена (запускается через 2 секунды)
	setTimeout(() => {
		eventBus.emit('cutsceneStart', {
			lines: [
				'Добро пожаловать в тестовую зону!',
				'Здесь вы можете испытать всё оружие и заклинания.',
				'Стреляйте по манекенам, подбирайте предметы, используйте чипы.',
				'Удачи!',
			],
		});
	}, 2000);
}
