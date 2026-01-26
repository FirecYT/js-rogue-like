'use strict';

import Engine from './components/Engine';
import FloatingText from './components/FloatingText';
import Player from './Player';
import { CHUNK_CONFIG, TileType } from './world/Types';
import { WorldManager } from './world/WorldManager';
import MouseInput from './components/MouseInput';
import { PlayerProgression } from './systems/PlayerProgression';
import { BossSpawnSystem } from './systems/BossSpawnSystem';
import { EnemySpawnerSystem } from './systems/EnemySpawnerSystem';
import { UISystem } from './systems/UISystem';
import { PlayerController } from './controllers/PlayerController';
import Entity from './entities/Entity';
import { BasicPistol } from './items/weapons/BasicPistol';
import { TeleportChip } from './items/chips/TeleportChip';
import { DashChip } from './items/chips/DashChip';
import { ControlSwitchSystem } from './systems/ControlSwitchSystem';
import { InventorySystem } from './systems/InventorySystem';
import { EffectSystem } from './systems/EffectSystem';
import { eventBus } from './events/EventBus';
import Enemy from './entities/Enemy';
import Keyboard from './components/Keyboard';
import { Camera } from './components/Camera';
import { ExplosiveModifier } from './items/modifiers/ExplosiveModifier';
import { SinusoidalModifier } from './items/modifiers/SinusoidalModifier';
import { PierceModifier } from './items/modifiers/PierceModifier';
import { DamageBoostModifier } from './items/modifiers/DamageBoostModifier';
import { PickupUISystem } from './systems/PickupUISystem';
import { PickupItem } from './entities/PickupItem';
import { WeaponPickup } from './entities/WeaponPickup';
import { Flamethrower } from './items/weapons/Flamethrower';
import { LaserRifle } from './items/weapons/LaserRifle';
import { ChipPickup } from './entities/ChipPickup';
import { ModifierPickup } from './entities/ModifierPickup';
import { RebirthChip } from './items/chips/RebirthChip';
import { RebirthSystem } from './systems/RebirthSystem';
import { Controller } from './controllers/Controller';

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

let state = 0;

const playerProgression = new PlayerProgression();

const floatingTexts: FloatingText[] = [];
const entities: Entity[] = [player];

const enemySpawner = new EnemySpawnerSystem(player, entities, worldManager);

canvas.addEventListener('wheel', (event) => {
	scale -= Math.sign(event.deltaY);
});

