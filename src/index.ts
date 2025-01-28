'use strict';

import Bullet from "./Bullet";
import Engine from "./components/Engine";
import Enemy from "./Enemy";
import Player from "./Player";
import { pir } from "./utils";

// Init
const canvas = document.querySelector<HTMLCanvasElement>('#canvas') as HTMLCanvasElement;

if (!canvas) {
	throw new Error('Canvas not found');
}

const engine = new Engine(canvas);

const player = new Player();

let state = 0;
let score = 0;

const bullets: Bullet[] = [];
const enemies: Enemy[] = [];

const mouse = {
	x: 0,
	y: 0,
	pressed: false
};

canvas.addEventListener('mousemove', event => {
	mouse.x = event.offsetX;
	mouse.y = event.offsetY;
});

canvas.addEventListener('mousedown', event => {
	mouse.x = event.offsetX;
	mouse.y = event.offsetY;

	mouse.pressed = true;
});

canvas.addEventListener('mouseup', event => {
	mouse.x = event.offsetX;
	mouse.y = event.offsetY;

	mouse.pressed = false;
});

canvas.addEventListener('click', event => {
	mouse.x = event.offsetX;
	mouse.y = event.offsetY;
});

function update() {
	if (!(state & 1)) {
		player.update();

		bullets.forEach(bullet => {
			bullet.update();
		});

		for (let i = bullets.length - 1; i >= 0; i--) {
			const bullet = bullets[i];

			if (bullet.x < 0 || bullet.y < 0 || bullet.x > canvas.width || bullet.y > canvas.height) {
				bullets.splice(i, 1);
			}
		}

		const chance = Math.max(
			0.01,
			Math.pow(
				score / (score + 1),
				500
			)
		);

		for (let i = 0; i <= Math.log10(score + 1); i++) {
			if (Math.random() < chance || enemies.length == 0) {
				const x = Math.random() * canvas.width;
				const y = Math.random() * canvas.height;
				enemies.push(new Enemy(x, y, player));
			}
		}

		// Обновление позиции врагов
		enemies.forEach(enemy => {
			enemy.update();
		});

		for (let i = enemies.length - 1; i >= 0; i--) {
			const enemy = enemies[i];

			if (enemy.x < 0 || enemy.y < 0 || enemy.x > canvas.width || enemy.y > canvas.height) {
				enemies.splice(i, 1);
			}

			if (
				pir({ x: enemy.x, y: enemy.y }, {
					x: player.x,
					y: player.y,
					width: 10,
					height: 10
				})
			) {
				state = 2;
				console.log('Game Over');
			}
		}

		const bulletsToDelete: number[] = [];
		const enemiesToDelete: number[] = [];

		bullets.forEach((bullet, bulletIndex) => {
			enemies.forEach((enemy, enemyIndex) => {
				if (bullet.isCollidingWith(enemy)) {
					enemiesToDelete.push(enemyIndex);
					bulletsToDelete.push(bulletIndex);
				}
			});
		});

		bulletsToDelete.sort((a, b) => a - b);
		enemiesToDelete.sort((a, b) => a - b);

		for (let i = enemiesToDelete.length - 1; i >= 0; i--) {
			enemies.splice(enemiesToDelete[i], 1);

			score++;

			if (score % 10 === 0) {
				state |= 1;
			}
		}

		for (let i = bulletsToDelete.length - 1; i >= 0; i--) {
			bullets.splice(bulletsToDelete[i], 1);
		}

		if (player.fireCooldown.get() && mouse.pressed) {
			player.fireCooldown.set();

			const angle = Math.atan2(
				mouse.y - player.y,
				mouse.x - player.x
			);

			bullets.push(
				new Bullet(
					player.x,
					player.y,
					angle
				)
			);
		}
	}

	if (state & 1) {
		const updates = [
			() => {
				player.dashCooldown.edit(
					Math.max(
						0,
						player.dashCooldown.getMaximum() - 10
					)
				);
			},
			() => {
				console.log('Dash speed +');
			},
			() => {
				player.fireCooldown.edit(
					Math.max(
						0,
						Math.floor(player.fireCooldown.getMaximum() / 4 * 3)
					)
				);
			},
			() => {
				console.log('Damage +');
			},
		];

		for (let i = 0; i < updates.length; i++) {
			if (
				mouse.pressed &&
				pir(mouse, {
					x: 45,
					y: 43 + 20 * i,
					width: 100,
					height: 14
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
	const angle = Math.atan2(
		mouse.y - player.y,
		mouse.x - player.x
	);

	const length = 1500;

	const lineX = length * Math.cos(angle) + player.x;
	const lineY = length * Math.sin(angle) + player.y;

	engine.context.strokeStyle = '#f992';
	engine.context.lineWidth = 4;
	engine.context.beginPath();
	engine.context.moveTo(player.x, player.y);
	engine.context.lineTo(lineX, lineY);
	engine.context.stroke();
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
				height: 14
			})
		) {
			engine.context.fillRect(50, 43 + 20 * i, 100, 14);
		} else {
			engine.context.fillRect(45, 43 + 20 * i, 100, 14);
		}
	}

	engine.context.fillStyle = '#000';

	for (let i = 0; i < texts.length; i++) {
		if (
			pir(mouse, {
				x: 45,
				y: 43 + 20 * i,
				width: 100,
				height: 14
			})
		) {
			engine.context.fillText(texts[i], 55, 50 + 20 * i);
		} else {
			engine.context.fillText(texts[i], 50, 50 + 20 * i);
		}
	}
}

function render() {
	engine.clear();

	drawCrosshair();

	engine.context.fillStyle = '#000';
    engine.context.fillText(`Score: ${score}`, 10, 20);

	bullets.forEach(bullet => {
		bullet.render(engine.context);
	});

	player.render(engine.context);

	enemies.forEach(enemy => {
		enemy.render(engine.context);
	});

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
