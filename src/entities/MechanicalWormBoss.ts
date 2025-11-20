import Cooldown from '../components/Cooldown';
import GameObject from '../components/GameObject';
import { Pathfinder } from '../world/Pathfinding';
import { WorldManager } from '../world/WorldManager';
import Enemy from './Enemy';
import Bullet from '../Bullet';

export default class MechanicalWormBoss extends Enemy {
	// Настройки червя
	private segmentCount = 20;
	private segments: { x: number, y: number }[] = [];
	private segmentDistance = 15;
	private wormSpeed = 1.5;
	private segmentSize = 8;

	// Босс-специфичные свойства
	public experience = 1000;
	protected speed = this.wormSpeed;

	// Фазы боя
	private phase = 1;
	private readonly phase2HP = 300;
	private readonly phase3HP = 150;

	// Атаки и способности
	private attackCooldown = new Cooldown(120);
	private chargeCooldown = new Cooldown(400);
	private burrowCooldown = new Cooldown(600);
	private spawnCooldown = new Cooldown(300);
	private projectileCooldown = new Cooldown(180);

	private isCharging = false;
	private isBurrowing = false;
	private chargeDirection = { x: 0, y: 0 };
	private chargeSpeed = 4;
	private normalSpeed = this.wormSpeed;

	// Визуальные эффекты
	private damageFlashTimer = 0;
	private burrowProgress = 0;
	private particleTrail: { x: number, y: number, life: number, size: number }[] = [];

	// Пули босса
	private bullets: WormBullet[] = [];

	constructor(x: number, y: number, target: GameObject, worldManager: WorldManager) {
		super(x, y, target, worldManager);
		this.initHP(500);

		this.initializeSegments();
		this.setupCooldowns();
	}

	private initializeSegments() {
		this.segments = [];
		for (let i = 0; i < this.segmentCount; i++) {
			this.segments.push({
				x: this.x - i * this.segmentDistance,
				y: this.y
			});
		}
	}

	private setupCooldowns() {
		this.attackCooldown.onReady(() => {
			this.performAttack();
			this.attackCooldown.start();
		}).start();

		this.chargeCooldown.onReady(() => {
			if (!this.isBurrowing && this.phase >= 2) {
				this.startCharge();
			}
			this.chargeCooldown.start();
		}).start();

		this.burrowCooldown.onReady(() => {
			if (!this.isCharging && this.phase >= 2) {
				this.startBurrow();
			}
			this.burrowCooldown.start();
		}).start();

		this.spawnCooldown.onReady(() => {
			if (this.phase >= 3) {
				this.spawnMinions();
			}
			this.spawnCooldown.start();
		}).start();

		this.projectileCooldown.onReady(() => {
			if (this.phase >= 2 && !this.isCharging && !this.isBurrowing) {
				this.shootProjectiles();
			}
			this.projectileCooldown.start();
		}).start();
	}

	update() {
		// Проверяем смену фазы
		this.checkPhaseTransition();

		// Обновляем кулдауны
		this.attackCooldown.update();
		this.chargeCooldown.update();
		this.burrowCooldown.update();
		this.spawnCooldown.update();
		this.projectileCooldown.update();

		if (this.damageFlashTimer > 0) this.damageFlashTimer--;

		if (this.isBurrowing) {
			this.updateBurrow();
		} else if (this.isCharging) {
			this.updateCharge();
		} else {
			super.update();
			this.updateSegments();
		}

		this.updateBullets();
		this.updateParticles();
	}

	private checkPhaseTransition() {
		const currentHP = this.getHP();
		if (currentHP <= this.phase3HP && this.phase < 3) {
			this.phase = 3;
			this.onPhaseChange();
		} else if (currentHP <= this.phase2HP && this.phase < 2) {
			this.phase = 2;
			this.onPhaseChange();
		}
	}

	private onPhaseChange() {
		// Увеличиваем скорость и агрессивность при смене фазы
		this.normalSpeed = this.wormSpeed + (this.phase - 1) * 0.5;
		this.speed = this.normalSpeed;

		// Уменьшаем кулдауны
		this.attackCooldown.setDuration(Math.max(60, 120 - (this.phase - 1) * 30));
		this.chargeCooldown.setDuration(Math.max(200, 400 - (this.phase - 1) * 100));
	}

