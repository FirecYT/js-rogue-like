'use strict';

import Engine from './components/Engine';
import FloatingText from './components/FloatingText';
import Player from './Player';
import { CHUNK_CONFIG } from './world/Types';
import { WorldManager } from './world/WorldManager';
import MouseInput from './components/MouseInput';
import { PlayerProgression } from './systems/PlayerProgression';
import { BossSpawnSystem } from './systems/BossSpawnSystem';
import { EnemySpawnerSystem } from './systems/EnemySpawnerSystem';
import { ScreenManager } from './ui/ScreenManager';
import { PlayerController } from './controllers/PlayerController';
import Entity from './entities/Entity';
import { BasicPistol } from './items/weapons/BasicPistol';
import { TeleportChip } from './items/chips/TeleportChip';
import { DashChip } from './items/chips/DashChip';
import { ControlSwitchSystem } from './systems/ControlSwitchSystem';
import { EffectSystem } from './systems/EffectSystem';
import { eventBus } from './events/EventBus';
import Enemy from './entities/Enemy';
import Keyboard from './components/Keyboard';
import { Camera } from './components/Camera';
import { ExplosiveModifier } from './items/modifiers/ExplosiveModifier';
import { SinusoidalModifier } from './items/modifiers/SinusoidalModifier';
import { PierceModifier } from './items/modifiers/PierceModifier';
import { DamageBoostModifier } from './items/modifiers/DamageBoostModifier';
import { WeaponPickup } from './entities/WeaponPickup';
import { Flamethrower } from './items/weapons/Flamethrower';
import { LaserRifle } from './items/weapons/LaserRifle';
import { ChipPickup } from './entities/ChipPickup';
import { ModifierPickup } from './entities/ModifierPickup';
import { RebirthChip } from './items/chips/RebirthChip';
import { RebirthSystem } from './systems/RebirthSystem';
import { isControllable } from './types/EntityTraits';
import { PickupWindow } from './ui/windows/PickupWindow';
import { PickupItem } from './entities/PickupItem';
import { LevelUpWindow } from './ui/windows/LevelUpWindow';
import { InventoryWindow } from './ui/windows/InventoryWindow';
import { isWeapon } from './items/Weapon';
import { isModifier, Modifier } from './items/Modifier';
import { createPickupFromItem } from './utils';
import { isChip } from './items/Chip';
import { ChunkViewManager } from './world/rendering/ChunkViewManager';

const canvas = document.querySelector<HTMLCanvasElement>(
	'#canvas'
) as HTMLCanvasElement;

if (!canvas) {
	throw new Error('Canvas not found');
}

const mouse = new MouseInput(canvas);
const engine = new Engine(canvas);
const worldManager = new WorldManager();
const keyboard = Keyboard.getInstance();
const camera = new Camera(canvas);
const chunkViewManager = new ChunkViewManager(worldManager, engine);

const player = new Player(
	CHUNK_CONFIG.FULL_SIZE / 2 + CHUNK_CONFIG.HALF_SIZE,
	CHUNK_CONFIG.FULL_SIZE / 2 + CHUNK_CONFIG.HALF_SIZE
);

player.controller = new PlayerController(mouse);

await engine.loadImages([
	'images/trash_0.png',
	'images/trash_1.png',
	'images/trash_2.png',
	'images/floor_0.png',
	'images/floor_1.png',
	'images/floor_2.png',
	'images/floor_3.png',
	'images/floor_4.png',
	'images/floor_5.png',
	'images/floor_6.png',
	'images/walls.png',
]);

let scale = 0;

const playerProgression = new PlayerProgression();

const floatingTexts: FloatingText[] = [];
const entities: Entity[] = [player];

const enemySpawner = new EnemySpawnerSystem(player, entities, worldManager);

canvas.addEventListener('wheel', (event) => {
	scale -= Math.sign(event.deltaY);
});

function addExperience(amount: number) {
	if (playerProgression.add(amount)) {
		const lvlUpWin = new LevelUpWindow(
			['Увеличить урон', 'Уменьшить перезарядку', 'Увеличить здоровье'],
			engine.canvas.width,
			engine.canvas.height
		);

		lvlUpWin.setOnChoose((choice) => {
			// applyUpgrade(choice); // ← твоя функция улучшения
			screenManager.closeWindow(lvlUpWin);
			floatingTexts.push(new FloatingText(controlled.x, controlled.y, choice, 60));
		});

		floatingTexts.push(new FloatingText(controlled.x, controlled.y - 20, `LEVEL UP! ${playerProgression.level}`, 120));
	}
}

eventBus.on('enemyKilled', ({ killer, victim }) => {
	if (killer === controlled) {
		let experience = 0;

		if (victim instanceof Enemy) {
			experience = victim.experience;
		}

		addExperience(experience);
		floatingTexts.push(new FloatingText(victim.x, victim.y, `+${experience}`, 60));
	}
});

eventBus.on('chunkUnloaded', ({ chunkX, chunkY }) => {
	chunkViewManager.unloadView(chunkX, chunkY);
})

