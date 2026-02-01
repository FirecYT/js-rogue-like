import { Window } from '../Window';
import { Button } from '../components/Button';
import { Label } from '../components/Label';

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
	constructor(
		options: string[],
		canvasWidth: number,
		canvasHeight: number
	) {
		super();

		this.options = options;

		// Set window properties
		this.x = (canvasWidth - 300) / 2;
		this.y = (canvasHeight - 250) / 2;
		this.width = 300;
		this.height = 250;
		this.title = 'Повышение уровня!';
		this.causesPause = true;

		// Create UI elements
		this.createUI();
	}

	/**
	 * Create the UI elements for the window
	 */
	private createUI(): void {
		// Clear existing children
		this.root.children = [];

		// Add instruction label
		const instructionLabel = new Label('Выберите улучшение:');
		instructionLabel.x = 20;
		instructionLabel.y = 40;
		this.root.addChild(instructionLabel);

		// Add buttons for each option
		for (let i = 0; i < this.options.length; i++) {
			const option = this.options[i];
			const button = new Button(option, 200, 30);
			button.x = (this.width - 200) / 2;
			button.y = 80 + i * 40;

			// Create a closure to capture the current option
			const currentOption = option;
			button.setOnClick(() => {
				if (this.onChooseCallback) {
					this.onChooseCallback(currentOption);
				}
			});

			this.root.addChild(button);
		}
	}

	/**
	 * Установить обработчик выбора улучшения
	 * @param callback Функция, вызываемая при выборе (получает выбранный вариант)
	 */
	setOnChoose(callback: (choice: string) => void): void {
		this.onChooseCallback = callback;
	}
}
