import type { ISystem } from '../core/interfaces';
import { UpdatePhase } from '../core/interfaces';
import type { EntityWorld } from '../core/EntityWorld';
import type Entity from '../entities/Entity';
import type { WorldService } from '../services/WorldService';
import type { EntityFactory } from '../services/EntityFactory';
import type { BiomeMap } from '../services/BiomeMap';
import type { BiomeSpawnEntry } from '../content/biomes/definitions';

/** Точка безопасной зоны (торговца): спавн врагов рядом запрещён. */
export interface SafeZone {
	x: number;
	y: number;
	radius: number;
}

/**
 * Спавнер мобов биома: периодически создаёт врагов из таблицы спавна
 * текущей зоны (конвейер сущностей) в проходимых точках кольца вокруг
 * игрока, минуя безопасные зоны торговцев.
 */
export class EnemySpawnerSystem implements ISystem {
	public readonly phase = UpdatePhase.Spawner;
	public enabled = true;

	/** Интервал спавна в кадрах (3 секунды при 60 FPS). */
	private static readonly SPAWN_INTERVAL = 180;
	/** Минимальная дистанция спавна от игрока. */
	private static readonly MIN_SPAWN_DISTANCE = 300;
	/** Максимальная дистанция спавна от игрока. */
	private static readonly MAX_SPAWN_DISTANCE = 500;

	private spawnCooldown = 0;

	/**
	 * @param player - Игрок, вокруг которого спавнятся враги
	 * @param entityWorld - Контейнер сущностей для добавления новых врагов
	 * @param world - Сервис мира для проверки проходимости позиций спавна
	 * @param biomeMap - Карта зон: таблица спавна текущего биома
	 * @param entityFactory - Конвейер сущностей для создания мобов
	 * @param getSafeZones - Безопасные зоны торговцев
	 */
	constructor(
		private readonly player: Entity,
		private readonly entityWorld: EntityWorld,
		private readonly world: WorldService,
		private readonly biomeMap: BiomeMap,
		private readonly entityFactory: EntityFactory,
		private readonly getSafeZones: () => readonly SafeZone[]
	) {}

	/**
	 * Выбирает определение моба текущей зоны по весам и спавнит в кольце.
	 */
	update(): void {
		this.spawnCooldown--;
		if (this.spawnCooldown > 0) return;
		this.spawnCooldown = EnemySpawnerSystem.SPAWN_INTERVAL;

		const biome = this.biomeMap.biomeAtWorld(this.player.x, this.player.y);
		const defId = this.pickSpawn(biome.spawns);
		if (!defId) return;

		for (let attempt = 0; attempt < 6; attempt++) {
			const angle = Math.random() * Math.PI * 2;
			const distance =
				EnemySpawnerSystem.MIN_SPAWN_DISTANCE +
				Math.random() *
					(EnemySpawnerSystem.MAX_SPAWN_DISTANCE -
						EnemySpawnerSystem.MIN_SPAWN_DISTANCE);
			const x = this.player.x + Math.cos(angle) * distance;
			const y = this.player.y + Math.sin(angle) * distance;

			if (!this.world.isPassable(x, y)) continue;
			if (this.inSafeZone(x, y)) continue;

			this.entityFactory.spawn(defId, x, y);
			return;
		}
	}

	/**
	 * Взвешенный выбор определения моба из таблицы биома.
	 * @param spawns - Таблица спавна биома
	 * @returns id определения или null (пустая таблица)
	 */
	private pickSpawn(spawns: BiomeSpawnEntry[]): string | null {
		const total = spawns.reduce((sum, entry) => sum + entry.weight, 0);
		if (total <= 0) return null;
		let roll = Math.random() * total;
		for (const entry of spawns) {
			roll -= entry.weight;
			if (roll <= 0) return entry.defId;
		}
		return spawns[spawns.length - 1].defId;
	}

	/**
	 * Проверяет попадание точки в безопасную зону торговца.
	 * @param x - Координата X
	 * @param y - Координата Y
	 * @returns true, если спавн здесь запрещён
	 */
	private inSafeZone(x: number, y: number): boolean {
		for (const zone of this.getSafeZones()) {
			if (Math.hypot(zone.x - x, zone.y - y) < zone.radius) return true;
		}
		return false;
	}

	/**
	 * Освобождение ресурсов (не требуется).
	 */
	dispose(): void {
		// Nothing to dispose
	}
}
