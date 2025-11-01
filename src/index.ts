'use strict';

import Bullet from './Bullet';
import Engine from './components/Engine';
import Enemy from './entities/Enemy';
import Player from './Player';
import { pir } from './utils';
import { CHUNK_CONFIG } from './world/Types';
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
const player = new Player(CHUNK_CONFIG.TILE_SIZE * CHUNK_CONFIG.SIZE / 2, CHUNK_CONFIG.TILE_SIZE * CHUNK_CONFIG.SIZE / 2, worldManager);
let scale = 0;

let state = 0;
let score = 0;

interface FloatingText {
	x: number;
	y: number;
	text: string;
	lifetime: number;
}

const floatingTexts: FloatingText[] = [];

const bullets: Bullet[] = [];
const enemies: Enemy[] = [];

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

function update() {
	worldManager.update(player.x, player.y);

	if (!(state & 1)) {
		player.update();

		bullets.forEach((bullet) => {
			let target = enemies[0];

			enemies.forEach((enemy) => {
				const target_dx = target.x - bullet.x;
				const target_dy = target.y - bullet.y;

				const current_dx = enemy.x - bullet.x;
				const current_dy = enemy.y - bullet.y;

				const target_distSq = target_dx * target_dx + target_dy * target_dy;
				const current_distSq = current_dx * current_dx + current_dy * current_dy;

				if (current_distSq < target_distSq) {
					target = enemy;
				}
			});

			bullet.target = target;

			bullet.update();
		});

		for (let i = 0; i <= 10; i++) {
			const chance = 1 / (enemies.length || 1);

			if (Math.random() < chance * chance * chance) {
				const angle = Math.random() * Math.PI * 2;
				const distance = 200 + Math.random() * 300;

				const x = player.x + Math.cos(angle) * distance;
				const y = player.y + Math.sin(angle) * distance;

				if (worldManager.isWorldPositionPassable(x, y)) {
					enemies.push(new Enemy(x, y, player, worldManager));
				}
			}
		}

		// Обновление позиции врагов
		enemies.forEach((enemy) => {
			enemy.update();
		});

		for (let i = floatingTexts.length - 1; i >= 0; i--) {
			floatingTexts[i].lifetime--;
			floatingTexts[i].y -= 0.5;

			if (floatingTexts[i].lifetime <= 0) {
				floatingTexts.splice(i, 1);
			}
		}

		const minDistSq = 10 * 10;

		for (let i = 0; i < enemies.length; i++) {
			for (let j = i + 1; j < enemies.length; j++) {
				const dx = enemies[i].x - enemies[j].x;
				const dy = enemies[i].y - enemies[j].y;
				const distSq = dx * dx + dy * dy;

				if (distSq < minDistSq && distSq > 0) {
					const dist = Math.sqrt(distSq);
					const force = 10 / dist;

					enemies[i].x += (dx / dist) * force;
					enemies[i].y += (dy / dist) * force;

					enemies[j].x -= (dx / dist) * force;
					enemies[j].y -= (dy / dist) * force;
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

		let bulletsToDelete: number[] = [];
		let enemiesToDelete: number[] = [];

		bullets.forEach((bullet, bulletIndex) => {
			enemies.forEach((enemy, enemyIndex) => {
				if (!bullet.isDead() && !enemy.isDead() && bullet.isCollidingWith(enemy)) {
					const enemyDMG = enemy.getHP();
					const bulletDMG = bullet.getHP();

					enemy.takeDamage(bulletDMG);
					bullet.takeDamage(enemyDMG);

					if (enemy.isDead()) {
						enemiesToDelete.push(enemyIndex);
						score += enemy.experience || 1;

						if (Math.log2(score) == Math.floor(Math.log2(score))) {
							state |= 1;
						}

						floatingTexts.push({
							x: enemy.x,
							y: enemy.y,
							text: `+${enemy.experience}`,
							lifetime: 60,
						});
					}

					if (bullet.isDead()) {
						bulletsToDelete.push(bulletIndex);
					}
				}
			});
		});

		bulletsToDelete = [...new Set(bulletsToDelete.sort((a, b) => a - b))];
		enemiesToDelete = [...new Set(enemiesToDelete.sort((a, b) => a - b))];

		for (let i = enemiesToDelete.length - 1; i >= 0; i--) {
			enemies.splice(enemiesToDelete[i], 1);
		}

		for (let i = bulletsToDelete.length - 1; i >= 0; i--) {
			bullets.splice(bulletsToDelete[i], 1);
		}

		if (player.fireCooldown.isReady() && mouse.pressed) {
			player.fireCooldown.start();

			const _m = getMousePosition();

			const angle = Math.atan2(_m.y - player.y, _m.x - player.x);

			for (let i = 0; i < 100; i++) {
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

				switch (tileType) {
					case 0: // EMPTY
						engine.context.fillStyle = '#333';
						break;
					case 1: // WALL
						engine.context.fillStyle = '#666';
						break;
					case 2: // ROCK
						engine.context.fillStyle = '#888';
						break;
					case 3: // BUILDING
						engine.context.fillStyle = '#444';
						break;
					case 4: // WATER
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
			}
		}
	}

	// Рендерим границы чанков (для отладки)
	// engine.context.strokeStyle = '#ff04';
	// engine.context.lineWidth = 2;

	// for (const chunk of chunks) {
	// 	const worldX = chunk.x * CHUNK_CONFIG.SIZE * CHUNK_CONFIG.TILE_SIZE;
	// 	const worldY = chunk.y * CHUNK_CONFIG.SIZE * CHUNK_CONFIG.TILE_SIZE;

	// 	engine.context.strokeRect(worldX, worldY, CHUNK_CONFIG.SIZE * CHUNK_CONFIG.TILE_SIZE, CHUNK_CONFIG.SIZE * CHUNK_CONFIG.TILE_SIZE);

	// 	// Подписываем тип региона
	// 	engine.context.fillStyle = '#fff';
	// 	engine.context.fillText(
	// 		chunk.regionType,
	// 		worldX + 10,
	// 		worldY + 20
	// 	);
	// }
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
		engine.canvas.width / 2,
		engine.canvas.height / 2
	);
	engine.context.scale(2 ** scale, 2 ** scale);
	engine.context.translate(
		-player.x,
		-player.y
	);

	drawWorld();

	drawCrosshair();

	bullets.forEach((bullet) => {
		bullet.render(engine.context);
	});

	player.render(engine.context);

	enemies.forEach((enemy) => {
		enemy.render(engine.context);
	});

	engine.context.fillStyle = '#ff0';
	floatingTexts.forEach(text => {
		engine.context.fillText(text.text, text.x, text.y);
	});

	engine.context.restore();

	engine.context.fillStyle = '#fff';
	engine.context.fillText(`Score: ${score}`, 10, 20);

	engine.context.fillStyle = '#060';
	engine.context.fillRect(0, 0, engine.canvas.width, 5);

	engine.context.fillStyle = '#494';
	engine.context.fillRect(0, 0, engine.canvas.width * (Math.log2(score) - Math.floor(Math.log2(score))), 5);

	drawCooldowns();

	engine.context.fillStyle = '#fff';
	engine.context.fillText(`Player: (${Math.round(player.x)}, ${Math.round(player.y)})`, 10, 40);

	const playerGrid = worldManager.worldToGrid(player.x, player.y);
	if (playerGrid) {
		engine.context.fillText(`Player chunk: (${playerGrid.chunkX}, ${playerGrid.chunkY}) tile: (${playerGrid.tileX}, ${playerGrid.tileY})`, 10, 55);
	}

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
