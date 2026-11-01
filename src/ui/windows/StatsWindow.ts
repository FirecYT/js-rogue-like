import { Window } from '../Window';
import { Label } from '../components/Label';
import { Button } from '../components/Button';
import { VerticalLayout } from '../containers/VerticalLayout';
import type { StatsService } from '../../services/StatsService';

/** Формат тиков (60 Гц) в минуты и секунды. */
function formatTicks(ticks: number): string {
	const total = Math.round(ticks / 60);
	return `${Math.floor(total / 60)} мин ${total % 60} сек`;
}

/**
 * Окно статистики: показатели текущего забега и мета-статистика
 * всех забегов из localStorage.
 */
export class StatsWindow extends Window {
	/**
	 * @param stats - Сервис статистики
	 * @param canvasWidth - Ширина канваса
	 * @param canvasHeight - Высота канваса
	 * @param onBack - Закрыть окно
	 */
	constructor(
		stats: StatsService,
		canvasWidth: number,
		canvasHeight: number,
		onBack: () => void
	) {
		super();
		this.title = 'Статистика';
		this.causesPause = true;

		const layout = new VerticalLayout();
		layout.spacing = 6;
		layout.padding = { top: 40, right: 30, bottom: 20, left: 30 };

		const run = stats.getRunStats();
		const meta = stats.getMetaStats();

		const header = new Label('Текущий забег');
		header.setFontSize(20);
		layout.addChild(header);
		layout.addChild(new Label(`Время: ${formatTicks(run.ticks)}`));
		layout.addChild(new Label(`Убийств: ${run.killsTotal} (боссов: ${run.bosses})`));
		layout.addChild(new Label(`Предметов подобрано: ${run.pickups}`));
		layout.addChild(new Label(`Обменов бартера: ${run.trades}`));
		const topKills = Object.entries(run.kills)
			.sort((a, b) => b[1] - a[1])
			.slice(0, 3)
			.map(([id, count]) => `${id} ×${count}`)
			.join(', ');
		layout.addChild(new Label(topKills ? `Чаще всего: ${topKills}` : 'Убийств пока нет'));

		const metaHeader = new Label('Все забеги');
		metaHeader.setFontSize(20);
		layout.addChild(metaHeader);
		layout.addChild(new Label(`Завершено забегов: ${meta.runsEnded}`));
		layout.addChild(new Label(`Всего убийств: ${meta.totalKills} (боссов: ${meta.bossesKilled})`));
		layout.addChild(new Label(`Смертей: ${meta.totalDeaths}`));
		layout.addChild(
			new Label(
				meta.bestRunTicks === null
					? 'Лучший забег: —'
					: `Лучший забег: ${formatTicks(meta.bestRunTicks)}`
			)
		);

		const back = new Button('Назад', 140, 30);
		back.setOnClick(onBack);
		layout.addChild(back);

		this.root.addChild(layout);
		this.autoSize();
		this.centerWindow(canvasWidth, canvasHeight);
	}
}