function addExperience(amount: number) {
	if (playerProgression.add(amount)) {
		state |= 1;

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

const uiSystem = new UISystem(
	engine,
	() => controlSwitchSystem.getCurrentControlled(),
	mouse,
	playerProgression,
	floatingTexts,
	() => state,
	(newState) => { state = newState; },
);

const controlSwitchSystem = new ControlSwitchSystem(
	player,
	new PlayerController(mouse),
);

const inventorySystem = new InventorySystem(
	engine,
	mouse,
	() => controlSwitchSystem.getCurrentControlled()
);

new RebirthSystem(entities, controlSwitchSystem);

const effectSystem = new EffectSystem();

const pickupUISystem = new PickupUISystem(
	engine,
	() => controlSwitchSystem.getCurrentControlled(),
	mouse,
	entities
);

let controlled = controlSwitchSystem.getCurrentControlled();

function getMousePosition() {
	return {
		x: mouse.x + controlled.x - engine.canvas.width / 2,
		y: mouse.y + controlled.y - engine.canvas.height / 2,
	};
}

const bestWeapon = new BasicPistol();

bestWeapon.fireRate = 0;

const damageBoost = new DamageBoostModifier(2.0);
const pierce = new PierceModifier();
const sinusoidal = new SinusoidalModifier();
const explosive = new ExplosiveModifier(effectSystem);

player.inventory.setWeapon(bestWeapon);

player.inventory.addModifier(damageBoost);
player.inventory.addModifier(pierce);
player.inventory.addModifier(sinusoidal);
player.inventory.addModifier(explosive);

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

	worldManager.update(controlled.x, controlled.y);
	bossSpawnSystem.update();
	inventorySystem.update();

	if (!(state & 1)) {
		entities.forEach(e => {
			if (!e.isDead()) {
				if ('controller' in e) {
					(e.controller as Controller)?.update(e, worldManager, effectSystem);
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

		// Check for pickup collisions
		if (!pickupUISystem.isActive()) {
			for (let i = 0; i < entities.length; i++) {
				const entity = entities[i];

				// Check if entity is a pickup item
				if (entity instanceof PickupItem) {
					const dx = controlled.x - entity.x;
					const dy = controlled.y - entity.y;
					const distance = Math.sqrt(dx * dx + dy * dy);

					// If player is close enough to pickup item
					if (distance < 20) { // Adjust pickup radius as needed
						pickupUISystem.activate(entity);
						entity.onPickup(controlled);
						// Remove the pickup item from the world after activation
						entities.splice(i, 1);
						break; // Only handle one pickup at a time
					}
				}
			}
		}

		effectSystem.update(entities);
	}

	uiSystem.update();
	pickupUISystem.update();

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
		for (let x = 0; x < chunk.tiles.length; x++) {
			for (let y = 0; y < chunk.tiles[x].length; y++) {
				const tileType = chunk.tiles[x][y];
				const worldPos = worldManager.gridToWorld(
					chunk.x * CHUNK_CONFIG.SIZE + x,
					chunk.y * CHUNK_CONFIG.SIZE + y
				);

				const screenPos = {
					x: worldPos.x - controlled.x + Math.floor(engine.canvas.width / 2),
					y: worldPos.y - controlled.y + Math.floor(engine.canvas.height / 2),
				}

				if (screenPos.x + CHUNK_CONFIG.TILE_SIZE < 0 || screenPos.y + CHUNK_CONFIG.TILE_SIZE < 0) continue;
				if (screenPos.x > engine.canvas.width || screenPos.y > engine.canvas.height) continue;

				let image = "";
				let seed = x;
				for (let i = 0; i < y; i++) {
					seed = (seed * 73129 + 95121) % 12345;
				}

				switch (tileType) {
					case TileType.EMPTY:
						image = `images/floor_${seed % 4 + 3}.png`;
						engine.context.fillStyle = '#333'; //'#444';
						break;
					case TileType.WALL: {
						const wallIndex = worldManager.getWallTextureIndex(chunk, x, y, TileType.WALL);

						const spriteX = (wallIndex % 4) * (CHUNK_CONFIG.TILE_SIZE + 1);
						const spriteY = Math.floor(wallIndex / 4) * (CHUNK_CONFIG.TILE_SIZE + 1);

						engine.drawSprite(
							'images/walls.png',
							spriteX, spriteY, CHUNK_CONFIG.TILE_SIZE, CHUNK_CONFIG.TILE_SIZE,
							worldPos.x, worldPos.y,
							CHUNK_CONFIG.TILE_SIZE, CHUNK_CONFIG.TILE_SIZE
						);

						engine.context.fillStyle = '#666';
						continue;
					}
					case TileType.ROCK:
						image = `images/trash_${(x + y) % 3}.png`;
						engine.context.fillStyle = '#333'; //'#888';
						break;
					case TileType.BUILDING:
						image = `images/floor_${seed % 3}.png`;
						engine.context.fillStyle = '#333'; //'#444';
						break;
					case TileType.WATER:
						engine.context.fillStyle = '#369';
						break;
					default:
						engine.context.fillStyle = '#333';
				}

				engine.context.fillRect(
					worldPos.x,
					worldPos.y,
					CHUNK_CONFIG.TILE_SIZE,
					CHUNK_CONFIG.TILE_SIZE
				);

				if (image) {
					engine.drawImage(
						image,
						worldPos.x,
						worldPos.y,
						CHUNK_CONFIG.TILE_SIZE,
						CHUNK_CONFIG.TILE_SIZE
					);
				}
			}
		}
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

	uiSystem.render();

	inventorySystem.render();

	pickupUISystem.render();
}

function tick() {
	update();
	render();
	requestAnimationFrame(tick);
}

requestAnimationFrame(tick);
