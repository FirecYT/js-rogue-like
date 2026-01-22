import GameObject from '../components/GameObject';
import FloatingText from '../components/FloatingText';
import { WorldManager } from '../world/WorldManager';
import { CHUNK_CONFIG } from '../world/Types';

type BossConstructor = new (x: number, y: number, target: GameObject, worldManager: WorldManager) => GameObject;

interface BossTrigger {
	triggerX: number;
	triggerY: number;
	spawnX: number;
	spawnY: number;
	bossClass: BossConstructor;
}

export class BossSpawnSystem {
	private spawned = new Set<BossConstructor>();
	private triggers: BossTrigger[];

	constructor(
		private worldManager: WorldManager,
		private entities: GameObject[],
		private player: GameObject,
		private floatingTexts: FloatingText[],
		bossTriggers: BossTrigger[]
	) {
		this.triggers = bossTriggers;
	}

	update() {
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
