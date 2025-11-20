'use strict';

import Bullet from './Bullet';
import Engine from './components/Engine';
import FloatingText from './components/FloatingText';
import GameObject from './components/GameObject';
import Enemy from './entities/Enemy';
import StrongEnemy from './entities/StrongEnemy';
import SpiderBoss from './entities/trash/SpiderBoss';
import WormBoss from './entities/trash/WormBoss';
import MechanicalWormBoss from './entities/MechanicalWormBoss';
import Player from './Player';
import { pir } from './utils';
import { CHUNK_CONFIG, TileType } from './world/Types';
import { WorldManager } from './world/WorldManager';

// Init
const canvas = document.querySelector<HTMLCanvasElement>(
	'#canvas'
) as HTMLCanvasElement;

if (!canvas) {
	throw new Error('Canvas not found');
}

const engine = new Engine(canvas);
const worldManager = new WorldManager();
const player = new Player(CHUNK_CONFIG.FULL_SIZE / 2 + CHUNK_CONFIG.HALF_SIZE, CHUNK_CONFIG.FULL_SIZE / 2 + CHUNK_CONFIG.HALF_SIZE);

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

let playerLevel = 1;
let playerExperience = 0;
let experienceToNextLevel = 100;

const floatingTexts: FloatingText[] = [];

const bullets: Bullet[] = [];
const entities: (Player | Enemy | StrongEnemy | WormBoss | SpiderBoss)[] = [player];

const mouse = {
	x: 0,
	y: 0,
	pressed: false,
};

function getMousePosition() {
	return {
		x: mouse.x + player.x - engine.canvas.width / 2,
		y: mouse.y + player.y - engine.canvas.height / 2,
	};
}

canvas.addEventListener('mousemove', (event) => {
	mouse.x = event.offsetX;
	mouse.y = event.offsetY;
});

canvas.addEventListener('mousedown', (event) => {
	mouse.x = event.offsetX;
	mouse.y = event.offsetY;

	mouse.pressed = true;
});

canvas.addEventListener('mouseup', (event) => {
	mouse.x = event.offsetX;
	mouse.y = event.offsetY;

	mouse.pressed = false;
});

canvas.addEventListener('wheel', (event) => {
	scale -= Math.sign(event.deltaY);
});

function addExperience(amount: number) {
	playerExperience += amount;

	if (playerExperience >= experienceToNextLevel) {
		playerLevel++;
		playerExperience -= experienceToNextLevel;
		experienceToNextLevel = Math.floor(playerLevel * 100);
		state |= 1;

		floatingTexts.push(new FloatingText(player.x, player.y - 20, `LEVEL UP! ${playerLevel}`, 120));
	}
}

const isBossesExists = new Map<new (x: number, y: number, target: GameObject, worldManager: WorldManager) => (Player | Enemy | StrongEnemy | WormBoss | SpiderBoss), boolean>();

function spawnBoss(
	triggerX: number,
	triggerY: number,
	spawnX: number,
	spawnY: number,
	bossClass: new (x: number, y: number, target: GameObject, worldManager: WorldManager) => (Player | Enemy | StrongEnemy | WormBoss | SpiderBoss)
): void {
	const isBossExists = isBossesExists.get(bossClass) || false;

	if (!isBossExists && Math.abs(player.x - triggerX * CHUNK_CONFIG.FULL_SIZE - CHUNK_CONFIG.HALF_SIZE) < 300 && Math.abs(player.y - triggerY * CHUNK_CONFIG.FULL_SIZE - CHUNK_CONFIG.HALF_SIZE) < 300) {
		const boss = new bossClass(spawnX * CHUNK_CONFIG.FULL_SIZE - CHUNK_CONFIG.HALF_SIZE, spawnY * CHUNK_CONFIG.FULL_SIZE - CHUNK_CONFIG.HALF_SIZE, player, worldManager);
		entities.push(boss);

		floatingTexts.push(new FloatingText(player.x, player.y, 'BOSS APPEARED!', 180));

		isBossesExists.set(bossClass, true);
	}
}

