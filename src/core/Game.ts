import type Engine from '../components/Engine';
import type { Camera } from '../components/Camera';
import type { WorldService } from '../services/WorldService';
import type { ChunkViewManager } from '@firec/map-module';
import type { SystemManager } from '../services/SystemManager';
import type { ScreenManager } from '../ui/ScreenManager';
import type { ControlSwitchSystem } from '../systems/ControlSwitchSystem';
import type { EffectSystem } from '../systems/EffectSystem';
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
	/** Текущий масштаб рендеринга (изменяется колесом мыши) */
	private scale = 0;

	/**
	 * @param engine - Движок игры
	 * @param camera - Камера для следования за игроком
	 * @param worldService - Сервис мира для обновления чанков
	 * @param viewManager - Менеджер рендеринга чанков
	 * @param systemManager - Менеджер систем для обновления всех систем
	 * @param screenManager - Менеджер экранов для UI
	 * @param controlSwitch - Система переключения управления
	 * @param effectSystem - Система эффектов для рендеринга
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
		private readonly effectSystem: EffectSystem,
		private readonly entities: Entity[],
		private readonly mouse: MouseInput
	) {}

	/**
	 * Запускает игровой цикл.
	 */
	start(): void {
		if (this.running) return;
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
	 * Обновление: камера, мир, системы, UI, ввод.
	 */
	private update(): void {
		const controlled = this.controlSwitch.getCurrentControlled();

		this.camera.update();
		this.camera.follow(controlled);
		this.worldService.update(controlled.x, controlled.y);

		// Обработка прокрутки колеса мыши для зума
		if (this.mouse.wheelDelta !== 0) {
			this.scale -= this.mouse.wheelDelta;
			this.mouse.update();
		}

		if (!this.screenManager.hasActiveWindows()) {
			this.systemManager.update();
		}

		this.screenManager.update();
		Keyboard.getInstance().update();
	}

	/**
	 * Рендеринг: фон, мир, прицел, эффекты, сущности, всплывающие тексты, UI.
	 */
	private render(): void {
		const controlled = this.controlSwitch.getCurrentControlled();

		this.engine.clear();
		this.engine.context.fillStyle = '#222';
		this.engine.context.fillRect(
			0,
			0,
			this.engine.canvas.width,
			this.engine.canvas.height
		);

		const chunks = this.worldService.getLoadedChunks();
		this.viewManager.render(
			chunks,
			this.engine.context,
			this.camera.x,
			this.camera.y,
			this.engine.canvas.width,
			this.engine.canvas.height,
			2 ** this.scale
		);

		this.engine.context.save();
		this.engine.context.translate(
			Math.floor(this.engine.canvas.width / 2),
			Math.floor(this.engine.canvas.height / 2)
		);
		this.engine.context.scale(2 ** this.scale, 2 ** this.scale);
		const { offsetX, offsetY } = this.camera.getOffset();
		this.engine.context.translate(offsetX, offsetY);

		if (!controlled.isDead()) {
			const mouseWorld = this.getMousePosition(controlled);
			Crosshair.render(
				this.engine.context,
				controlled.x,
				controlled.y,
				mouseWorld.x,
				mouseWorld.y
			);
		}

		this.effectSystem.render(this.engine.context);

		this.entities.forEach((entity: Entity) => {
			if (!entity.isDead()) {
				entity.render(this.engine.context);
			}
		});

		this.engine.context.restore();
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
