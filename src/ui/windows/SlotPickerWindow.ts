import { Window } from '../Window';
import { Button } from '../components/Button';
import { VerticalLayout } from '../containers/VerticalLayout';
import { listSlots } from '../../services/SaveService';

/**
 * Окно выбора слота сохранения: загрузка (из меню) или запись (из паузы).
 * Показывает состояние трёх слотов: дата, уровень, время забега.
 */
export class SlotPickerWindow extends Window {
	/**
	 * @param mode - 'load' — выбрать слот для продолжения, 'save' — для записи
	 * @param canvasWidth - Ширина канваса
	 * @param canvasHeight - Высота канваса
	 * @param onPick - Обработчик выбора слота (1..3)
	 * @param onBack - Закрыть окно
	 */
	constructor(
		mode: 'load' | 'save',
		canvasWidth: number,
		canvasHeight: number,
		onPick: (slot: number) => void,
		onBack: () => void
	) {
		super();
		this.title = mode === 'load' ? 'Продолжить забег' : 'Сохранить забег';
		this.causesPause = true;

		const layout = new VerticalLayout();
		layout.spacing = 10;
		layout.padding = { top: 40, right: 30, bottom: 20, left: 30 };

		const slots = listSlots();
		slots.forEach((info, index) => {
			const slot = index + 1;
			const text = info.exists
				? `Слот ${slot}: ур. ${info.level}, ${Math.round(info.ticks / 60)} мин, ${new Date(info.date).toLocaleDateString()}`
				: `Слот ${slot}: пусто`;
			const button = new Button(text, 420, 34);
			const usable = mode === 'save' || info.exists;
			if (usable) {
				button.setOnClick(() => onPick(slot));
			} else {
				button.setText(`Слот ${slot}: пусто (нечего загружать)`);
			}
			layout.addChild(button);
		});

		const back = new Button('Назад', 160, 30);
		back.setOnClick(onBack);
		layout.addChild(back);

		this.root.addChild(layout);
		this.autoSize();
		this.centerWindow(canvasWidth, canvasHeight);
	}
}