function update() {
	worldManager.update(player.x, player.y);

	spawnBoss(3.5, 0.5, 3.5, 0.5, SpiderBoss);
	spawnBoss(-2.5, 0.5, -2.5, 0.5, MechanicalWormBoss);
	spawnBoss(16.5, 16.5, -15.5, -15.5, WormBoss);

	if (!(state & 1)) {
		entities.forEach(entity => {
			if (!entity.isDead()) {
				entity.update();
			}
		});

		bullets.forEach((bullet) => {
			if (bullet.isDead()) return;

			entities.forEach(entity => {
				if (entity instanceof Player || entity.isDead()) return;

				if (bullet.isCollidingWith(entity)) {
					const enemyDMG = entity.getHP();
					const bulletDMG = bullet.getHP();

					entity.takeDamage(bulletDMG);
					bullet.takeDamage(enemyDMG);

					if (entity.isDead()) {
						addExperience(entity.experience);
						floatingTexts.push(new FloatingText(entity.x, entity.y, `+${entity.experience}`, 60));
					}
				}
			});

			bullet.update();
		});

		for (let i = 0; i <= 10; i++) {
			const enemyCount = entities.filter(entity => (entity instanceof Enemy || entity instanceof StrongEnemy) && !entity.isDead()).length;
			const chance = 1 / (enemyCount || 1);

			if (Math.random() < chance * chance * chance) {
				const angle = Math.random() * Math.PI * 2;
				const distance = 200 + Math.random() * 300;

				const x = player.x + Math.cos(angle) * distance;
				const y = player.y + Math.sin(angle) * distance;

				let newEnemy: Enemy;

				if (Math.random() < 0.05) {
					newEnemy = new StrongEnemy(x, y, player, worldManager);
				} else {
					newEnemy = new Enemy(x, y, player, worldManager);
				}

				entities.push(newEnemy);
			}
		}

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

		// ==========
		// СМЕРТИ НЕТ
		// ==========
		//
		// for (let i = enemies.length - 1; i >= 0; i--) {
		// 	const enemy = enemies[i];
		//
		// 	if (
		// 		pir(
		// 			{ x: enemy.x, y: enemy.y },
		// 			{
		// 				x: player.x,
		// 				y: player.y,
		// 				width: 10,
		// 				height: 10,
		// 			}
		// 		)
		// 	) {
		// 		state = 2;
		// 		console.log('Game Over');
		// 	}
		// }

		for (let i = entities.length - 1; i >= 0; i--) {
			if (entities[i].isDead() && entities[i] !== player) {
				entities.splice(i, 1);
			}
		}

		for (let i = bullets.length - 1; i >= 0; i--) {
			if (bullets[i].isDead()) {
				bullets.splice(i, 1);
			}
		}

		if (player.fireCooldown.isReady() && mouse.pressed) {
			player.fireCooldown.start();

			const _m = getMousePosition();

			const angle = Math.atan2(_m.y - player.y, _m.x - player.x);

			for (let i = 0; i < 1; i++) {
				bullets.push(new Bullet(player.x, player.y, angle, player.damage));
			}
		}
	}

	if (state & 1) {
		const updates = [
			() => {
				player.dashCooldown.setDuration(
					Math.max(0, player.dashCooldown.getMaximum() - 10)
				);
			},
			() => {
				console.log('Dash speed +');
			},
			() => {
				player.fireCooldown.setDuration(
					Math.max(
						0,
						Math.floor((player.fireCooldown.getMaximum() / 4) * 3)
					)
				);
			},
			() => {
				player.damage++;
			},
		];

		for (let i = 0; i < updates.length; i++) {
			if (
				mouse.pressed &&
				pir(mouse, {
					x: 45,
					y: 43 + 20 * i,
					width: 100,
					height: 14,
				})
			) {
				updates[i]();
				state ^= 1;

				if (playerExperience >= experienceToNextLevel) {
					playerLevel++;
					playerExperience -= experienceToNextLevel;
					experienceToNextLevel = Math.floor(experienceToNextLevel * 1.5);
					state |= 1;

					floatingTexts.push(new FloatingText(player.x, player.y - 20, `LEVEL UP! ${playerLevel}`, 120));
				}
				break;
			}
		}
	}
}

function drawCrosshair() {
	const _m = getMousePosition();

	const angle = Math.atan2(_m.y - player.y, _m.x - player.x);

	const length = 1500;

	const lineX = length * Math.cos(angle) + player.x;
	const lineY = length * Math.sin(angle) + player.y;

	engine.context.strokeStyle = '#f992';
	engine.context.lineWidth = 4;
	engine.context.beginPath();
	engine.context.moveTo(player.x, player.y);
	engine.context.lineTo(lineX, lineY);
	engine.context.stroke();
	engine.context.fillRect(_m.x - 1, _m.y - 1, 2, 2);
}

