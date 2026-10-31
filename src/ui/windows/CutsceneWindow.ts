import { Window } from '../Window';
import { Button } from '../components/Button';
import { Label } from '../components/Label';
import { VerticalLayout } from '../containers/VerticalLayout';
import MouseInput from '../../components/MouseInput';

/**
 * Окно катсцены: отображает текстовые реплики одну за другой.
 * Поддерживает переход к следующей реплике по клику или клавише Interact.
 */
export class CutsceneWindow extends Window {
	private lines: string[];
	private currentLine = 0;
	private nextButton: Button;
	private textLabel: Label;
	private counterLabel: Label;
	private onCompleteCallback: (() => void) | null = null;

	/**
	 * @param lines - Массив строк катсцены
	 * @param canvasWidth - Ширина канваса
	 * @param canvasHeight - Высота канваса
	 */
	constructor(lines: string[], canvasWidth: number, canvasHeight: number) {
		super();

		this.lines = lines;

		// Окно занимает нижнюю часть экрана
		this.width = canvasWidth;
		this.height = 180;
		this.x = 0;
		this.y = canvasHeight - this.height;
		this.root.x = this.x;
		this.root.y = this.y;
		this.causesPause = true;
		this.title = '';

		this.textLabel = new Label(lines[0] ?? '', this.width - 80);
		this.counterLabel = new Label(`1/${lines.length}`);
		this.counterLabel.setColor('#444');

		this.nextButton = new Button('Далее ▶', 120, 35);
		this.nextButton.setOnClick(() => this.advance());

		this.createUI();
	}

	/**
	 * Создаёт элементы окна: текст реплики, счётчик, кнопку "Далее".
	 */
	private createUI(): void {
		this.root.children = [];

		const layout = new VerticalLayout();
		layout.spacing = 15;
		layout.padding = { top: 20, right: 30, bottom: 20, left: 30 };

		layout.addChild(this.textLabel);

		const bottomLayout = new VerticalLayout();
		bottomLayout.addChild(this.counterLabel);
		bottomLayout.addChild(this.nextButton);
		layout.addChild(bottomLayout);

		this.root.addChild(layout);
	}

	/**
	 * Переходит к следующей реплике или завершает катсцену.
	 */
	private advance(): void {
		this.currentLine++;
		if (this.currentLine >= this.lines.length) {
			this.onCompleteCallback?.();
		} else {
			this.updateUI();
		}
	}

	/**
	 * Переходит к следующей реплике (публичный метод для вызова из CutsceneSystem).
	 */
	nextLine(): void {
		this.advance();
	}

	/**
	 * Обновляет текст и счётчик в UI.
	 */
	private updateUI(): void {
		this.textLabel.setText(this.lines[this.currentLine] ?? '');
		this.counterLabel.setText(
			`${this.currentLine + 1}/${this.lines.length}`
		);
	}

	/**
	 * Устанавливает обработчик завершения катсцены.
	 */
	setOnComplete(callback: () => void): void {
		this.onCompleteCallback = callback;
	}

	/**
	 * Обновление: проверка клавиши Interact для перехода к следующей реплике.
	 */
	update(mouse: MouseInput): void {
		super.update(mouse);

		// Проверяем клавишу Interact (E) для перехода к следующей реплике
		// if ((mouse as any).interactPressed) {
		// 	this.advance();
		// }
	}
}
