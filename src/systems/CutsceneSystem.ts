import type { ISystem } from '../core/interfaces';
import { UpdatePhase } from '../core/interfaces';
import { eventBus } from '../events/EventBus';
import type { ScreenManager } from '../ui/ScreenManager';
import type Engine from '../components/Engine';
import { CutsceneWindow } from '../ui/windows/CutsceneWindow';
import type { InputMapper } from '../input/InputMapper';
import { InputAction } from '../input/InputAction';

/**
 * Система катсцен: подписана на cutsceneStart, отображает CutsceneWindow.
 * Завершает катсцену по окончании реплик или по клавише Skip.
 */
export class CutsceneSystem implements ISystem {
	public readonly phase = UpdatePhase.UI;
	public enabled = true;

	private activeWindow: CutsceneWindow | null = null;

	/**
	 * @param screenManager - Менеджер экранов для открытия/закрытия окон
	 * @param engine - Движок для получения размеров канваса
	 * @param input - Маппер действий для клавиши пропуска
	 */
	constructor(
		private readonly screenManager: ScreenManager,
		private readonly engine: Engine,
		private readonly input: InputMapper
	) {
		this.setupEventListeners();
	}

	/**
	 * Подписывается на cutsceneStart и создаёт CutsceneWindow.
	 */
	private setupEventListeners(): void {
		eventBus.on('cutsceneStart', ({ lines }) => {
			this.startCutscene(lines);
		});
	}

	/**
	 * Запускает катсцену: создаёт окно и регистрирует обработчик завершения.
	 * @param lines - Массив строк катсцены
	 */
	private startCutscene(lines: string[]): void {
		// Закрываем предыдущую катсцену, если есть
		if (this.activeWindow) {
			this.screenManager.closeWindow(this.activeWindow);
		}

		const win = new CutsceneWindow(
			lines,
			this.engine.canvas.width,
			this.engine.canvas.height
		);

		win.setOnComplete(() => {
			this.screenManager.closeWindow(win);
			this.activeWindow = null;
		});

		this.screenManager.openWindow(win);
		this.activeWindow = win;
	}

	/**
	 * Обработка клавиши Interact (E) — переход к следующей реплике.
	 */
	update(): void {
		if (!this.activeWindow) return;
		if (this.input.isPressed(InputAction.Interact)) {
			this.activeWindow.nextLine();
		}
	}

	/**
	 * Освобождение ресурсов.
	 */
	dispose(): void {
		if (this.activeWindow) {
			this.screenManager.closeWindow(this.activeWindow);
			this.activeWindow = null;
		}
	}
}