function drawWorld() {
	const chunks = worldManager.getActiveChunks();

	// Рендерим тайлы
	for (const chunk of chunks) {
		for (let x = 0; x < chunk.tiles.length; x++) {
			for (let y = 0; y < chunk.tiles[x].length; y++) {
				const tileType = chunk.tiles[x][y];
				const worldPos = worldManager.gridToWorld(
					chunk.x * CHUNK_CONFIG.SIZE + x,
					chunk.y * CHUNK_CONFIG.SIZE + y
				);

				const screenPos = {
					x: worldPos.x - player.x + Math.floor(engine.canvas.width / 2),
					y: worldPos.y - player.y + Math.floor(engine.canvas.height / 2),
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
						image = `images/floor_${seed%4 + 3}.png`;
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
						image = `images/trash_${(x+y)%3}.png`;
						engine.context.fillStyle = '#333'; //'#888';
						break;
					case TileType.BUILDING:
						image = `images/floor_${seed%3}.png`;
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

function drawLvlUpScreen() {
	engine.context.fillStyle = '#0006';
	engine.context.fillRect(0, 0, engine.canvas.width, engine.canvas.height);

	const texts = [
		'Dash cooldown -',
		'Dash speed +',
		'Rate of fire +',
		'Damage +',
	];

	engine.context.fillStyle = '#0006';
	engine.context.fillRect(0, 0, engine.canvas.width, engine.canvas.height);

	engine.context.fillStyle = '#ccc';

	for (let i = 0; i < texts.length; i++) {
		if (
			pir(mouse, {
				x: 45,
				y: 43 + 20 * i,
				width: 100,
				height: 14,
			})
		) {
			engine.context.fillRect(50, 43 + 20 * i, 100, 14);
		} else {
			engine.context.fillRect(45, 43 + 20 * i, 100, 14);
		}
	}

	engine.context.fillStyle = '#000';
	engine.context.textBaseline = 'middle';

	for (let i = 0; i < texts.length; i++) {
		if (
			pir(mouse, {
				x: 45,
				y: 43 + 20 * i,
				width: 100,
				height: 14,
			})
		) {
			engine.context.fillText(texts[i], 55, 50 + 20 * i);
		} else {
			engine.context.fillText(texts[i], 50, 50 + 20 * i);
		}
	}
}

function drawCooldowns() {
	const cooldowns = player.getCooldowns();

	engine.context.fillStyle = '#ccc';

	for (let i = 0; i < cooldowns.length; i++) {
		engine.context.fillRect(5, engine.canvas.height - 10 - 10 * i, 100, 5);
	}

	engine.context.fillStyle = '#f99';

	for (let i = 0; i < cooldowns.length; i++) {
		engine.context.fillRect(
			5,
			engine.canvas.height - 10 - 10 * i,
			100 * cooldowns[i].val,
			5
		);
	}

	engine.context.fillStyle = '#fff';
	engine.context.textBaseline = 'middle';

	for (let i = 0; i < cooldowns.length; i++) {
		engine.context.fillText(cooldowns[i].name, 110, engine.canvas.height - 5 - 2 - 10 * i);
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
	engine.context.translate(
		-player.x,
		-player.y
	);

	drawWorld();

	if (!player.isDead()) {
		drawCrosshair();
	}

	bullets.forEach((bullet) => {
		bullet.render(engine.context);
	});

	entities.forEach(entity => {
		if (!entity.isDead()) {
			entity.render(engine.context);
		}
	});

	floatingTexts.forEach((floatingText) => {
		floatingText.render(engine.context);
	});

	engine.context.restore();

	engine.context.fillStyle = '#fff';
	engine.context.fillText(`Score: ${playerExperience}`, 10, 20);

	engine.context.fillStyle = '#060';
	engine.context.fillRect(0, 0, engine.canvas.width, 5);

	engine.context.fillStyle = '#494';
	engine.context.fillRect(0, 0, engine.canvas.width * (playerExperience / experienceToNextLevel), 5);

	drawCooldowns();

	engine.context.fillStyle = '#fff';
	engine.context.fillText(`Player: (${Math.round(player.x)}, ${Math.round(player.y)})`, 10, 40);

	const playerGrid = worldManager.worldToGrid(player.x, player.y);
	if (playerGrid) {
		engine.context.fillText(`Player chunk: (${playerGrid.chunkX}, ${playerGrid.chunkY}) tile: (${playerGrid.tileX}, ${playerGrid.tileY})`, 10, 55);
	}

	engine.context.fillText(`Player HP: ${player.getHP()}`, 10, 70);

	if (state & 1) {
		drawLvlUpScreen();
	}
}

function tick() {
	update();
	render();
	requestAnimationFrame(tick);
}

requestAnimationFrame(tick);
