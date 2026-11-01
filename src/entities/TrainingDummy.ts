import Entity from './Entity';
import { HasPosition } from '../types/EntityTraits';

/**
 * Тренировочный манекен: статичная сущность для тестирования урона.
 * Респавнится через N секунд после смерти, отображает последний полученный урон.
 */
export class TrainingDummy extends Entity implements HasPosition {
	/** Время до респавна в кадрах (3 секунды при 60 FPS). */
	private static readonly RESPAWN_TIME = 180;

	/** Манекен респавнится сам, поэтому не удаляется CleanupSystem. */
	public readonly persistent: boolean = true;

	private respawnTimer = 0;
	private lastDamage = 0;
	private lastDamageTimer = 0;

	/**
	 * @param x - Мировая координата X
	 * @param y - Мировая координата Y
	 * @param hp - Максимальное HP манекена
	 */
	constructor(x: number, y: number, hp = 100) {
		super(x, y, hp);
		this.width = 12;
		this.height = 12;
		// Манекен стоит на месте: не участвует в расталкивании
		this.solid = false;
	}

	/**
	 * Переопределяет takeDamage: запоминает последний урон и обновляет таймер.
	 * При смерти запускает таймер респавна.
	 * @param damage - Количество урона
	 * @param attacker - Сущность, нанёсшая урон (опционально)
	 */
	takeDamage(damage: number, attacker?: Entity): void {
		this.lastDamage = damage;
		this.lastDamageTimer = 60; // Показываем урон 1 секунду
		super.takeDamage(damage, attacker);
	}

	/**
	 * Обновляет таймеры респавна и отображения урона.
	 * При истечении таймера респавна восстанавливает HP.
	 */
	update(): void {
		if (this.lastDamageTimer > 0) {
			this.lastDamageTimer--;
		}

		if (this.isDead()) {
			this.respawnTimer--;
			if (this.respawnTimer <= 0) {
				this.respawn();
			}
		}
	}

	/**
	 * Восстанавливает HP и возвращает манекен на исходную позицию.
	 */
	private respawn(): void {
		this.hp = this.maxHP;
		this.x = this.spawnX;
		this.y = this.spawnY;
		this.respawnTimer = 0;
	}

	/**
	 * Переопределяет isDead: запускает таймер респавна при первой проверке смерти.
	 */
	isDead(): boolean {
		const dead = super.isDead();
		if (dead && this.respawnTimer === 0) {
			this.respawnTimer = TrainingDummy.RESPAWN_TIME;
		}
		return dead;
	}

	/**
	 * Отрисовка: коричневый квадрат с полоской HP, при смерти — серый с таймером.
	 * @param ctx - Контекст канваса
	 */
	render(ctx: CanvasRenderingContext2D): void {
		if (this.isDead()) {
			// Мёртвый манекен: серый квадрат с таймером респавна
			ctx.fillStyle = '#555';
			ctx.fillRect(
				this.x - this.width / 2,
				this.y - this.height / 2,
				this.width,
				this.height
			);
			ctx.fillStyle = '#fff';
			ctx.font = '10px Arial';
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			const seconds = Math.ceil(this.respawnTimer / 60);
			ctx.fillText(`${seconds}s`, this.x, this.y);
			return;
		}

		// Живой манекен: коричневый квадрат
		ctx.fillStyle = '#8b4513';
		ctx.fillRect(
			this.x - this.width / 2,
			this.y - this.height / 2,
			this.width,
			this.height
		);

		// Обводка
		ctx.strokeStyle = '#654321';
		ctx.lineWidth = 2;
		ctx.strokeRect(
			this.x - this.width / 2,
			this.y - this.height / 2,
			this.width,
			this.height
		);

		// Полоска HP
		const hpPercent = this.getHP() / this.maxHP;
		const barWidth = 30;
		const barHeight = 4;
		const barX = this.x - barWidth / 2;
		const barY = this.y - this.height / 2 - 8;

		ctx.fillStyle = '#000';
		ctx.fillRect(barX, barY, barWidth, barHeight);
		ctx.fillStyle = '#0f0';
		ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);

		// Отображение последнего урона
		if (this.lastDamageTimer > 0 && this.lastDamage > 0) {
			ctx.fillStyle = '#ff0';
			ctx.font = '12px Arial';
			ctx.textAlign = 'center';
			ctx.textBaseline = 'bottom';
			ctx.fillText(
				`-${this.lastDamage}`,
				this.x,
				this.y - this.height / 2 - 10
			);
		}

		// Подпись
		ctx.fillStyle = '#fff';
		ctx.font = '10px Arial';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'top';
		ctx.fillText('Dummy', this.x, this.y + this.height / 2 + 2);
	}
}
