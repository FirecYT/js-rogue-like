/**
 * Фазы обновления систем для гарантии правильного порядка выполнения.
 * Движение должно быть до коллизий, коллизии — до эффектов, эффекты — до UI.
 */
export enum UpdatePhase {
	Input = 0,
	Movement = 1,
	Collision = 2,
	Combat = 3,
	Effects = 4,
	Pickup = 5,
	Spawner = 6,
	Cleanup = 7,
	UI = 8,
}

/**
 * Базовый интерфейс для объектов, которые можно обновлять каждый кадр.
 */
export interface IUpdatable {
	update(): void;
}

/**
 * Базовый интерфейс для объектов, которые можно отрисовать на канвасе.
 */
export interface IRenderable {
	render(ctx: CanvasRenderingContext2D): void;
}

/**
 * Базовый интерфейс для объектов, освобождающих ресурсы при уничтожении.
 */
export interface IDisposable {
	dispose(): void;
}

/**
 * Интерфейс системы: обновляемый объект с фазой и возможностью включения/выключения.
 */
export interface ISystem extends IUpdatable, IDisposable {
	/** Фаза обновления для определения порядка выполнения. */
	readonly phase: UpdatePhase;
	/** Включена ли система в игровом цикле. */
	enabled: boolean;
}
