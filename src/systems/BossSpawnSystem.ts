import GameObject from '../components/GameObject';
import FloatingText from '../components/FloatingText';
import { WorldManager } from '../world/WorldManager';
import { CHUNK_CONFIG } from '../world/Types';

/** Конструктор босса: (x, y, target, worldManager) => GameObject */
type BossConstructor = new (x: number, y: number, target: GameObject, worldManager: WorldManager) => GameObject;

/** Триггер появления босса: координаты триггера, точка спавна и класс босса */
interface BossTrigger {
	triggerX: number;
	triggerY: number;
	spawnX: number;
	spawnY: number;
	bossClass: BossConstructor;
}

/**
 * Система появления боссов: при приближении игрока к точке триггера создаётся босс и добавляется в entities.
 */
export class BossSpawnSystem {
	private spawned = new Set<BossConstructor>();
	private triggers: BossTrigger[];

	/**
	 * @param worldManager - Мир
	 * @param entities - Массив игровых объектов (куда добавляется босс)
	 * @param player - Игрок (цель для босса)
	 * @param floatingTexts - Массив всплывающих текстов (для сообщения о появлении)
	 * @param bossTriggers - Конфигурация триггеров
	 */
	constructor(
		private worldManager: WorldManager,
		private entities: GameObject[],
		private player: GameObject,
		private floatingTexts: FloatingText[],
		bossTriggers: BossTrigger[]
	) {
		this.triggers = bossTriggers;
	}

	/**
	 * Проверяет триггеры: если игрок в радиусе 300 от точки триггера и босс ещё не спавнился — создаёт босса и добавляет текст.
	 */
	update(): void {
		for (const trigger of this.triggers) {
			if (this.spawned.has(trigger.bossClass)) continue;

			const distX = Math.abs(
				this.player.x - trigger.triggerX * CHUNK_CONFIG.FULL_SIZE - CHUNK_CONFIG.HALF_SIZE
			);
			const distY = Math.abs(
				this.player.y - trigger.triggerY * CHUNK_CONFIG.FULL_SIZE - CHUNK_CONFIG.HALF_SIZE
			);

			if (distX < 300 && distY < 300) {
				const boss = new trigger.bossClass(
					trigger.spawnX * CHUNK_CONFIG.FULL_SIZE - CHUNK_CONFIG.HALF_SIZE,
					trigger.spawnY * CHUNK_CONFIG.FULL_SIZE - CHUNK_CONFIG.HALF_SIZE,
					this.player,
					this.worldManager
				);
				this.entities.push(boss);
				this.floatingTexts.push(new FloatingText(this.player.x, this.player.y, 'BOSS APPEARED!', 180));
				this.spawned.add(trigger.bossClass);
			}
		}
	}
}
