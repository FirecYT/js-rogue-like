import { Window } from '../Window';
import { Button } from '../components/Button';
import { VerticalLayout } from '../containers/VerticalLayout';

/** Обработчики кновок меню паузы. */
export interface PauseHandlers {
	resume: () => void;
	save: () => void;
	journal: () => void;
	stats: () => void;
	settings: () => void;
	quit: () => void;
}

/**
 * Меню паузы (Esc во время забега): продолжить, сохранить, журнал,
 * статистика, настройки и выход в главное меню.
 */
export class PauseWindow extends Window {
	/**
	 * @param canvasWidth - Ширина канваса
	 * @param canvasHeight - Высота канваса
	 * @param handlers - Обработчики кнопок
	 */
	constructor(
		canvasWidth: number,
		canvasHeight: number,
		handlers: PauseHandlers
	) {
		super();
		this.title = 'Пауза';
		this.causesPause = true;

		const layout = new VerticalLayout();
		layout.spacing = 10;
		layout.padding = { top: 40, right: 30, bottom: 20, left: 30 };

		const add = (text: string, onClick: () => void): void => {
			const button = new Button(text, 260, 34);
			button.setOnClick(onClick);
			layout.addChild(button);
		};
		add('Продолжить', handlers.resume);
		add('Сохранить…', handlers.save);
		add('Журнал', handlers.journal);
		add('Статистика', handlers.stats);
		add('Настройки', handlers.settings);
		add('Выйти в меню', handlers.quit);

		this.root.addChild(layout);
		this.autoSize();
		this.centerWindow(canvasWidth, canvasHeight);
	}
}