	private updateSegments() {
		// Первый сегмент (голова) следует за основной позицией
		const head = this.segments[0];
		head.x = this.x;
		head.y = this.y;

		// Обновляем остальные сегменты (исправленная версия)
		for (let i = 1; i < this.segments.length; i++) {
			const current = this.segments[i];
			const previous = this.segments[i - 1];

			const dx = previous.x - current.x;
			const dy = previous.y - current.y;
			const distance = Math.sqrt(dx * dx + dy * dy);

			if (distance > this.segmentDistance) {
				const angle = Math.atan2(dy, dx);

				current.x = previous.x - Math.cos(angle) * this.segmentDistance;
				current.y = previous.y - Math.sin(angle) * this.segmentDistance;
			}
		}
	}

	private startCharge() {
		this.isCharging = true;
		this.speed = this.chargeSpeed;

		const dx = this.target.x - this.x;
		const dy = this.target.y - this.y;
		const distance = Math.sqrt(dx * dx + dy * dy);

		this.chargeDirection = {
			x: dx / distance,
			y: dy / distance
		};

		// Создаем частицы при начале заряда
		this.createChargeParticles();

		setTimeout(() => {
			this.isCharging = false;
			this.speed = this.normalSpeed;
		}, 1500);
	}

	private updateCharge() {
		this.x += this.chargeDirection.x * this.speed;
		this.y += this.chargeDirection.y * this.speed;

		// Обновляем сегменты во время заряда
		this.updateSegments();

		// Создаем частицы во время заряда
		if (Math.random() < 0.3) {
			this.particleTrail.push({
				x: this.x,
				y: this.y,
				life: 30,
				size: 3 + Math.random() * 4
			});
		}
	}

	private startBurrow() {
		this.isBurrowing = true;
		this.burrowProgress = 0;
	}

	private updateBurrow() {
		this.burrowProgress += 0.02;

		if (this.burrowProgress >= 1) {
			// Телепортируемся в новую позицию рядом с игроком
			const angle = Math.random() * Math.PI * 2;
			const distance = 80 + Math.random() * 120;
			this.x = this.target.x + Math.cos(angle) * distance;
			this.y = this.target.y + Math.sin(angle) * distance;

			// Проверяем валидность позиции
			if (!this.worldManager.isWorldPositionPassable(this.x, this.y)) {
				// Если позиция невалидна, пробуем другую
				this.x = this.target.x + Math.cos(angle + Math.PI) * distance;
				this.y = this.target.y + Math.sin(angle + Math.PI) * distance;
			}

			this.isBurrowing = false;
			this.burrowProgress = 0;
			this.initializeSegments();

			// Создаем эффект появления
			this.createEmergenceParticles();
		}
	}

	private performAttack() {
		// Разные атаки в зависимости от фазы
		switch (this.phase) {
			case 1:
				this.createCircularWave(6, 2);
				break;
			case 2:
				this.createCircularWave(8, 3);
				break;
			case 3:
				this.createSpiralWave(12, 4);
				break;
		}
	}

	private createCircularWave(projectileCount: number, damage: number) {
		const startAngle = Math.random() * Math.PI * 2;

		for (let i = 0; i < projectileCount; i++) {
			const angle = startAngle + (i / projectileCount) * Math.PI * 2;

			this.bullets.push(new WormBullet(
				this.x,
				this.y,
				angle,
				damage,
				1.5,
				0.05,
				this.target
			));
		}
	}

	private createSpiralWave(projectileCount: number, damage: number) {
		const startAngle = Math.random() * Math.PI * 2;

		for (let i = 0; i < projectileCount; i++) {
			const angle = startAngle + (i / projectileCount) * Math.PI * 2 + Math.sin(i * 0.5) * 0.5;

			this.bullets.push(new WormBullet(
				this.x,
				this.y,
				angle,
				damage,
				1.2,
				0.08,
				this.target
			));
		}
	}

