import type { EntityWorld } from '../core/EntityWorld';
import type Player from '../Player';
import type { EntityFactory } from '../services/EntityFactory';
import { Altar } from '../entities/Altar';
import { WeaponPickup } from '../entities/WeaponPickup';
import { ModifierPickup } from '../entities/ModifierPickup';
import { ChipPickup } from '../entities/ChipPickup';
import { TrainingDummy } from '../entities/TrainingDummy';
import { ShotgunWeapon } from '../items/weapons/ShotgunWeapon';
import { LaserGunWeapon } from '../items/weapons/LaserGunWeapon';
import { RocketLauncherWeapon } from '../items/weapons/RocketLauncherWeapon';
import { FlamethrowerWeapon } from '../items/weapons/FlamethrowerWeapon';
import { MinigunWeapon } from '../items/weapons/MinigunWeapon';
import { RailgunWeapon } from '../items/weapons/RailgunWeapon';
import { PlasmaRifleWeapon } from '../items/weapons/PlasmaRifleWeapon';
import {
	DamageMultModifier,
	PierceModifier,
	SinusoidalModifier,
	MulticastModifier,
	ExplosiveEndModifier,
	DestructModifier,
	HomingModifier,
	SplitModifier,
} from '../items/modifiers/catalog';
import { TeleportChip } from '../items/chips/TeleportChip';
import { DashChip } from '../items/chips/DashChip';
import { RebirthChip } from '../items/chips/RebirthChip';
import { HealChip } from '../items/chips/HealChip';
import { ShieldChip } from '../items/chips/ShieldChip';
import { NovaChip } from '../items/chips/NovaChip';
import { Medic } from '../entities/Medic';
import { Campfire } from '../entities/Campfire';
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
 * @param entityFactory - Конвейер сущностей для мобов и алтаря
 */
export function populatePlayground(
	entityWorld: EntityWorld,
	player: Player,
	entityFactory: EntityFactory
): void {
	// Тестовый стартовый набор игрока
	player.inventory.addChip(new TeleportChip());
	player.inventory.addChip(new DashChip());
	player.inventory.addChip(new RebirthChip());

	// Все виды оружия
	entityWorld.spawn(new WeaponPickup(800, 0, new ShotgunWeapon()));
	entityWorld.spawn(new WeaponPickup(800, 50, new LaserGunWeapon()));
	entityWorld.spawn(new WeaponPickup(800, 100, new RocketLauncherWeapon()));
	entityWorld.spawn(new WeaponPickup(800, 150, new FlamethrowerWeapon()));
	entityWorld.spawn(new WeaponPickup(800, 200, new MinigunWeapon()));
	entityWorld.spawn(new WeaponPickup(800, 250, new RailgunWeapon()));
	entityWorld.spawn(new WeaponPickup(800, 300, new PlasmaRifleWeapon()));

	// Карты модификаторов
	entityWorld.spawn(new ModifierPickup(600, 0, new DamageMultModifier()));
	entityWorld.spawn(new ModifierPickup(600, 50, new PierceModifier()));
	entityWorld.spawn(new ModifierPickup(600, 100, new SinusoidalModifier()));
	entityWorld.spawn(new ModifierPickup(600, 150, new MulticastModifier(3, 0.4)));
	entityWorld.spawn(new ModifierPickup(600, 200, new ExplosiveEndModifier()));
	entityWorld.spawn(new ModifierPickup(600, 250, new DestructModifier()));
	entityWorld.spawn(new ModifierPickup(600, 300, new HomingModifier()));
	entityWorld.spawn(new ModifierPickup(600, 350, new SplitModifier()));

	// Чипы
	entityWorld.spawn(new ChipPickup(700, 0, new TeleportChip()));
	entityWorld.spawn(new ChipPickup(700, 50, new DashChip()));
	entityWorld.spawn(new ChipPickup(700, 100, new HealChip()));
	entityWorld.spawn(new ChipPickup(700, 150, new ShieldChip()));
	entityWorld.spawn(new ChipPickup(700, 200, new NovaChip()));

	// Конвейер сущностей: мобы и алтарь с боссом-эталоном
	entityFactory.spawn('rust_grunt', 900, 250);
	entityFactory.spawn('rust_grunt', 950, 300);
	entityFactory.spawn('scrap_hound', 1050, 250);
	entityFactory.spawn('crystal_sentinel', 1050, 350);
	entityFactory.spawn('cinder_mite', 1500, 600);
	entityFactory.spawn('scavenger', 300, 350);
	entityWorld.spawn(new Altar(500, 250, 'rust_worm', entityFactory));
	entityWorld.spawn(new Altar(150, 650, 'scrap_tyrant', entityFactory));
	entityWorld.spawn(new Altar(900, 700, 'crystal_serpent', entityFactory));

	// Мирные структуры: медик и костёр
	entityWorld.spawn(new Medic(430, 170));
	entityWorld.spawn(new Campfire(250, -150, entityWorld));

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
