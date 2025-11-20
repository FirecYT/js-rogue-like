import GameObject from '../../components/GameObject';
import { Pathfinder } from '../../world/Pathfinding';
import { WorldManager } from '../../world/WorldManager';

interface WormSegment {
	x: number;
	y: number;
	size: number;
	followTarget: { x: number, y: number } | null;
}

export default class WormBoss extends GameObject {
	private segments: WormSegment[] = [];
	private target: GameObject;
	private worldManager: WorldManager;
	private segmentCount: number;
	private segmentDistance = 15;
	private moveSpeed = 1.5;
	private pathUpdateCooldown = 0;
	private path: { x: number, y: number }[] = [];
	public experience = 1000;

	constructor(x: number, y: number, target: GameObject, worldManager: WorldManager, segmentCount = 5) {
		super(x, y, 500); // Много HP
		this.target = target;
		this.worldManager = worldManager;
		this.segmentCount = segmentCount;

		// Инициализируем сегменты
		this.initializeSegments(x, y);
	}

	private initializeSegments(startX: number, startY: number) {
		// Голова - самый большой сегмент
		this.segments.push({
			x: startX,
			y: startY,
			size: 20,
			followTarget: null
		});

		// Остальные сегменты (уменьшаются к хвосту)
		for (let i = 1; i < this.segmentCount; i++) {
			const size = 20 - i * 2; // Уменьшаем размер
			this.segments.push({
				x: startX - i * this.segmentDistance,
				y: startY,
				size: Math.max(8, size), // Минимальный размер 8
				followTarget: null
			});
		}
	}

	update() {
		this.updateHead();
		this.updateBodySegments();
		this.checkCollisions();
	}

	private updateHead() {
		const head = this.segments[0];

		// Обновляем путь к цели
		this.pathUpdateCooldown--;
		if (this.pathUpdateCooldown <= 0 || this.path.length === 0) {
			this.updatePath();
			this.pathUpdateCooldown = 45; // Реже обновляем путь для производительности
		}

		// Двигаем голову
		this.followPath(head);

		// Обновляем позицию босса (совпадает с головой)
		this.x = head.x;
		this.y = head.y;
	}

	private updatePath() {
		this.path = Pathfinder.findPath(
			this.segments[0].x, this.segments[0].y,
			this.target.x, this.target.y,
			this.worldManager
		);

		if (this.path.length > 0) {
			this.path.shift(); // Убираем текущую позицию
		}
	}

	private followPath(head: WormSegment) {
		if (this.path.length === 0) {
			// Если пути нет, двигаемся напрямую к цели
			const dx = this.target.x - head.x;
			const dy = this.target.y - head.y;
			const distance = Math.sqrt(dx * dx + dy * dy);

			if (distance > 0) {
				head.x += (dx / distance) * this.moveSpeed;
				head.y += (dy / distance) * this.moveSpeed;
			}
			return;
		}

		const nextPoint = this.path[0];
		const dx = nextPoint.x - head.x;
		const dy = nextPoint.y - head.y;
		const distance = Math.sqrt(dx * dx + dy * dy);

		if (distance < 15) {
			this.path.shift();
		} else {
			const angle = Math.atan2(dy, dx);
			head.x += Math.cos(angle) * this.moveSpeed;
			head.y += Math.sin(angle) * this.moveSpeed;
		}
	}

	private updateBodySegments() {
		// Каждый сегмент следует за предыдущим
		for (let i = 1; i < this.segments.length; i++) {
			const currentSegment = this.segments[i];
			const targetSegment = this.segments[i - 1];

			const dx = targetSegment.x - currentSegment.x;
			const dy = targetSegment.y - currentSegment.y;
			const distance = Math.sqrt(dx * dx + dy * dy);

			if (distance > this.segmentDistance) {
				// Плавное движение к целевому сегменту
				const moveDistance = Math.min(distance - this.segmentDistance, this.moveSpeed * 0.8);
				const angle = Math.atan2(dy, dx);

				currentSegment.x += Math.cos(angle) * moveDistance;
				currentSegment.y += Math.sin(angle) * moveDistance;
			}

			// Небольшое случайное колебание для реалистичности
			if (Math.random() < 0.1) {
				currentSegment.x += (Math.random() - 0.5) * 0.5;
				currentSegment.y += (Math.random() - 0.5) * 0.5;
			}
		}
	}

