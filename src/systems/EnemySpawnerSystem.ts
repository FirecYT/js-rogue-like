import Enemy from '../entities/Enemy';
import { WorldManager } from '../world/WorldManager';
import Entity from '../entities/Entity';
import GameObject from '../components/GameObject';

export class EnemySpawnerSystem {
	constructor(
		private player: Entity,
		private entities: GameObject[],
		private worldManager: WorldManager,
		private maxEnemies = 10
	) { }

	update() {
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

				const newEnemy = new Enemy(x, y, this.player);
				void newEnemy;
				this.entities.push(newEnemy);
			}
		}
	}
}
