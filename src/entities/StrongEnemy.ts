import Enemy from './Enemy';
import Bullet from '../Bullet';
import Cooldown from '../components/Cooldown';
import GameObject from '../components/GameObject';
import { WorldManager } from '../world/WorldManager';

export default class StrongEnemy extends Enemy {
	private attackCooldownTime = 180; // Атака каждые 3 секунды (60fps * 3)
	private attackCooldown: Cooldown;
	private bulletSpeed = 0.5; // Начальная скорость пуль
	private bulletAcceleration = 0.1; // Ускорение пуль
	private bulletSpread = Math.PI / 6; // Разброс пуль (30 градусов)
	private bullets: AcceleratingBullet[] = [];

	constructor(x: number, y: number, target: GameObject, worldManager: WorldManager) {
		super(x, y, target, worldManager);
		this.initHP(10);
		this.speed = 0.7;
		this.experience = 15;

		this.attackCooldown = new Cooldown(this.attackCooldownTime).onReady(() => {
			this.attack();
			this.attackCooldown.start();
		}).start();
	}

	update() {
		super.update();

		this.attackCooldown.update();
		this.updateBullets();
	}

	private attack() {
		const bulletCount = 8; // Количество пуль в круге
		const startAngle = Math.random() * Math.PI * 2; // Случайный начальный угол

		for (let i = 0; i < bulletCount; i++) {
			const angle = startAngle + (i / bulletCount) * Math.PI * 2;

			this.bullets.push(new AcceleratingBullet(
				this.x,
				this.y,
				angle,
				2, // HP пули
				this.bulletSpeed,
				this.bulletAcceleration,
				this.target
			));
		}
	}

	private updateBullets() {
		for (let i = this.bullets.length - 1; i >= 0; i--) {
			const bullet = this.bullets[i];
			bullet.update();

			// Удаляем пули, которые слишком далеко улетели или умерли
			const distanceToEnemy = Math.sqrt(
				(bullet.x - this.x) ** 2 + (bullet.y - this.y) ** 2
			);

			if (bullet.isDead() || distanceToEnemy > 1000) {
				this.bullets.splice(i, 1);
			}
		}
	}

	render(ctx: CanvasRenderingContext2D): void {
		// Отрисовываем самого врага (больше и другого цвета)
		ctx.fillStyle = '#f50'; // Оранжевый для сильного врага
		ctx.fillRect(this.x - 6, this.y - 6, 12, 12);

		// Отрисовываем индикатор атаки
		if (!this.attackCooldown.isReady()) {
			const progress = this.attackCooldown.progress();
			ctx.strokeStyle = '#ff0';
			ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.arc(this.x, this.y, 8, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
			ctx.stroke();
		}

		// Отрисовываем пули
		this.bullets.forEach(bullet => {
			bullet.render(ctx);
		});
	}

	takeDamage(damage: number): void {
		super.takeDamage(damage);
		// Можно добавить визуальный эффект при получении урона
	}
}

// Специальный класс для ускоряющихся пуль с умным авто-аимом
class AcceleratingBullet extends Bullet {
	private currentSpeed: number;
	private acceleration: number;
	private maxSpeed = 8;
	private homingStrength = 0.05; // Сила поворота
	private homingActive = true; // Авто-аим активен только первое время

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
		// Умный авто-аим как в старом коде пуль
		if (this.homingActive && this.target && !this.target.isDead()) {
			const targetAngle = Math.atan2(
				this.target.y - this.y,
				this.target.x - this.x
			);

			// Нормализуем углы в диапазон [0, 2π]
			const currentAngle = this.angle % (2 * Math.PI);
			const normalizedTargetAngle = targetAngle % (2 * Math.PI);

			// Находим разницу углов, учитывая переход через 0
			let angleDiff = normalizedTargetAngle - currentAngle;

			// Корректируем разницу для выбора кратчайшего пути
			if (angleDiff > Math.PI) {
				angleDiff -= 2 * Math.PI;
			} else if (angleDiff < -Math.PI) {
				angleDiff += 2 * Math.PI;
			}

			// Динамическая скорость поворота - быстрее на больших углах, плавнее на малых
			const rotationSpeed = this.homingStrength * (1 + Math.abs(angleDiff) * 2);

			if (Math.abs(angleDiff) < rotationSpeed) {
				this.angle = targetAngle;
			} else {
				this.angle += Math.sign(angleDiff) * rotationSpeed;
			}

			// Нормализуем угол
			this.angle = this.angle % (2 * Math.PI);

			// Отключаем авто-аим после достижения определенной скорости или времени
			if (this.currentSpeed > this.maxSpeed * 0.7) {
				this.homingActive = false;
			}
		}

		// Ускорение
		this.currentSpeed = Math.min(this.currentSpeed + this.acceleration, this.maxSpeed);

		// Движение
		this.x += Math.cos(this.angle) * this.currentSpeed;
		this.y += Math.sin(this.angle) * this.currentSpeed;

		if (this.isCollidingWith(this.target)) {
				const enemyDMG = this.target.getHP();
				const bulletDMG = this.getHP();

				this.target.takeDamage(bulletDMG);
				this.takeDamage(enemyDMG);
		}
	}

	render(ctx: CanvasRenderingContext2D): void {
		// Пули меняют цвет в зависимости от скорости и режима наведения
		const speedRatio = this.currentSpeed / this.maxSpeed;
		let r, g, b;

		if (this.homingActive) {
			// Синий цвет когда активно наведение
			r = Math.floor(100 * speedRatio);
			g = Math.floor(150 * speedRatio);
			b = 255;
		} else {
			// Красный цвет когда наведение отключено
			r = Math.floor(255 * speedRatio);
			g = Math.floor(150 * (1 - speedRatio));
			b = 0;
		}

		ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;

		// Размер пули зависит от скорости
		const size = 3 + speedRatio * 3;
		ctx.fillRect(this.x - size / 2, this.y - size / 2, size, size);

		// Эффект "хвоста" для быстрых пуль
		if (speedRatio > 0.3) {
			ctx.strokeStyle = `rgb(${r}, ${g}, ${b}, ${0.3 + speedRatio * 0.4})`;
			ctx.lineWidth = size / 2;
			ctx.beginPath();
			ctx.moveTo(this.x, this.y);
			ctx.lineTo(
				this.x - Math.cos(this.angle) * (8 + speedRatio * 12),
				this.y - Math.sin(this.angle) * (8 + speedRatio * 12)
			);
			ctx.stroke();
		}

		// Индикатор наведения (маленькая точка)
		if (this.homingActive && this.target) {
			ctx.fillStyle = '#0f0';
			ctx.fillRect(this.x - 1, this.y - 1, 2, 2);
		}
	}

	// Переопределяем коллизию для больших пуль
	isCollidingWith(enemy: GameObject) {
		const radius = 4; // Больший радиус для сильных пуль

		return pir(
			{ x: this.x, y: this.y },
			{
				x: enemy.x - radius,
				y: enemy.y - radius,
				width: radius * 2,
				height: radius * 2,
			}
		);
	}
}

// Нужно добавить функцию pir для проверки коллизий
function pir(
	point: { x: number; y: number },
	rect: { x: number; y: number; width: number; height: number }
) {
	return (
		point.x > rect.x &&
		point.y > rect.y &&
		point.x < rect.x + rect.width &&
		point.y < rect.y + rect.height
	);
}
