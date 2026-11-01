import { Window } from '../Window';
import { Label } from '../components/Label';
import { Button } from '../components/Button';
import { VerticalLayout } from '../containers/VerticalLayout';
import { HorizontalLayout } from '../containers/HorizontalLayout';
import { InputAction } from '../../input/InputAction';
import type { InputMapper } from '../../input/InputMapper';
import {
	settingsState,
	saveSettings,
	type Settings,
} from '../../services/SettingsService';

/** Подписи действий для списка переназначения. */
const ACTION_TITLES: [InputAction, string][] = [
	[InputAction.MoveUp, 'Вверх'],
	[InputAction.MoveDown, 'Вниз'],
	[InputAction.MoveLeft, 'Влево'],
	[InputAction.MoveRight, 'Вправо'],
	[InputAction.Dash, 'Рывок'],
	[InputAction.Interact, 'Взаимодействие'],
	[InputAction.Inventory, 'Инвентарь'],
	[InputAction.Chip1, 'Чип 1'],
	[InputAction.Chip2, 'Чип 2'],
	[InputAction.Chip3, 'Чип 3'],
	[InputAction.Chip4, 'Чип 4'],
	[InputAction.Chip5, 'Чип 5'],
];

/**
 * Настройки: переназначение клавиш, пределы отдаления камеры, дальность
 * рендера, тумблеры HUD и debug-оверлей. Изменения применяются сразу
 * и сохраняются в localStorage.
 */
export class SettingsWindow extends Window {
	private listening: InputAction | null = null;
	private keyListener: ((e: KeyboardEvent) => void) | null = null;

	/**
	 * @param input - Маппер действий (для переназначения клавиш)
	 * @param canvasWidth - Ширина канваса
	 * @param canvasHeight - Высота канваса
	 * @param applyCamera - Применить минимальный зум сразу
	 * @param applyRenderRadius - Применить радиус загрузки чанков сразу
	 * @param onBack - Закрыть окно
	 */
	constructor(
		private readonly input: InputMapper,
		canvasWidth: number,
		canvasHeight: number,
		private readonly applyCamera: (minZoom: number) => void,
		private readonly applyRenderRadius: (radius: number) => void,
		private readonly onBack: () => void
	) {
		super();
		this.title = 'Настройки';
		this.causesPause = true;
		this.lastCanvasWidth = canvasWidth;
		this.lastCanvasHeight = canvasHeight;
		this.createUI();
	}

	private lastCanvasWidth = 0;
	private lastCanvasHeight = 0;

	/** Текущие настройки процесса. */
	private get settings(): Settings {
		return settingsState.current;
	}

	/** Сохраняет настройки и пересобирает окно. */
	private commit(): void {
		saveSettings(this.settings);
		this.createUI();
	}

	private createUI(): void {
		this.stopListening();
		this.root.children = [];
		const layout = new VerticalLayout();
		layout.spacing = 6;
		layout.padding = { top: 40, right: 24, bottom: 20, left: 24 };

		const header = new Label('Управление');
		header.setFontSize(18);
		layout.addChild(header);

		for (const [action, title] of ACTION_TITLES) {
			const row = new HorizontalLayout();
			row.spacing = 10;
			const label = new Label(title, 160);
			row.addChild(label);
			const keys = this.input.getBindings().get(action) ?? [];
			const button = new Button(
				this.listening === action ? 'нажмите клавишу…' : keys.join(' / '),
				200,
				24
			);
			button.setOnClick(() => this.startListening(action));
			row.addChild(button);
			layout.addChild(row);
		}

		const renderHeader = new Label('Камера и рендер');
		renderHeader.setFontSize(18);
		layout.addChild(renderHeader);
		layout.addChild(this.stepperRow(
			`Отдаление камеры (мин. зум): ${this.settings.minZoom.toFixed(2)}`,
			() => {
				this.settings.minZoom = Math.min(0.5, this.settings.minZoom + 0.05);
				this.applyCamera(this.settings.minZoom);
				this.commit();
			},
			() => {
				this.settings.minZoom = Math.max(0.1, this.settings.minZoom - 0.05);
				this.applyCamera(this.settings.minZoom);
				this.commit();
			}
		));
		layout.addChild(this.stepperRow(
			`Дальность рендера (чанков): ${this.settings.renderRadius}`,
			() => {
				this.settings.renderRadius = Math.min(14, this.settings.renderRadius + 2);
				this.applyRenderRadius(this.settings.renderRadius);
				this.commit();
			},
			() => {
				this.settings.renderRadius = Math.max(6, this.settings.renderRadius - 2);
				this.applyRenderRadius(this.settings.renderRadius);
				this.commit();
			}
		));

		const hudHeader = new Label('Интерфейс');
		hudHeader.setFontSize(18);
		layout.addChild(hudHeader);
		layout.addChild(this.toggleRow('Метка региона', 'zoneLabel'));
		layout.addChild(this.toggleRow('Полоски HP врагов', 'hpBars'));
		layout.addChild(this.toggleRow('Всплывающие тексты', 'floatingTexts'));
		layout.addChild(this.toggleRow('Оверлей FPS/чанков', 'debugOverlay'));

		const back = new Button('Назад', 140, 30);
		back.setOnClick(() => {
			this.stopListening();
			this.onBack();
		});
		layout.addChild(back);

		this.root.addChild(layout);
		this.autoSize();
		this.centerWindow(this.lastCanvasWidth, this.lastCanvasHeight);
	}

	/** Строка «подпись + минус/плюс» для числовых настроек. */
	private stepperRow(
		title: string,
		dec: () => void,
		inc: () => void
	): HorizontalLayout {
		const row = new HorizontalLayout();
		row.spacing = 8;
		row.addChild(new Label(title, 300));
		const minus = new Button('−', 34, 24);
		minus.setOnClick(dec);
		row.addChild(minus);
		const plus = new Button('+', 34, 24);
		plus.setOnClick(inc);
		row.addChild(plus);
		return row;
	}

	/** Строка с тумблером настройки HUD. */
	private toggleRow(
		title: string,
		key: 'zoneLabel' | 'hpBars' | 'floatingTexts' | 'debugOverlay'
	): HorizontalLayout {
		const row = new HorizontalLayout();
		row.spacing = 8;
		row.addChild(new Label(title, 300));
		const value =
			key === 'debugOverlay' ? this.settings.debugOverlay : this.settings.hud[key];
		const button = new Button(value ? 'ВКЛ' : 'ВЫКЛ', 70, 24);
		button.setOnClick(() => {
			if (key === 'debugOverlay') {
				this.settings.debugOverlay = !this.settings.debugOverlay;
			} else {
				this.settings.hud[key] = !this.settings.hud[key];
			}
			this.commit();
		});
		row.addChild(button);
		return row;
	}

	/** Начинает ожидание клавиши для действия. */
	private startListening(action: InputAction): void {
		this.listening = action;
		this.createUI();
		this.keyListener = (e: KeyboardEvent) => {
			e.preventDefault();
			this.input.rebind(action, [e.code]);
			this.settings.bindings[action] = [e.code];
			this.commit();
		};
		window.addEventListener('keydown', this.keyListener, { once: true });
	}

	/** Снимает ожидание клавиши (если окно закрывается/пересобирается). */
	private stopListening(): void {
		if (this.keyListener) {
			window.removeEventListener('keydown', this.keyListener);
			this.keyListener = null;
		}
		this.listening = null;
	}

	/** Освобождает слушатель клавиши при закрытии окна. */
	dispose(): void {
		this.stopListening();
	}
}
