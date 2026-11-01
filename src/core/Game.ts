import type { GameContext } from './GameContext';
import { Crosshair } from '../ui/components/Crosshair';
import Keyboard from '../components/Keyboard';
import { PauseWindow } from '../ui/windows/PauseWindow';
import { RunResultsWindow } from '../ui/windows/RunResultsWindow';

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
		const { camera, mouse, worldService, screenManager, systemManager, controlSwitch, flow } =
			this.ctx;

		// Главное меню: attract-камера кружит над миром, симуляция стоит
		if (flow.state === 'menu') {
			flow.menuTicks++;
			const angle = flow.menuTicks * 0.0016;
			camera.setFollowPoint(Math.cos(angle) * 6200, Math.sin(angle) * 6200);
			camera.update();
			worldService.update(camera.x, camera.y);
			mouse.update();
			screenManager.update();
			Keyboard.getInstance().update();
			return;
		}

		const controlled = controlSwitch.getCurrentControlled();

		camera.update();
		camera.follow(controlled);
		worldService.update(controlled.x, controlled.y);

		// Зум колесом мыши (диапазон ограничен внутри Camera)
		if (mouse.wheelDelta !== 0) {
			camera.zoomBySteps(mouse.wheelDelta);
		}
		mouse.update();

		if (screenManager.isGamePaused()) {
			systemManager.updateWhilePaused();
		} else {
			systemManager.update();
		}

		screenManager.update();
		const keyboard = Keyboard.getInstance();

		// Esc: закрыть верхнее окно, иначе пауза (итогы не закрываются)
		if (flow.state === 'playing' && keyboard.isKeyPressedOnce('Escape')) {
			const top = screenManager.getTopWindow();
			if (top instanceof RunResultsWindow) {
				// итоги забега не закрываются Esc
			} else if (top instanceof PauseWindow) {
				screenManager.closeWindow(top);
			} else if (top) {
				screenManager.closeWindow(top);
			} else {
				screenManager.openWindow(this.ctx.createPauseWindow());
			}
		}

		// Смерть управляемой сущности без перерождения — итоги забега
		if (flow.state === 'playing' && controlled.isDead()) {
			flow.state = 'ended';
			this.ctx.stats.endRun(true);
			screenManager.openWindow(this.ctx.createResultsWindow());
		}

		keyboard.update();
	}

	/**
	 * Отрисовка кадра: фон, мир, прицел, сущности, эффекты и тексты, UI.
	 */
	private render(): void {
		const { engine, camera, worldService, chunkView, systemManager, screenManager, controlSwitch, entityWorld, mouse } =
			this.ctx;
		const ctx = engine.context;
		const controlled = controlSwitch.getCurrentControlled();
		const worldScale = camera.zoom;

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

		const inMenu = this.ctx.flow.state === 'menu';
		if (!inMenu && !controlled.isDead()) {
			const mouseWorld = camera.screenToWorld(mouse.x, mouse.y);
			Crosshair.render(ctx, controlled.x, controlled.y, mouseWorld.x, mouseWorld.y);
		}

		if (!inMenu) {
			for (const entity of entityWorld.all) {
				if (!entity.isDead()) {
					entity.render(ctx);
				}
			}
		}

		// Эффекты и всплывающие тексты рисуются поверх сущностей
		systemManager.render(ctx);

		ctx.restore();
		screenManager.render();
	}

}