	private shootProjectiles() {
		const projectileCount = 2 + this.phase;
		const angleToPlayer = Math.atan2(this.target.y - this.y, this.target.x - this.x);
		const spread = Math.PI / 8;

		for (let i = 0; i < projectileCount; i++) {
			const angle = angleToPlayer + (Math.random() - 0.5) * spread;

			this.bullets.push(new WormBullet(
				this.x,
				this.y,
				angle,
				2 + this.phase,
				2,
				0.1,
				this.target
			));
		}
	}

	private spawnMinions() {
		// Создаем несколько мини-червей вокруг босса
		console.log("Spawning minions!");
		// Здесь будет логика создания миньонов
	}

	private updateBullets() {
		for (let i = this.bullets.length - 1; i >= 0; i--) {
			const bullet = this.bullets[i];
			bullet.update();

			// Проверяем столкновение с игроком
			if (bullet.isCollidingWith(this.target)) {
				const playerDMG = this.target.getHP();
				const bulletDMG = bullet.getHP();

				this.target.takeDamage(bulletDMG);
				bullet.takeDamage(playerDMG);
			}

			// Удаляем пули, которые слишком далеко улетели или умерли
			const distanceToEnemy = Math.sqrt(
				(bullet.x - this.x) ** 2 + (bullet.y - this.y) ** 2
			);

			if (bullet.isDead() || distanceToEnemy > 1000) {
				this.bullets.splice(i, 1);
			}
		}
	}

	private updateParticles() {
		for (let i = this.particleTrail.length - 1; i >= 0; i--) {
			const particle = this.particleTrail[i];
			particle.life--;
			particle.size *= 0.95;

			if (particle.life <= 0) {
				this.particleTrail.splice(i, 1);
			}
		}
	}

	private createChargeParticles() {
		for (let i = 0; i < 15; i++) {
			this.particleTrail.push({
				x: this.x + (Math.random() - 0.5) * 20,
				y: this.y + (Math.random() - 0.5) * 20,
				life: 15 + Math.random() * 15,
				size: 4 + Math.random() * 4
			});
		}
	}

	private createEmergenceParticles() {
		for (let i = 0; i < 25; i++) {
			const angle = Math.random() * Math.PI * 2;
			const distance = Math.random() * 25;
			this.particleTrail.push({
				x: this.x + Math.cos(angle) * distance,
				y: this.y + Math.sin(angle) * distance,
				life: 30 + Math.random() * 15,
				size: 3 + Math.random() * 5
			});
		}
	}

	render(ctx: CanvasRenderingContext2D): void {
		if (this.isBurrowing) {
			this.renderBurrowing(ctx);
		} else {
			this.renderParticles(ctx);
			this.renderBody(ctx);
			this.renderHead(ctx);
		}

		// Отрисовываем пули
		this.bullets.forEach(bullet => {
			bullet.render(ctx);
		});

		this.renderDebugInfo(ctx);
	}

	private renderParticles(ctx: CanvasRenderingContext2D) {
		this.particleTrail.forEach(particle => {
			const alpha = particle.life / 30;

			ctx.fillStyle = this.isCharging ?
				`rgba(255, 200, 0, ${alpha})` :
				`rgba(255, 100, 50, ${alpha})`;

			ctx.beginPath();
			ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
			ctx.fill();
		});
	}

	private renderBody(ctx: CanvasRenderingContext2D) {
		// Рисуем сегменты тела с градиентом цвета
		for (let i = 0; i < this.segments.length; i++) {
			const segment = this.segments[i];
			const progress = i / this.segments.length;

			// Градиент от красного (голова) к темно-красному (хвост)
			const red = 200 + Math.floor(55 * progress);
			const color = this.isCharging
				? `rgb(255, ${Math.floor(150 * progress)}, 0)`
				: `rgb(${red}, ${Math.floor(50 * progress)}, ${Math.floor(50 * progress)})`;

			ctx.fillStyle = this.damageFlashTimer > 0 ? '#ffffff' : color;

			// Размер сегментов уменьшается к хвосту
			const size = this.segmentSize * (1 - progress * 0.5);

			ctx.fillRect(
				segment.x - size / 2,
				segment.y - size / 2,
				size,
				size
			);

			// Добавляем обводку для механического вида
			ctx.strokeStyle = this.isCharging ? '#ff0' : '#333';
			ctx.lineWidth = 1;
			ctx.strokeRect(
				segment.x - size / 2,
				segment.y - size / 2,
				size,
				size
			);

			// Механические детали - болты
			if (i % 3 === 0) {
				ctx.fillStyle = '#333';
				ctx.fillRect(segment.x - 1, segment.y - 1, 2, 2);
			}
		}
	}

