import type Entity from '../entities/Entity';
import type Player from '../Player';
import { WeaponPickup } from '../entities/WeaponPickup';
import { ModifierPickup } from '../entities/ModifierPickup';
import { ChipPickup } from '../entities/ChipPickup';
import { TrainingDummy } from '../entities/TrainingDummy';
import { ShotgunWeapon } from '../items/weapons/ShotgunWeapon';
import { LaserGunWeapon } from '../items/weapons/LaserGunWeapon';
import { RocketLauncherWeapon } from '../items/weapons/RocketLauncherWeapon';
import { FlamethrowerWeapon } from '../items/weapons/FlamethrowerWeapon';
import { DamageBoostModifier } from '../items/modifiers/DamageBoostModifier';
import { PierceModifier } from '../items/modifiers/PierceModifier';
import { SinusoidalModifier } from '../items/modifiers/SinusoidalModifier';
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
 * Наполняет мир тестовым контентом: всё оружие, модификаторы, чипы и манекены
 * раскладываются рядом со спавном игрока; выдаёт игроку тестовый стартовый набор.
 * @param entities - Массив сущностей мира (пикапы и манекены добавляются в него)
 * @param player - Игрок (получает стартовые чипы и модификатор)
 */
export function populatePlayground(entities: Entity[], player: Player): void {
	// Тестовый стартовый набор игрока
	player.inventory.addModifier(new DamageBoostModifier(2.0));
	player.inventory.addChip(new TeleportChip());
	player.inventory.addChip(new DashChip());
	player.inventory.addChip(new RebirthChip());

	// Все виды оружия
	entities.push(new WeaponPickup(800, 0, new ShotgunWeapon()));
	entities.push(new WeaponPickup(800, 50, new LaserGunWeapon()));
	entities.push(new WeaponPickup(800, 100, new RocketLauncherWeapon()));
	entities.push(new WeaponPickup(800, 150, new FlamethrowerWeapon()));

	// Все модификаторы
	entities.push(new ModifierPickup(600, 0, new DamageBoostModifier(2.0)));
	entities.push(new ModifierPickup(600, 50, new PierceModifier()));
	entities.push(new ModifierPickup(600, 100, new SinusoidalModifier()));

	// Чипы
	entities.push(new ChipPickup(700, 0, new TeleportChip()));
	entities.push(new ChipPickup(700, 50, new DashChip()));

	// Манекены для проверки урона
	entities.push(new TrainingDummy(400, 0, 100));
	entities.push(new TrainingDummy(400, 50, 50));
	entities.push(new TrainingDummy(400, 100, 200));

	// Тестовая катсцена (запускается через 2 секунды)
	setTimeout(() => {
		eventBus.emit('cutsceneStart', {
			lines: [
				'Добро пожаловать в тестовую зону!',
				'Здесь вы можете испытать всё оружие и модификаторы.',
				'Стреляйте по манекенам, подбирайте предметы, используйте чипы.',
				'Удачи!',
			],
		});
	}, 2000);
}
