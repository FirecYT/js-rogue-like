import { Controller } from './Controller';
import Keyboard from '../components/Keyboard';
import MouseInput from '../components/MouseInput';
import { WorldManager } from '../world/WorldManager';
import Entity from '../entities/Entity';
import { getAngleBetweenPoints } from '../utils';
import { EffectSystem } from '../systems/EffectSystem';

export class PlayerController extends Controller<Entity> {
	constructor(private mouse: MouseInput) {
		super();
	}

	update(entity: Entity, world: WorldManager, effectSystem: EffectSystem): void {
		const keyboard = Keyboard.getInstance();
		let speed = 2;

		if (entity.cooldowns.isReady('dash') && keyboard.isKeyDown('ShiftLeft')) {
			entity.cooldowns.start('dash');
			entity.cooldowns.get('dashActive')?.start();
		}

		if (!entity.cooldowns.get('dashActive')?.isReady()) {
			speed = 4;
		}

		if (keyboard.isKeyDown('KeyW')) entity.y -= speed;
		if (keyboard.isKeyDown('KeyS')) entity.y += speed;
		if (keyboard.isKeyDown('KeyA')) entity.x -= speed;
		if (keyboard.isKeyDown('KeyD')) entity.x += speed;

		// Стрельба
		if (entity.inventory.weapon) {
			const mouseWorldX = this.mouse.x + entity.x - window.innerWidth / 2;
			const mouseWorldY = this.mouse.y + entity.y - window.innerHeight / 2;
			const angle = getAngleBetweenPoints(entity.x, entity.y, mouseWorldX, mouseWorldY);

			if (this.mouse.pressed && entity.cooldowns.isReady('fire')) {
				entity.inventory.fire(angle, effectSystem);
			}
		}

		// Использование чипов
		if (keyboard.isKeyPressedOnce('KeyQ') && entity.inventory.chips[0]) {
			const chip = entity.inventory.chips[0];
			if (chip.isActive && entity.cooldowns.isReady('chip_0')) {
				entity.cooldowns.start('chip_0');
				chip.use?.(entity);
			}
		}
	}
}
