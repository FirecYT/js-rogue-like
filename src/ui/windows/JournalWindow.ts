import { Window } from '../Window';
import { Label } from '../components/Label';
import { Button } from '../components/Button';
import { VerticalLayout } from '../containers/VerticalLayout';
import { HorizontalLayout } from '../containers/HorizontalLayout';
import type { JournalService, JournalEntry } from '../../services/JournalService';

/** Категории журнала с заголовками вкладок. */
const CATEGORIES: { id: 'enemy' | 'boss' | 'npc' | 'item'; title: string }[] = [
	{ id: 'enemy', title: 'Враги' },
	{ id: 'boss', title: 'Боссы' },
	{ id: 'npc', title: 'NPC' },
	{ id: 'item', title: 'Предметы' },
];

/**
 * Журнал мира в духе Risk of Rain 2: вкладки категорий, список записей
 * (неоткрытые показаны как «???») и карточка с описанием выбранного.
 */
export class JournalWindow extends Window {
	private category: 'enemy' | 'boss' | 'npc' | 'item' = 'enemy';
	private selected: JournalEntry | null = null;

	/**
	 * @param journal - Сервис журнала
	 * @param canvasWidth - Ширина канваса
	 * @param canvasHeight - Высота канваса
	 * @param onBack - Закрыть окно
	 */
	constructor(
		private readonly journal: JournalService,
		canvasWidth: number,
		canvasHeight: number,
		private readonly onBack: () => void
	) {
		super();
		this.title = 'Журнал смотрителя';
		this.causesPause = true;
		this.lastCanvasWidth = canvasWidth;
		this.lastCanvasHeight = canvasHeight;
		this.createUI();
	}

	private lastCanvasWidth = 0;
	private lastCanvasHeight = 0;

	/** Пересобирает интерфейс под текущие категорию и выбор. */
	private createUI(): void {
		this.root.children = [];
		const layout = new VerticalLayout();
		layout.spacing = 10;
		layout.padding = { top: 40, right: 20, bottom: 20, left: 20 };

		const tabs = new HorizontalLayout();
		tabs.spacing = 8;
		for (const category of CATEGORIES) {
			const button = new Button(category.title, 100, 28);
			button.setOnClick(() => {
				this.category = category.id;
				this.selected = null;
				this.rebuild();
			});
			tabs.addChild(button);
		}
		layout.addChild(tabs);

		const body = new HorizontalLayout();
		body.spacing = 16;

		const list = new VerticalLayout();
		list.spacing = 6;
		const entries = this.journal.entries(this.category);
		for (const entry of entries) {
			const button = new Button(
				entry.unlocked ? entry.name : '???',
				220,
				26
			);
			if (entry.unlocked) {
				button.setOnClick(() => {
					this.selected = entry;
					this.rebuild();
				});
			}
			list.addChild(button);
		}
		body.addChild(list);

		const detail = new VerticalLayout();
		detail.spacing = 8;
		if (this.selected) {
			const name = new Label(this.selected.name);
			name.setFontSize(20);
			detail.addChild(name);
			detail.addChild(new Label(this.selected.description, 380));
		} else {
			detail.addChild(
				new Label('Выберите запись из списка, чтобы прочитать описание.', 380)
			);
		}
		body.addChild(detail);
		layout.addChild(body);

		const back = new Button('Назад', 140, 30);
		back.setOnClick(this.onBack);
		layout.addChild(back);

		this.root.addChild(layout);
		this.autoSize();
		this.centerWindow(this.lastCanvasWidth, this.lastCanvasHeight);
	}

	private rebuild(): void {
		this.createUI();
	}
}
