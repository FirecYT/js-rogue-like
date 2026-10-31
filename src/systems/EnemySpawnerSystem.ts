import type { ISystem } from '../core/interfaces';
import { UpdatePhase } from '../core/interfaces';
import type Entity from '../entities/Entity';
import type { WorldService } from '../services/WorldService';
import type { Pathfinder } from '../services/Pathfinder';
import Enemy from '../entities/Enemy';

/**
 * Система спавна врагов: периодически создаёт врагов в случайных проходимых местах
 * вокруг игрока. Каждый враг получает AiController с правильными зависимостями.
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
	 * @param entities - Массив всех сущностей для добавления новых врагов
	 * @param world - Сервис мира для проверки проходимости позиций спавна
	 * @param pathfinder - Система поиска пути для AiController
	 */
	constructor(
		private readonly player: Entity,
		private readonly entities: Entity[],
		private readonly world: WorldService,
		private readonly pathfinder: Pathfinder
	) {}

	/**
	 * Периодически создаёт врагов в случайных проходимых местах вокруг игрока.
	 */
	update(): void {
		this.spawnCooldown--;
		if (this.spawnCooldown > 0) return;
		this.spawnCooldown = EnemySpawnerSystem.SPAWN_INTERVAL;

		// Генерируем случайную позицию в кольце вокруг игрока
		const angle = Math.random() * Math.PI * 2;
		const distance =
			EnemySpawnerSystem.MIN_SPAWN_DISTANCE +
			Math.random() *
				(EnemySpawnerSystem.MAX_SPAWN_DISTANCE -
					EnemySpawnerSystem.MIN_SPAWN_DISTANCE);
		const x = this.player.x + Math.cos(angle) * distance;
		const y = this.player.y + Math.sin(angle) * distance;

		// Проверяем проходимость позиции
		if (!this.world.isPassable(x, y)) return;

		// Создаём врага (контроллер назначается в конструкторе Enemy)
		const enemy = new Enemy(x, y, this.player, this.pathfinder);
		this.entities.push(enemy);
	}

	/**
	 * Освобождение ресурсов (не требуется для этой системы).
	 */
	dispose(): void {
		// Nothing to dispose
	}
}