	private renderHead(ctx: CanvasRenderingContext2D) {
		const head = this.segments[0];
		const headSize = this.segmentSize * 1.5;

		// Основная голова
		ctx.fillStyle = this.damageFlashTimer > 0 ? '#ffffff' :
					   this.isCharging ? '#ff6600' : '#ff0000';
		ctx.fillRect(
			head.x - headSize / 2,
			head.y - headSize / 2,
			headSize,
			headSize
		);

		// Механические детали - датчики вместо глаз
		ctx.fillStyle = this.isCharging ? '#ffff00' : '#333333';

		// Верхние датчики
		ctx.fillRect(head.x - 4, head.y - headSize/2 + 2, 2, 3);
		ctx.fillRect(head.x + 2, head.y - headSize/2 + 2, 2, 3);

		// Боковые датчики
		ctx.fillRect(head.x - headSize/2 + 2, head.y - 1, 3, 2);
		ctx.fillRect(head.x + headSize/2 - 5, head.y - 1, 3, 2);

		// Центральный сенсор
		ctx.fillStyle = this.isCharging ? '#ffffff' : '#666666';
		ctx.fillRect(head.x - 1, head.y - 1, 2, 2);

		// Обводка
		ctx.strokeStyle = this.isCharging ? '#ff0' : '#333';
		ctx.lineWidth = 2;
		ctx.strokeRect(
			head.x - headSize / 2,
			head.y - headSize / 2,
			headSize,
			headSize
		);
	}

	private renderBurrowing(ctx: CanvasRenderingContext2D) {
		const alpha = 1 - this.burrowProgress;

		// Рисуем исчезающие сегменты
		for (let i = 0; i < this.segments.length; i++) {
			const segment = this.segments[i];
			const segmentAlpha = alpha * (1 - i / this.segments.length);

			if (segmentAlpha <= 0) continue;

			const progress = i / this.segments.length;
			const size = this.segmentSize * (1 - progress * 0.5) * segmentAlpha;

			ctx.fillStyle = `rgba(139, 69, 19, ${segmentAlpha})`;
			ctx.fillRect(
				segment.x - size / 2,
				segment.y - size / 2,
				size,
				size
			);
		}

		// Эффект земли
		ctx.fillStyle = `rgba(139, 69, 19, ${alpha * 0.3})`;
		ctx.beginPath();
		ctx.arc(this.x, this.y, 40 * alpha, 0, Math.PI * 2);
		ctx.fill();
	}

	private renderDebugInfo(ctx: CanvasRenderingContext2D) {
		ctx.fillStyle = '#fff';
		ctx.font = '12px Arial';
		ctx.fillText(`HP: ${this.getHP()}/${this.maxHP}`, this.x - 20, this.y - 30);
		ctx.fillText(`Phase: ${this.phase}`, this.x - 15, this.y - 45);

		if (this.isCharging) {
			ctx.fillStyle = '#ff0';
			ctx.fillText('CHARGING!', this.x - 25, this.y - 60);
		}

		if (this.isBurrowing) {
			ctx.fillStyle = '#8B4513';
			ctx.fillText('BURROWING!', this.x - 30, this.y - 60);
		}
	}

	takeDamage(damage: number): void {
		super.takeDamage(damage);
		this.damageFlashTimer = 8;

		// Создаем частицы при получении урона
		for (let i = 0; i < 3; i++) {
			this.particleTrail.push({
				x: this.x + (Math.random() - 0.5) * 15,
				y: this.y + (Math.random() - 0.5) * 15,
				life: 15 + Math.random() * 10,
				size: 2 + Math.random() * 2
			});
		}
	}