	private checkCollisions() {
		// Проверяем столкновение головы с игроком
		const head = this.segments[0];
		const dx = head.x - this.target.x;
		const dy = head.y - this.target.y;
		const distance = Math.sqrt(dx * dx + dy * dy);

		if (distance < head.size / 2 + 5) { // 5 - радиус игрока
			// Наносим урон игроку
			this.target.takeDamage(10);
		}
	}

	takeDamage(damage: number): void {
		super.takeDamage(damage);

		// Эффект при получении урона - все сегменты мигают красным
		// (реализуется через переменную состояния в render)
	}

	render(ctx: CanvasRenderingContext2D): void {
		const isHurting = this.getHP() < 300; // Мигает при низком HP

		// Рендерим сегменты от хвоста к голове (чтобы голова была поверх)
		for (let i = this.segments.length - 1; i >= 0; i--) {
			const segment = this.segments[i];

			// Цвет зависит от сегмента и состояния
			let color: string;
			if (isHurting && Math.floor(Date.now() / 200) % 2 === 0) {
				color = '#f00'; // Красный при получении урона
			} else {
				// Градиент от темно-зеленого к светло-зеленому
				const intensity = 100 + Math.floor(155 * (i / this.segments.length));
				color = `rgb(0, ${intensity}, 0)`;
			}

			ctx.fillStyle = color;

			// Рисуем сегмент как закругленный прямоугольник
			this.drawWormSegment(ctx, segment.x, segment.y, segment.size);

			// Глаза на голове
			if (i === 0) {
				this.drawEyes(ctx, segment.x, segment.y, segment.size);
			}
		}

		// Полоска здоровья над головой
		this.drawHealthBar(ctx);
	}

	private drawWormSegment(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
		ctx.beginPath();
		ctx.ellipse(x, y, size / 2, size / 1.5, 0, 0, Math.PI * 2);
		ctx.fill();

		// Контур
		ctx.strokeStyle = '#000';
		ctx.lineWidth = 1;
		ctx.stroke();
	}

	private drawEyes(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
		const eyeSize = size / 4;
		const eyeOffset = size / 3;

		// Белки глаз
		ctx.fillStyle = '#fff';
		ctx.beginPath();
		ctx.arc(x - eyeOffset, y - eyeOffset, eyeSize, 0, Math.PI * 2);
		ctx.arc(x + eyeOffset, y - eyeOffset, eyeSize, 0, Math.PI * 2);
		ctx.fill();

		// Зрачки (смотрят на игрока)
		ctx.fillStyle = '#000';
		const angle = Math.atan2(this.target.y - y, this.target.x - x);
		const pupilOffset = eyeSize * 0.3;

		ctx.beginPath();
		ctx.arc(
			x - eyeOffset + Math.cos(angle) * pupilOffset,
			y - eyeOffset + Math.sin(angle) * pupilOffset,
			eyeSize / 2, 0, Math.PI * 2
		);
		ctx.arc(
			x + eyeOffset + Math.cos(angle) * pupilOffset,
			y - eyeOffset + Math.sin(angle) * pupilOffset,
			eyeSize / 2, 0, Math.PI * 2
		);
		ctx.fill();
	}

	private drawHealthBar(ctx: CanvasRenderingContext2D) {
		const head = this.segments[0];
		const barWidth = 60;
		const barHeight = 6;
		const x = head.x - barWidth / 2;
		const y = head.y - head.size - 15;

		// Фон полоски
		ctx.fillStyle = '#333';
		ctx.fillRect(x, y, barWidth, barHeight);

		// Здоровье
		const healthPercent = this.getHP() / 500;
		ctx.fillStyle = healthPercent > 0.6 ? '#0f0' : healthPercent > 0.3 ? '#ff0' : '#f00';
		ctx.fillRect(x, y, barWidth * healthPercent, barHeight);

		// Контур
		ctx.strokeStyle = '#000';
		ctx.lineWidth = 1;
		ctx.strokeRect(x, y, barWidth, barHeight);
	}

	isCollidingWithBullet(bulletX: number, bulletY: number, bulletSize = 2): boolean {
		// Проверяем столкновение с любым сегментом
		for (const segment of this.segments) {
			const dx = segment.x - bulletX;
			const dy = segment.y - bulletY;
			const distance = Math.sqrt(dx * dx + dy * dy);

			if (distance < segment.size / 2 + bulletSize) {
				return true;
			}
		}
		return false;
	}
}
