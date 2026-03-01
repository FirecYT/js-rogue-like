/**
 * Базовый игровой объект с позицией, здоровьем и отрисовкой.
 */
export default abstract class GameObject {
	public maxHP: number;

	/**
	 * @param x - Мировая координата X
	 * @param y - Мировая координата Y
	 * @param hp - Начальное и максимальное здоровье (по умолчанию 1)
	 */
	constructor(
		public x: number,
		public y: number,
		protected hp = 1
	) {
		this.maxHP = hp;
	}

	/**
	 * Отрисовка объекта на канвасе.
	 * @param ctx - Контекст канваса
	 */
	abstract render(ctx: CanvasRenderingContext2D): void;

	/**
	 * Проверяет, мёртв ли объект (HP <= 0).
	 * @returns true, если объект мёртв
	 */
	isDead(): boolean {
		return this.hp <= 0;
	}

	/**
	 * Возвращает текущее здоровье.
	 * @returns Текущее HP
	 */
	getHP(): number {
		return this.hp;
	}

	/**
	 * Наносит урон объекту.
	 * @param damage - Количество урона
	 */
	takeDamage(damage: number): void {
		this.hp -= damage;
	}
}
