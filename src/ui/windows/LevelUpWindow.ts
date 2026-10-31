import { Window } from '../Window';
import { Button } from '../components/Button';
import { Label } from '../components/Label';
import { VerticalLayout } from '../containers/VerticalLayout';

/**
 * Окно повышения уровня
 */
export class LevelUpWindow extends Window {
	private options: string[];
	private onChooseCallback: ((choice: string) => void) | null = null;

	/**
	 * Создать окно повышения уровня
	 * @param options Массив вариантов улучшений
	 * @param canvasWidth Ширина канваса
	 * @param canvasHeight Высота канваса
	 */
	constructor(options: string[], canvasWidth: number, canvasHeight: number) {
		super();

		this.options = options;

		this.x = (canvasWidth - 300) / 2;
		this.y = (canvasHeight - 250) / 2;
		this.width = 300;
		this.height = 250;
		this.title = 'Повышение уровня!';
		this.causesPause = true;

		this.createUI();
		this.autoSize();
		this.centerWindow(canvasWidth, canvasHeight);
	}

	/**
	 * Создаёт заголовок и кнопки для каждого варианта улучшения.
	 */
	private createUI(): void {
		this.root.children = [];
		
		const layout = new VerticalLayout();
		layout.spacing = 10;
		layout.padding = { top: 40, right: 20, bottom: 20, left: 20 };

		const instructionLabel = new Label('Выберите улучшение:');
		layout.addChild(instructionLabel);

		for (const option of this.options) {
			const button = new Button(option, 200, 30);

			const currentOption = option;
			button.setOnClick(() => {
				if (this.onChooseCallback) {
					this.onChooseCallback(currentOption);
				}
			});

			layout.addChild(button);
		}

		this.root.addChild(layout);
	}

	/**
	 * Установить обработчик выбора улучшения
	 * @param callback Функция, вызываемая при выборе (получает выбранный вариант)
	 */
	setOnChoose(callback: (choice: string) => void): void {
		this.onChooseCallback = callback;
	}
}
