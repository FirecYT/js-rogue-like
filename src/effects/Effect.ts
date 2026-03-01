import Entity from '../entities/Entity';
import { WorldManager } from '../world/WorldManager';

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
	constructor(
		public x: number,
		public y: number,
		public angle: number,
		public source: Entity,
		public damage: number
	) { }

	/**
	 * Обновление эффекта за один кадр (движение, проверка попаданий и т.д.).
	 * @param enities - Список сущностей для проверки столкновений
	 * @param worldManager - Менеджер мира (опционально, для проверки стен)
	 */
	abstract update(enities: Entity[], worldManager?: WorldManager | null): void;

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

	/**
	 * Проходит ли эффект сквозь цель (не уничтожается при попадании). По умолчанию false.
	 * @param target - Цель
	 * @returns false по умолчанию; модификаторы могут переопределить
	 */
	shouldPassThrough(_target: Entity): boolean {
		return false;
	}
}
