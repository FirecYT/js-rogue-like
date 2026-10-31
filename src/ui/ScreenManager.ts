import Engine from '../components/Engine';
import MouseInput from '../components/MouseInput';
import { Window } from './Window';
import { HudScreen } from './windows/HudScreen';
import { Tooltip } from './components/Tooltip';
import Entity from '../entities/Entity';

/**
 * Менеджер экранов и окон
 * Центральная точка управления всем UI
 */
export class ScreenManager {
	private windows: Window[] = [];
	private hud: HudScreen;
	private mouse: MouseInput;

	/**
	 * Создать менеджер экранов
	 * @param engine Движок игры
	 * @param mouse Входные данные мыши
	 * @param getControlledEntity Функция получения управляемой сущности
	 */
	constructor(
		private engine: Engine,
		mouse: MouseInput,
		getControlledEntity: () => Entity
	) {
		this.mouse = mouse;
		this.hud = new HudScreen(engine, getControlledEntity);
	}

	/**
	 * Открыть окно
	 * @param window Окно для открытия
	 */
	openWindow(window: Window): void {
		this.windows.push(window);
	}

	/**
	 * Закрыть окно
	 * @param window Окно для закрытия
	 */
	closeWindow(window: Window): void {
		const index = this.windows.indexOf(window);
		if (index !== -1) {
			this.windows.splice(index, 1);
		}
	}

	/**
	 * Проверяет, открыто ли окно указанного типа
	 * @param windowClass Класс окна для проверки
	 * @returns true, если такое окно открыто
	 */
	isWindowOpen<T extends Window>(
		windowClass: new (...args: never[]) => T
	): boolean {
		return this.windows.some((win) => win instanceof windowClass);
	}

	/**
	 * Закрывает все окна указанного типа
	 * @param windowClass Класс окна для закрытия
	 */
	closeWindowsOfType<T extends Window>(
		windowClass: new (...args: never[]) => T
	): void {
		for (let i = this.windows.length - 1; i >= 0; i--) {
			if (this.windows[i] instanceof windowClass) {
				this.windows.splice(i, 1);
			}
		}
	}

	/**
	 * Нужно ли ставить игру на паузу
	 * @returns true, если открыто хотя бы одно окно с паузой
	 */
	isGamePaused(): boolean {
		for (const window of this.windows) {
			if (window.causesPause) {
				return true;
			}
		}
		return false;
	}

	/**
	 * Список открытых окон (для отладки и смоук-тестов).
	 * @returns Массив открытых окон
	 */
	getWindows(): Window[] {
		return this.windows;
	}

	/**
	 * Обновляет HUD и все открытые окна (снизу вверх).
	 */
	update(): void {
		this.hud.update(this.mouse);
		for (const window of this.windows) {
			window.update(this.mouse);
		}
	}

	/**
	 * Отрисовывает HUD и окна (снизу вверх); для верхнего окна — подсказку при наведении.
	 */
	render(): void {
		this.hud.render(this.engine.context);

		if (this.windows.length > 0) {
			// Затемнение фона под модальными окнами (один слой на весь стек)
			this.engine.context.fillStyle = '#0008';
			this.engine.context.fillRect(
				0,
				0,
				this.engine.canvas.width,
				this.engine.canvas.height
			);
		}
		for (const window of this.windows) {
			window.render(this.engine.context);
		}

		if (this.windows.length > 0) {
			const tooltip = this.windows[this.windows.length - 1].getTooltip();

			if (tooltip) {
				Tooltip.render(
					this.engine.context,
					tooltip.text,
					this.mouse.x,
					this.mouse.y
				);
			}
		}
	}

	/**
	 * Получить ссылку на HUD
	 * @returns HUD-экран
	 */
	getHud(): HudScreen {
		return this.hud;
	}
}
