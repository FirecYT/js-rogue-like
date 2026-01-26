import { Controller } from './Controller';
import Keyboard from '../components/Keyboard';
import MouseInput from '../components/MouseInput';
import { WorldManager } from '../world/WorldManager';
import Entity from '../entities/Entity';
import { getAngleBetweenPoints } from '../utils';
import { EffectSystem } from '../systems/EffectSystem';

export class PlayerController extends Controller {
	constructor(private mouse: MouseInput) {
		super();
	}

	update(entity: Entity, world: WorldManager, effectSystem: EffectSystem): void {
		const keyboard = Keyboard.getInstance();
		const speed = entity.speed;

		if (keyboard.isKeyDown('ShiftLeft')) {
			const dashChipIndex = entity.inventory.chips.findIndex(chip => chip?.id === 'dash');
			if (dashChipIndex !== -1 && entity.inventory.isChipReady(dashChipIndex)) {
				entity.inventory.useChip(dashChipIndex);
			}
		}

		if (keyboard.isKeyDown('KeyW')) entity.y -= speed;
		if (keyboard.isKeyDown('KeyS')) entity.y += speed;
		if (keyboard.isKeyDown('KeyA')) entity.x -= speed;
		if (keyboard.isKeyDown('KeyD')) entity.x += speed;

		if (entity.inventory.weapon) {
			const mouseWorldX = this.mouse.x + entity.x - window.innerWidth / 2;
			const mouseWorldY = this.mouse.y + entity.y - window.innerHeight / 2;
			const angle = getAngleBetweenPoints(entity.x, entity.y, mouseWorldX, mouseWorldY);

			if (this.mouse.pressed && entity.inventory.isWeaponReady()) {
				entity.inventory.fire(angle, effectSystem);
			}
		}

		if (keyboard.isKeyPressedOnce('KeyQ') && entity.inventory.chips[0]) {
			entity.inventory.useChip(0);
		} else if (keyboard.isKeyPressedOnce('Digit1') && entity.inventory.chips[0]) {
			entity.inventory.useChip(0);
		} else if (keyboard.isKeyPressedOnce('Digit2') && entity.inventory.chips[1]) {
			entity.inventory.useChip(1);
		} else if (keyboard.isKeyPressedOnce('Digit3') && entity.inventory.chips[2]) {
			entity.inventory.useChip(2);
		} else if (keyboard.isKeyPressedOnce('Digit4') && entity.inventory.chips[3]) {
			entity.inventory.useChip(3);
		} else if (keyboard.isKeyPressedOnce('Digit5') && entity.inventory.chips[4]) {
			entity.inventory.useChip(4);
		}
	}
}
