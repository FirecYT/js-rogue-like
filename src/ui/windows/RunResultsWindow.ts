import { Window } from '../Window';
import { Label } from '../components/Label';
import { Button } from '../components/Button';
import { VerticalLayout } from '../containers/VerticalLayout';
import type { RunStats } from '../../services/StatsService';

/**
 * Экран итогов забега: открывается при смерти управляемой сущности
 * без перерождения. Показывает показатели забега и уводит в новый
 * забег или главное меню.
 */
export class RunResultsWindow extends Window {
	/**
	 * @param stats - Статистика завершённого забега
	 * @param died - Забег завершён смертью (иначе — выходом)
	 * @param canvasWidth - Ширина канваса
	 * @param canvasHeight - Высота канваса
	 * @param newRun - Обработчик «Новый забег»
	 * @param toMenu - Обработчик «В меню»
	 */
	constructor(
		stats: RunStats,
		died: boolean,
		canvasWidth: number,
		canvasHeight: number,
		newRun: () => void,
		toMenu: () => void
	) {
		super();
		this.title = died ? 'Забег завершён: сознание погасло' : 'Забег завершён';
		this.causesPause = true;

		const layout = new VerticalLayout();
		layout.spacing = 8;
		layout.padding = { top: 40, right: 30, bottom: 20, left: 30 };

		const total = Math.round(stats.ticks / 60);
		layout.addChild(
			new Label(`Время в руинах: ${Math.floor(total / 60)} мин ${total % 60} сек`)
		);
		layout.addChild(new Label(`Убийств: ${stats.killsTotal}, боссов: ${stats.bosses}`));
		layout.addChild(new Label(`Предметов подобрано: ${stats.pickups}`));
		layout.addChild(new Label(`Обменов бартера: ${stats.trades}`));

		const run = new Button('Новый забег', 220, 34);
		run.setOnClick(newRun);
		layout.addChild(run);
		const menu = new Button('В главное меню', 220, 34);
		menu.setOnClick(toMenu);
		layout.addChild(menu);

		this.root.addChild(layout);
		this.autoSize();
		this.centerWindow(canvasWidth, canvasHeight);
	}
}
