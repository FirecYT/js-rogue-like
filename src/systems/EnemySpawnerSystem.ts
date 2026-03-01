import Enemy from '../entities/Enemy';
import { WorldManager } from '../world/WorldManager';
import Entity from '../entities/Entity';
import GameObject from '../components/GameObject';

/**
 * Система спавна врагов: с заданной вероятностью создаёт врагов на расстоянии 200–500 от игрока.
 */
export class EnemySpawnerSystem {
	/**
	 * @param player - Игрок (центр для спавна)
	 * @param entities - Массив игровых объектов (куда добавляются враги)
	 * @param worldManager - Мир
	 * @param maxEnemies - Максимальное количество попыток спавна за кадр (по умолчанию 10)
	 */
	constructor(
		private player: Entity,
		private entities: GameObject[],
		private worldManager: WorldManager,
		private maxEnemies = 10
	) { }

	/**
	 * До maxEnemies раз проверяет вероятность спавна (зависит от текущего числа живых врагов); при успехе создаёт Enemy и добавляет в entities.
	 */
	update(): void {
		for (let i = 0; i < this.maxEnemies; i++) {
			const enemyCount = this.entities.filter(
				e => (e instanceof Enemy) && !e.isDead()
			).length;
			const chance = 1 / (enemyCount || 1);

			if (Math.random() < chance ** 3) {
				const angle = Math.random() * Math.PI * 2;
				const distance = 200 + Math.random() * 300;
				const x = this.player.x + Math.cos(angle) * distance;
				const y = this.player.y + Math.sin(angle) * distance;
				this.entities.push(new Enemy(x, y, this.player));
			}
		}
	}
}