	protected updatePath() {
		// Босс использует более умный поиск пути
		if (!this.target.isDead()) {
			const distance = Math.sqrt(
				Math.pow(this.target.x - this.x, 2) + Math.pow(this.target.y - this.y, 2)
			);

			let targetX = this.target.x;
			let targetY = this.target.y;

			// В фазе 3 пытается держаться на средней дистанции
			if (this.phase === 3 && distance < 120) {
				const angle = Math.atan2(this.y - this.target.y, this.x - this.target.x);
				targetX = this.x + Math.cos(angle) * 150;
				targetY = this.y + Math.sin(angle) * 150;
			}

			this.path = Pathfinder.findPath(this.x, this.y, targetX, targetY, this.worldManager);

			if (this.path.length > 0) {
				this.path.shift();
			}
		}
	}
}

// Класс для пуль червя с авто-наведением
class WormBullet extends Bullet {
	private currentSpeed: number;
	private acceleration: number;
	private maxSpeed = 6;
	private homingStrength = 0.03;
	private homingActive = true;

	constructor(
		x: number,
		y: number,
		angle: number,
		hp: number,
		startSpeed: number,
		acceleration: number,
		public target: GameObject
	) {
		super(x, y, angle, hp);
		this.currentSpeed = startSpeed;
		this.acceleration = acceleration;
	}

	update() {
		// Умный авто-аим
		if (this.homingActive && this.target && !this.target.isDead()) {
			const targetAngle = Math.atan2(
				this.target.y - this.y,
				this.target.x - this.x
			);

			const currentAngle = this.angle % (2 * Math.PI);
			const normalizedTargetAngle = targetAngle % (2 * Math.PI);

			let angleDiff = normalizedTargetAngle - currentAngle;

			if (angleDiff > Math.PI) {
				angleDiff -= 2 * Math.PI;
			} else if (angleDiff < -Math.PI) {
				angleDiff += 2 * Math.PI;
			}

			const rotationSpeed = this.homingStrength * (1 + Math.abs(angleDiff) * 2);

			if (Math.abs(angleDiff) < rotationSpeed) {
				this.angle = targetAngle;
			} else {
				this.angle += Math.sign(angleDiff) * rotationSpeed;
			}

			this.angle = this.angle % (2 * Math.PI);

			// Отключаем авто-аим после достижения определенной скорости
			if (this.currentSpeed > this.maxSpeed * 0.6) {
				this.homingActive = false;
			}
		}

		// Ускорение
		this.currentSpeed = Math.min(this.currentSpeed + this.acceleration, this.maxSpeed);

		// Движение
		this.x += Math.cos(this.angle) * this.currentSpeed;
		this.y += Math.sin(this.angle) * this.currentSpeed;
	}

	render(ctx: CanvasRenderingContext2D): void {
		const speedRatio = this.currentSpeed / this.maxSpeed;
		let r, g, b;

		if (this.homingActive) {
			r = Math.floor(100 * speedRatio);
			g = Math.floor(150 * speedRatio);
			b = 200;
		} else {
			r = Math.floor(200 * speedRatio);
			g = Math.floor(100 * (1 - speedRatio));
			b = 50;
		}

		ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;

		const size = 2 + speedRatio * 3;
		ctx.fillRect(this.x - size / 2, this.y - size / 2, size, size);

		// Эффект "хвоста" для быстрых пуль
		if (speedRatio > 0.4) {
			ctx.strokeStyle = `rgb(${r}, ${g}, ${b}, ${0.3 + speedRatio * 0.4})`;
			ctx.lineWidth = size / 2;
			ctx.beginPath();
			ctx.moveTo(this.x, this.y);
			ctx.lineTo(
				this.x - Math.cos(this.angle) * (6 + speedRatio * 10),
				this.y - Math.sin(this.angle) * (6 + speedRatio * 10)
			);
			ctx.stroke();
		}
	}

	isCollidingWith(enemy: GameObject) {
		const radius = 3;

		return (
			this.x > enemy.x - radius &&
			this.y > enemy.y - radius &&
			this.x < enemy.x + radius &&
			this.y < enemy.y + radius
		);
	}
}