const bossSpawnSystem = new BossSpawnSystem(
	worldManager,
	entities,
	player,
	floatingTexts,
	[
		// { triggerX: 3.5, triggerY: 0.5, spawnX: 3.5, spawnY: 0.5, bossClass: SpiderBoss },
		// { triggerX: -2.5, triggerY: 0.5, spawnX: -2.5, spawnY: 0.5, bossClass: MechanicalWormBoss },
		// { triggerX: 16.5, triggerY: 16.5, spawnX: -15.5, spawnY: -15.5, bossClass: WormBoss },
	]
);

const screenManager = new ScreenManager(
	engine,
	mouse,
	() => controlSwitchSystem.getCurrentControlled()
);

screenManager.getHud().setPlayerProgression(playerProgression);

const controlSwitchSystem = new ControlSwitchSystem(
	player,
	new PlayerController(mouse),
);

new RebirthSystem(entities, controlSwitchSystem);

const effectSystem = new EffectSystem(worldManager);

let controlled = controlSwitchSystem.getCurrentControlled();

function getMousePosition() {
	return {
		x: mouse.x + controlled.x - engine.canvas.width / 2,
		y: mouse.y + controlled.y - engine.canvas.height / 2,
	};
}

const bestWeapon = new BasicPistol();

bestWeapon.fireRate = 0;

player.inventory.setWeapon(bestWeapon);

player.inventory.addModifier(new DamageBoostModifier(2.0));
// player.inventory.addModifier(new PierceModifier());
player.inventory.addModifier(new SinusoidalModifier());
player.inventory.addModifier(new ExplosiveModifier(effectSystem));

player.inventory.addChip(new TeleportChip);
player.inventory.addChip(new DashChip);
player.inventory.addChip(new RebirthChip());

entities.push(new WeaponPickup(500, 0, new BasicPistol));
entities.push(new WeaponPickup(500, 100, new Flamethrower));
entities.push(new WeaponPickup(500, 200, new LaserRifle));

entities.push(new ModifierPickup(600, 0, new DamageBoostModifier(2.0)));
entities.push(new ModifierPickup(600, 50, new PierceModifier()));
entities.push(new ModifierPickup(600, 100, new SinusoidalModifier()));
entities.push(new ModifierPickup(600, 150, new ExplosiveModifier(effectSystem)));

entities.push(new ChipPickup(700, 0, new TeleportChip));
entities.push(new ChipPickup(700, 50, new DashChip));

function update() {
	controlled = controlSwitchSystem.getCurrentControlled();

	camera.update();
	camera.follow(controlled);

	const halfW = Math.ceil(engine.canvas.width / 2 / (2 ** scale) / CHUNK_CONFIG.FULL_SIZE);
	const halfH = Math.ceil(engine.canvas.height / 2 / (2 ** scale) / CHUNK_CONFIG.FULL_SIZE);

	worldManager.update(controlled.x, controlled.y, halfW, halfH);
	bossSpawnSystem.update();

	if (!screenManager.hasActiveWindows()) {
		entities.forEach(e => {
			if (!e.isDead()) {
				if (isControllable(e)) {
					e.controller?.update(e, worldManager, effectSystem);
				}
				e.inventory.update();
			}
		});

		enemySpawner.update();

		for (let i = floatingTexts.length - 1; i >= 0; i--) {
			floatingTexts[i].update();

			if (floatingTexts[i].isDead()) {
				floatingTexts.splice(i, 1);
			}
		}

		const minDistSq = 10 * 10;

		for (let i = 0; i < entities.length; i++) {
			if (entities[i].isDead()) continue;

			for (let j = i + 1; j < entities.length; j++) {
				if (entities[j].isDead()) continue;

				const dx = entities[i].x - entities[j].x;
				const dy = entities[i].y - entities[j].y;
				const distSq = dx * dx + dy * dy;

				if (distSq < minDistSq && distSq > 0) {
					const dist = Math.sqrt(distSq);
					const force = 10 / dist;

					entities[i].x += (dx / dist) * force;
					entities[i].y += (dy / dist) * force;

					entities[j].x -= (dx / dist) * force;
					entities[j].y -= (dy / dist) * force;
				}
			}
		}

		for (let i = entities.length - 1; i >= 0; i--) {
			if (entities[i].isDead() && entities[i] !== controlled) {
				entities.splice(i, 1);
			}
		}

		for (let i = 0; i < entities.length; i++) {
			const entity = entities[i];
			if (entity instanceof PickupItem) {
				const dx = controlled.x - entity.x;
				const dy = controlled.y - entity.y;
				const distance = Math.sqrt(dx * dx + dy * dy);
				if (distance < 20) {
					const pickupWin = new PickupWindow(
						entity,
						controlled,
						entities,
						engine.canvas.width,
						engine.canvas.height
					);

					pickupWin.setOnConfirm((slotIndex) => {
						const item = entity.item;

						if (isWeapon(item)) {
							const newWeapon = item;
							const oldWeapon = controlled.inventory.weapon;
							const oldModifiers = controlled.inventory.modifiers.filter(m => m !== null);

							controlled.inventory.setWeapon(newWeapon);

							const newModifiers: (Modifier | null)[] = Array(newWeapon.modifiersSlots).fill(null);

							const droppedModifiers: Modifier[] = [];
							for (let i = 0; i < oldModifiers.length; i++) {
								if (i < newWeapon.modifiersSlots) {
									newModifiers[i] = oldModifiers[i];
								} else {
									droppedModifiers.push(oldModifiers[i]);
								}
							}

							controlled.inventory.modifiers = newModifiers;

							if (oldWeapon) {
								entities.push(createPickupFromItem(oldWeapon, controlled.x, controlled.y));
							}
							for (const mod of droppedModifiers) {
								mod.onUnequip?.(controlled);
								entities.push(
									createPickupFromItem(mod, controlled.x + (Math.random() - 0.5) * 40, controlled.y + (Math.random() - 0.5) * 40)
								);
							}
						} else if (isModifier(item)) {
							const oldMod = controlled.inventory.modifiers[slotIndex];
							if (oldMod) {
								oldMod.onUnequip?.(controlled);
								entities.push(createPickupFromItem(oldMod, controlled.x, controlled.y));
							}
							controlled.inventory.modifiers[slotIndex] = item;
							item.onEquip?.(controlled);

						} else if (isChip(item)) {
							const oldChip = controlled.inventory.chips[slotIndex];
							if (oldChip) {
								entities.push(createPickupFromItem(oldChip, controlled.x, controlled.y));
							}
							const newChip = item;
							controlled.inventory.chips[slotIndex] = newChip;
							newChip.onEquip?.(controlled);
						}

						screenManager.closeWindow(pickupWin);
					});

					pickupWin.setOnCancel(() => {
						screenManager.closeWindow(pickupWin);
					});

					screenManager.openWindow(pickupWin);
					entity.onPickup(controlled);
					entities.splice(i, 1);
					break;
				}
			}
		}

		effectSystem.update(entities);
	}

	if (keyboard.isKeyPressedOnce('Tab')) {
		if (screenManager.isWindowOpen(InventoryWindow)) {
			screenManager.closeWindowsOfType(InventoryWindow);
		} else {
			const invWin = new InventoryWindow(
				controlSwitchSystem.getCurrentControlled(),
				engine.canvas.width,
				engine.canvas.height
			);

			invWin.setOnClose(() => {
				screenManager.closeWindow(invWin);
			});

			screenManager.openWindow(invWin);
		}
	}

	screenManager.update();

	keyboard.update();
}

