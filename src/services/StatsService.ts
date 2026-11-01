import type { ISystem } from '../core/interfaces';
import { UpdatePhase } from '../core/interfaces';
import { eventBus } from '../events/EventBus';
import type { Unsubscribe } from '../events/EventBus';
import type Entity from '../entities/Entity';
import { loadMeta, saveMeta, type MetaState, type MetaStats } from './MetaStorage';

/** Статистика текущего забега. */
export interface RunStats {
	/** Длительность забега в тиках (60 Гц). */
	ticks: number;
	/** Убийства по id определений. */
	kills: Record<string, number>;
	/** Всего убийств. */
	killsTotal: number;
	/** Убито боссов. */
	bosses: number;
	/** Подобранные предметы. */
	pickups: number;
	/** Совершённые обмены бартера. */
	trades: number;
}

/**
 * Сервис статистики: собирает показатели забега (время, убийства, лут,
 * бартер) и по завершении забега сливает их в мета-статистику localStorage.
 */
export class StatsService implements ISystem {
	public readonly phase = UpdatePhase.UI;
	public enabled = true;

	private readonly run: RunStats = {
		ticks: 0,
		kills: {},
		killsTotal: 0,
		bosses: 0,
		pickups: 0,
		trades: 0,
	};
	private readonly unsubscribes: Unsubscribe[] = [];
	private ended = false;

	/**
	 * @param getControlled - Функция получения управляемой сущности
	 */
	constructor(private readonly getControlled: () => Entity) {
		this.unsubscribes.push(
			eventBus.on('entityKilled', ({ killer, victim }) => {
				if (killer !== this.getControlled()) return;
				const def = (victim as { definition?: { id: string; journal?: string } })
					.definition;
				const defId = def?.id ?? 'unknown';
				this.run.kills[defId] = (this.run.kills[defId] ?? 0) + 1;
				this.run.killsTotal++;
				if (def?.journal === 'boss') this.run.bosses++;
			})
		);
		this.unsubscribes.push(
			eventBus.on('itemPicked', () => {
				this.run.pickups++;
			})
		);
		this.unsubscribes.push(
			eventBus.on('barterCompleted', () => {
				this.run.trades++;
			})
		);
	}

	/** Тик таймера забега (не вызывается на паузе). */
	update(): void {
		this.run.ticks++;
	}

	/**
	 * Восстанавливает статистику забега из сохранения (продолжение).
	 * @param saved - Снимок статистики из сейва
	 */
	restoreRun(saved: RunStats): void {
		this.run.ticks = saved.ticks;
		this.run.kills = { ...saved.kills };
		this.run.killsTotal = saved.killsTotal;
		this.run.bosses = saved.bosses;
		this.run.pickups = saved.pickups;
		this.run.trades = saved.trades;
	}

	/** Снимок статистики забега (для экрана итогов и окна статистики). */
	getRunStats(): RunStats {
		return { ...this.run, kills: { ...this.run.kills } };
	}

	/** Мета-статистика всех забегов. */
	getMetaStats(): MetaStats {
		return loadMeta().stats;
	}

	/**
	 * Завершает забег: сливает статистику в мету (однократно).
	 * @param died - Забег завершён смертью управляемой сущности
	 */
	endRun(died: boolean): void {
		if (this.ended) return;
		this.ended = true;
		const meta: MetaState = loadMeta();
		meta.stats.runsEnded++;
		meta.stats.totalKills += this.run.killsTotal;
		meta.stats.totalTrades += this.run.trades;
		meta.stats.totalPickups += this.run.pickups;
		meta.stats.bossesKilled += this.run.bosses;
		if (died) meta.stats.totalDeaths++;
		if (
			meta.stats.bestRunTicks === null ||
			this.run.ticks > meta.stats.bestRunTicks
		) {
			meta.stats.bestRunTicks = this.run.ticks;
		}
		saveMeta(meta);
	}

	/** Отписка от событий шины. */
	dispose(): void {
		for (const unsubscribe of this.unsubscribes) unsubscribe();
		this.unsubscribes.length = 0;
	}
}
