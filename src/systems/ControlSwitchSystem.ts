import Entity from '../entities/Entity';
import { PlayerController } from '../controllers/PlayerController';
import { Controller } from '../controllers/Controller';
import MouseInput from '../components/MouseInput';
import Keyboard from '../components/Keyboard';

export class ControlSwitchSystem {
	private currentControlled: Entity;
	private previousControllers = new WeakMap<Entity, Controller<Entity> | null>();
	private debugMode = false;

	constructor(
		private entities: Entity[],
		private playerController: PlayerController,
		private mouse: MouseInput
	) {
		this.currentControlled = entities[0];
		this.previousControllers.set(entities[0], entities[0].controller);
	}

	isDebugMode(): boolean {
		return this.debugMode;
	}

	update(): void {
		const keyboard = Keyboard.getInstance();

		if (keyboard.isKeyPressedOnce('KeyT')) {
			this.debugMode = !this.debugMode;
			console.log(`Debug mode: ${this.debugMode ? 'ON' : 'OFF'}`);
		}

		if (!this.debugMode) return;

		if (keyboard.isKeyPressedOnce('KeyY')) {
			this.switchControl();
		}
	}

	switchControl(): void {
		const aliveEntities = this.entities.filter(e => !e.isDead());
		if (aliveEntities.length <= 1) {
			console.log('No other entities to control');
			return;
		}

		this.previousControllers.set(this.currentControlled, this.currentControlled.controller);

		const currentIndex = aliveEntities.findIndex(e => e === this.currentControlled);
		const nextIndex = (currentIndex + 1) % aliveEntities.length;
		const nextEntity = aliveEntities[nextIndex];

		this.currentControlled.controller = null;

		this.currentControlled = nextEntity;
		this.currentControlled.controller = this.playerController;

		console.log(`Switched control to: ${nextEntity.constructor.name}`);
		this.mouse.x = window.innerWidth / 2;
		this.mouse.y = window.innerHeight / 2;
	}

	getCurrentControlled(): Entity {
		return this.currentControlled;
	}

	restoreControllers(): void {
		for (const entity of this.entities) {
			if (entity !== this.currentControlled) {
				entity.controller = this.previousControllers.get(entity) || null;
			}
		}
	}
}