function drawCrosshair() {
	const _m = getMousePosition();

	const angle = Math.atan2(_m.y - controlled.y, _m.x - controlled.x);

	const length = 1500;

	const lineX = length * Math.cos(angle) + controlled.x;
	const lineY = length * Math.sin(angle) + controlled.y;

	engine.context.strokeStyle = '#f992';
	engine.context.lineWidth = 4;
	engine.context.beginPath();
	engine.context.moveTo(controlled.x, controlled.y);
	engine.context.lineTo(lineX, lineY);
	engine.context.stroke();
	engine.context.fillRect(_m.x - 1, _m.y - 1, 2, 2);
}

function drawWorld() {
	const chunks = worldManager.getActiveChunks();
	for (const chunk of chunks) {
		const chunkView = chunkViewManager.getView(chunk.x, chunk.y, scale);
		if (!chunkView) continue;

		// Мировая позиция чанка (левый верхний угол)
		const worldX = chunk.x * CHUNK_CONFIG.FULL_SIZE;
		const worldY = chunk.y * CHUNK_CONFIG.FULL_SIZE;

		// Фрустум-клиннинг в мировых координатах
		const camX = camera.x;
		const camY = camera.y;
		const halfW = engine.canvas.width / 2 / (2 ** scale);
		const halfH = engine.canvas.height / 2 / (2 ** scale);

		if (worldX + CHUNK_CONFIG.FULL_SIZE < camX - halfW) continue;
		if (worldY + CHUNK_CONFIG.FULL_SIZE < camY - halfH) continue;
		if (worldX > camX + halfW) continue;
		if (worldY > camY + halfH) continue;

		chunkView.draw(engine.context, worldX, worldY, scale);
	}
}

function render() {
	engine.clear();

	engine.context.fillStyle = '#222';
	engine.context.fillRect(0, 0, engine.canvas.width, engine.canvas.height);

	engine.context.save();
	engine.context.translate(
		Math.floor(engine.canvas.width / 2),
		Math.floor(engine.canvas.height / 2)
	);
	engine.context.scale(2 ** scale, 2 ** scale);
	const { offsetX, offsetY } = camera.getOffset();
	engine.context.translate(offsetX, offsetY);

	drawWorld();

	if (!controlled.isDead()) {
		drawCrosshair();
	}

	effectSystem.render(engine.context);

	entities.forEach(entity => {
		if (!entity.isDead()) {
			entity.render(engine.context);
		}
	});

	floatingTexts.forEach((floatingText) => {
		floatingText.render(engine.context);
	});

	engine.context.restore();

	screenManager.render();
}

function tick() {
	update();
	render();
	requestAnimationFrame(tick);
}

requestAnimationFrame(tick);
