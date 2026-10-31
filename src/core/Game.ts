import type Engine from '../components/Engine';
import type { Camera } from '../components/Camera';
import type { WorldService } from '../services/WorldService';
import type { ChunkViewManager } from '@firec/map-module';
import type { SystemManager } from '../services/SystemManager';
import type { ScreenManager } from '../ui/ScreenManager';
import type { ControlSwitchSystem } from '../systems/ControlSwitchSystem';
import type Entity from '../entities/Entity';
import type MouseInput from '../components/MouseInput';
import { Crosshair } from '../ui/components/Crosshair';
import Keyboard from '../components/Keyboard';

/**
 * Главный класс игры: оркестрирует системы и управляет жизненным циклом.
 * Следует SRP: сам не содержит игровой логики, только связывает компоненты.
 */
export class Game {
	private running = false;
	/** Текущий масштаб рендеринга (изменяется колесом мыши), worldScale = 2 ** scale. */
	private scale = 0;

	/** Минимальный показатель масштаба (2^-1 = 0.5x). */
	private static readonly MIN_SCALE = -1;
	/** Максимальный показатель масштаба (2^2 = 4x). */
	private static readonly MAX_SCALE = 2;

	/**
	 * @param engine - Движок игры
	 * @param camera - Камера для следования за игроком
	 * @param worldService - Сервис мира для обновления чанков
	 * @param viewManager - Менеджер рендеринга чанков
	 * @param systemManager - Менеджер систем для обновления и отрисовки всех систем
	 * @param screenManager - Менеджер экранов для UI
	 * @param controlSwitch - Система переключения управления
	 * @param entities - Массив всех сущностей для рендеринга
	 * @param mouse - Состояние мыши для прицела и прокрутки
	 */
	constructor(
		private readonly engine: Engine,
		private readonly camera: Camera,
		private readonly worldService: WorldService,
		private readonly viewManager: ChunkViewManager,
		private readonly systemManager: SystemManager,
		private readonly screenManager: ScreenManager,
		private readonly controlSwitch: ControlSwitchSystem,
		private readonly entities: Entity[],
		private readonly mouse: MouseInput
	) {}

	/**
	 * Запускает игровой цикл.
	 */
	start(): void {
		if (this.running) return;
		// Камера стартует ровно на управляемой сущности, без «долёта» из (0, 0)
		this.camera.snapTo(this.controlSwitch.getCurrentControlled());
		this.running = true;
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
		this.systemManager.dispose();
	}

	/**
	 * Один кадр игрового цикла: update и render.
	 */
	private tick = (): void => {
		if (!this.running) return;
		this.update();
		this.render();
		requestAnimationFrame(this.tick);
	};

	/**
	 * Обновление: камера, мир, зум, системы (если не на паузе), UI, ввод.
	 */
	private update(): void {
		const controlled = this.controlSwitch.getCurrentControlled();

		this.camera.update();
		this.camera.follow(controlled);
		this.worldService.update(controlled.x, controlled.y);

		// Обработка прокрутки колеса мыши для зума (с ограничением диапазона)
		if (this.mouse.wheelDelta !== 0) {
			this.scale = Math.min(
				Game.MAX_SCALE,
				Math.max(Game.MIN_SCALE, this.scale - this.mouse.wheelDelta)
			);
		}
		this.mouse.update();

		if (!this.screenManager.isGamePaused()) {
			this.systemManager.update();
		}

		this.screenManager.update();
		Keyboard.getInstance().update();
	}

	/**
	 * Рендеринг: фон, мир, прицел, сущности, эффекты и всплывающие тексты, UI.
	 */
	private render(): void {
		const controlled = this.controlSwitch.getCurrentControlled();
		const ctx = this.engine.context;

		this.engine.clear();
		ctx.fillStyle = '#222';
		ctx.fillRect(0, 0, this.engine.canvas.width, this.engine.canvas.height);

		const chunks = this.worldService.getLoadedChunks();
		this.viewManager.render(
			chunks,
			ctx,
			this.camera.x,
			this.camera.y,
			this.engine.canvas.width,
			this.engine.canvas.height,
			2 ** this.scale
		);

		ctx.save();
		ctx.translate(
			Math.floor(this.engine.canvas.width / 2),
			Math.floor(this.engine.canvas.height / 2)
		);
		ctx.scale(2 ** this.scale, 2 ** this.scale);
		const { offsetX, offsetY } = this.camera.getOffset();
		ctx.translate(offsetX, offsetY);

		if (!controlled.isDead()) {
			const mouseWorld = this.getMousePosition(controlled);
			Crosshair.render(ctx, controlled.x, controlled.y, mouseWorld.x, mouseWorld.y);
		}

		this.entities.forEach((entity: Entity) => {
			if (!entity.isDead()) {
				entity.render(ctx);
			}
		});

		// Эффекты и всплывающие тексты рисуются поверх сущностей
		this.systemManager.render(ctx);

		ctx.restore();
		this.screenManager.render();
	}

	/**
	 * Возвращает мировые координаты курсора мыши.
	 */
	private getMousePosition(controlled: Entity): { x: number; y: number } {
		return {
			x: this.mouse.x + controlled.x - this.engine.canvas.width / 2,
			y: this.mouse.y + controlled.y - this.engine.canvas.height / 2,
		};
	}
}
