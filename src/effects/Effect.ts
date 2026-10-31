import Entity from '../entities/Entity';
import type { WorldService } from '../services/WorldService';
import type { Team } from '../types/Team';

/**
 * Базовый класс игрового эффекта (снаряд, луч, зона, взрыв): позиция, угол, источник, урон, update/render/isDead.
 */
export abstract class Effect {
	/**
	 * @param x - Мировая координата X
	 * @param y - Мировая координата Y
	 * @param angle - Угол в радианах
	 * @param source - Сущность-источник
	 * @param damage - Урон при попадании
	 */
	/** Фракция источника: эффект не поражает сущностей своей команды. */
	public readonly team: Team;

	constructor(
		public x: number,
		public y: number,
		public angle: number,
		public source: Entity,
		public damage: number
	) {
		this.team = source.team;
	}

	/**
	 * Проверяет, может ли эффект поразить сущность: живая, поражаемая,
	 * не источник выстрела и враждебной фракции.
	 * @param entity - Кандидат на поражение
	 */
	canHit(entity: Entity): boolean {
		return (
			entity !== this.source &&
			!entity.isDead() &&
			entity.targetable &&
			entity.team !== this.team
		);
	}

	/**
	 * Обновление эффекта за один кадр (движение, проверка попаданий и т.д.).
	 * @param entities - Список сущностей (read-only) для проверки столкновений
	 * @param world - Сервис мира для проверки коллизий с тайлами
	 */
	abstract update(entities: readonly Entity[], world?: WorldService): void;

	/**
	 * Отрисовка эффекта на канвасе.
	 * @param ctx - Контекст канваса
	 */
	abstract render(ctx: CanvasRenderingContext2D): void;

	/**
	 * Нужно ли удалить эффект из системы.
	 * @returns true, если эффект завершил жизнь
	 */
	abstract isDead(): boolean;

	/** Вызывается при попадании в цель */
	onHit?(target: Entity): void;
	/** Вызывается при «смерти» эффекта */
	onDeath?(): void;

	/** Проходит ли эффект сквозь цели (данные, а не переопределение метода). */
	public pierce = false;

	/**
	 * Синусоидальное отклонение траектории: амплитуда (px) и частота (рад/тик).
	 * null — прямолинейное движение. Задаётся модификаторами как данные.
	 */
	public wave: { amplitude: number; frequency: number } | null = null;

	/** Фаза синусоидального отклонения (накапливается при обновлении). */
	protected wavePhase = 0;

	/**
	 * Применяет синусоидальное отклонение к позиции эффекта
	 * (перпендикулярно направлению движения). Вызывается из update() снарядов.
	 */
	protected applyWave(): void {
		if (!this.wave) return;
		const offset = Math.cos(this.wavePhase) * this.wave.amplitude;
		this.x += -Math.sin(this.angle) * offset;
		this.y += Math.cos(this.angle) * offset;
		this.wavePhase += this.wave.frequency;
	}
}
