import type { GameContext } from './GameContext';
import type Entity from '../entities/Entity';
import { Crosshair } from '../ui/components/Crosshair';
import Keyboard from '../components/Keyboard';

/**
 * Главный класс игры: игровой цикл с фиксированным шагом и оркестрация
 * обновления/отрисовки. Сам не содержит игровой логики — только связывает
 * компоненты из GameContext.
 *
 * Логика обновляется фиксированными тиками 60 Гц (все игровые таймеры — в тиках),
 * отрисовка — каждый кадр requestAnimationFrame. Это гарантирует одинаковую
 * скорость игры на мониторах с любой частотой обновления.
 */
export class Game {
	/** Длительность одного логического тика, мс (60 Гц). */
	private static readonly TICK_MS = 1000 / 60;
	/**
	 * Максимальное время, «доигрываемое» за один кадр (защита от спирали смерти
	 * после приостановки вкладки: не пытаемся симулировать больше ~15 тиков).
	 */
	private static readonly MAX_CATCHUP_MS = 250;

	private running = false;
	private lastTime = 0;
	private accumulator = 0;

	/** Текущий показатель масштаба рендеринга (worldScale = 2 ** scale). */
	private scale = 0;
	/** Минимальный показатель масштаба (2^-1 = 0.5x). */
	private static readonly MIN_SCALE = -1;
	/** Максимальный показатель масштаба (2^2 = 4x). */
	private static readonly MAX_SCALE = 2;

	/**
	 * @param ctx - Контекст игры со всеми сервисами
	 */
	constructor(private readonly ctx: GameContext) {}

	/**
	 * Запускает игровой цикл.
	 */
	start(): void {
		if (this.running) return;
		// Камера стартует ровно на управляемой сущности, без «долёта» из (0, 0)
		this.ctx.camera.snapTo(this.ctx.controlSwitch.getCurrentControlled());
		this.running = true;
		this.lastTime = performance.now();
		requestAnimationFrame(this.tick);
	}

	/**
	 * Останавливает игровой цикл.
	 */
	stop(): void {
		this.running = false;
	}

	/**
	 * Освобождает ресурсы всех систем.
	 */
	dispose(): void {
		this.stop();
		this.ctx.systemManager.dispose();
		this.ctx.engine.dispose();
	}

	/**
	 * Кадр игрового цикла: накопление времени, фиксированные тики update, render.
	 * @param now - Timestamp из requestAnimationFrame
	 */
	private tick = (now: number): void => {
		if (!this.running) return;

		this.accumulator += Math.min(now - this.lastTime, Game.MAX_CATCHUP_MS);
		this.lastTime = now;

		while (this.accumulator >= Game.TICK_MS) {
			this.update();
			this.accumulator -= Game.TICK_MS;
		}

		this.render();
		requestAnimationFrame(this.tick);
	};

	/**
	 * Один логический тик: камера, мир, зум, системы (если не на паузе), UI, ввод.
	 */
	private update(): void {
		const { camera, mouse, worldService, screenManager, systemManager, controlSwitch } =
			this.ctx;
		const controlled = controlSwitch.getCurrentControlled();

		camera.update();
		camera.follow(controlled);
		worldService.update(controlled.x, controlled.y);

		// Обработка прокрутки колеса мыши для зума (с ограничением диапазона)
		if (mouse.wheelDelta !== 0) {
			this.scale = Math.min(
				Game.MAX_SCALE,
				Math.max(Game.MIN_SCALE, this.scale - mouse.wheelDelta)
			);
		}
		mouse.update();

		if (screenManager.isGamePaused()) {
			systemManager.updateWhilePaused();
		} else {
			systemManager.update();
		}

		screenManager.update();
		Keyboard.getInstance().update();
	}

	/**
	 * Отрисовка кадра: фон, мир, прицел, сущности, эффекты и тексты, UI.
	 */
	private render(): void {
		const { engine, camera, worldService, chunkView, systemManager, screenManager, controlSwitch, entityWorld } =
			this.ctx;
		const ctx = engine.context;
		const controlled = controlSwitch.getCurrentControlled();
		const worldScale = 2 ** this.scale;

		engine.clear();
		ctx.fillStyle = '#222';
		ctx.fillRect(0, 0, engine.canvas.width, engine.canvas.height);

		chunkView.render(
			worldService.getLoadedChunks(),
			ctx,
			camera.x,
			camera.y,
			engine.canvas.width,
			engine.canvas.height,
			worldScale
		);

		ctx.save();
		ctx.translate(
			Math.floor(engine.canvas.width / 2),
			Math.floor(engine.canvas.height / 2)
		);
		ctx.scale(worldScale, worldScale);
		const { offsetX, offsetY } = camera.getOffset();
		ctx.translate(offsetX, offsetY);

		if (!controlled.isDead()) {
			const mouseWorld = this.getMousePosition(controlled);
			Crosshair.render(ctx, controlled.x, controlled.y, mouseWorld.x, mouseWorld.y);
		}

		for (const entity of entityWorld.all) {
			if (!entity.isDead()) {
				entity.render(ctx);
			}
		}

		// Эффекты и всплывающие тексты рисуются поверх сущностей
		systemManager.render(ctx);

		ctx.restore();
		screenManager.render();
	}

	/**
	 * Возвращает мировые координаты курсора мыши.
	 * TODO(этап 2): учесть зум и lag камеры — сейчас предполагается scale=1
	 * и что управляемая сущность находится точно в центре экрана.
	 */
	private getMousePosition(controlled: Entity): { x: number; y: number } {
		return {
			x: this.ctx.mouse.x + controlled.x - this.ctx.engine.canvas.width / 2,
			y: this.ctx.mouse.y + controlled.y - this.ctx.engine.canvas.height / 2,
		};
	}
}
