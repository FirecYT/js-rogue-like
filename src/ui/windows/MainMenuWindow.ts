import { Window } from '../Window';
import { Label } from '../components/Label';
import { Button } from '../components/Button';
import { VerticalLayout } from '../containers/VerticalLayout';

/** Обработчики кнопок главного меню. */
export interface MainMenuHandlers {
	newRun: () => void;
	continueRun: () => void;
	journal: () => void;
	stats: () => void;
	settings: () => void;
}

/**
 * Главное меню: новый забег, продолжение из слота, журнал,
 * статистика и настройки поверх attract-камеры.
 */
export class MainMenuWindow extends Window {
	/**
	 * @param canvasWidth - Ширина канваса
	 * @param canvasHeight - Высота канваса
	 * @param handlers - Обработчики кнопок
	 */
	constructor(
		canvasWidth: number,
		canvasHeight: number,
		handlers: MainMenuHandlers
	) {
		super();
		this.title = '';
		this.causesPause = true;

		const layout = new VerticalLayout();
		layout.spacing = 12;
		layout.padding = { top: 40, right: 40, bottom: 40, left: 40 };

		const title = new Label('РУИНЫ ПУСТОТЫ');
		title.setFontSize(30);
		layout.addChild(title);
		const subtitle = new Label(
			'меню: новый забег продолжит историю мира',
			320
		);
		subtitle.setFontSize(13);
		subtitle.setColor('#8899aa');
		layout.addChild(subtitle);

		const add = (text: string, onClick: () => void): void => {
			const button = new Button(text, 280, 36);
			button.setOnClick(onClick);
			layout.addChild(button);
		};
		add('Новый забег', handlers.newRun);
		add('Продолжить…', handlers.continueRun);
		add('Журнал', handlers.journal);
		add('Статистика', handlers.stats);
		add('Настройки', handlers.settings);

		this.root.addChild(layout);
		this.autoSize();
		this.centerWindow(canvasWidth, canvasHeight);
	}
}
