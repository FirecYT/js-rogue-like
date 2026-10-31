import type { ISystem } from '../core/interfaces';
import { UpdatePhase } from '../core/interfaces';
import { SeededRandom } from '@firec/map-module';
import type { EntityWorld } from '../core/EntityWorld';
import type Entity from '../entities/Entity';
import type { WorldService } from '../services/WorldService';
import type { BiomeMap } from '../services/BiomeMap';
import type { EntityFactory } from '../services/EntityFactory';
import type { ScreenManager } from '../ui/ScreenManager';
import type Engine from '../components/Engine';
import type { FloatingTextSystem } from './FloatingTextSystem';
import FloatingText from '../components/FloatingText';
import type { SafeZone } from './EnemySpawnerSystem';
import { Altar } from '../entities/Altar';
import { Trader } from '../entities/Trader';
import { createPickupFromItem } from '../utils';
import { TradeWindow } from '../ui/windows/TradeWindow';
import type { Unsubscribe } from '../events/EventBus';

/** Радиус безопасной зоны торговца (спавн врагов запрещён). */
const TRADER_SAFE_RADIUS = 260;

/**
 * Система фич зон: при загрузке чанка расставляет особенности биома —
 * алтари с боссом биома в руинах, точки торговцев с безопасной зоной и
 * тайники с лутом. Детерминирована seed'ом забега и координатой чанка.
 * Также объявляет имя биома при входе управляемой сущности в новую зону.
 */
export class ZoneFeatureSystem implements ISystem {
	public readonly phase = UpdatePhase.Spawner;
	public enabled = true;

	private readonly processed = new Set<string>();
	/** Счётчики для отладки: обработанные чанки и созданные фичи. */
	public debugStats = { chunks: 0, altars: 0, traders: 0, loot: 0 };
	private readonly safeZones: SafeZone[] = [];
	private unsubscribe: Unsubscribe | null = null;
	private lastZoneKey = '';
	private onZoneChange: ((name: string, color: string) => void) | null = null;

	/**
	 * @param entityWorld - Контейнер сущностей для спавна фич
	 * @param worldService - Сервис мира (проходимость, события чанков)
	 * @param biomeMap - Карта зон забега
	 * @param entityFactory - Конвейер сущностей
	 * @param runSeed - Seed забега для детерминированной раскладки
	 * @param screenManager - Менеджер окон (окно бартера)
	 * @param engine - Движок (размеры канваса для окон)
	 * @param floatingTextSystem - Система всплывающих текстов (имя зоны)
	 * @param getControlled - Функция получения управляемой сущности
	 */
	constructor(
		private readonly entityWorld: EntityWorld,
		private readonly worldService: WorldService,
		private readonly biomeMap: BiomeMap,
		private readonly entityFactory: EntityFactory,
		private readonly runSeed: number,
		private readonly screenManager: ScreenManager,
		private readonly engine: Engine,
		private readonly floatingTextSystem: FloatingTextSystem,
		private readonly getControlled: () => Entity
	) {
		this.unsubscribe = worldService.onChunkLoaded((chunkX, chunkY) => {
			this.processChunk(chunkX, chunkY);
		}) as Unsubscribe;
	}

	/**
	 * Регистрирует обработчик смены зоны (метка биома в HUD).
	 * @param callback - Обработчик с именем биома и цветом метки
	 */
	setOnZoneChange(callback: (name: string, color: string) => void): void {
		this.onZoneChange = callback;
	}

	/**
	 * Безопасные зоны торговцев (для спавнера мобов).
	 * @returns Массив точек безопасных зон
	 */
	getSafeZones(): readonly SafeZone[] {
		return this.safeZones;
	}

	/**
	 * Следит за сменой зоны управляемой сущностью: объявляет биом.
	 */
	update(): void {
		const controlled = this.getControlled();
		const zone = this.biomeMap.zoneAtWorld(controlled.x, controlled.y);
		const key = `${zone.x}:${zone.y}`;
		if (key === this.lastZoneKey) return;
		this.lastZoneKey = key;

		const biome = this.biomeMap.biomeAtChunk(
			zone.x * 4,
			zone.y * 4
		);
		this.floatingTextSystem.add(
			new FloatingText(controlled.x, controlled.y - 40, biome.name, 150)
		);
		this.onZoneChange?.(biome.name, biome.palette.fog);
	}

	/**
	 * Расставляет фичи биома в свежезагруженном чанке (однократно).
	 * @param chunkX - Координата чанка X
	 * @param chunkY - Координата чанка Y
	 */
	private processChunk(chunkX: number, chunkY: number): void {
		const key = `${chunkX}:${chunkY}`;
		if (this.processed.has(key)) return;
		this.processed.add(key);
		this.debugStats.chunks++;

		const biome = this.biomeMap.biomeAtChunk(chunkX, chunkY);
		const rng = new SeededRandom(
			(this.runSeed ^ Math.imul(chunkX, 0x27d4eb2f) ^ Math.imul(chunkY, 0x1656681)) >>> 0
		);

		const originX = chunkX * this.worldService.config.chunkSize * this.worldService.config.tileSize;
		const originY = chunkY * this.worldService.config.chunkSize * this.worldService.config.tileSize;

		const ruins = this.hasRuins(originX, originY);

		if (ruins && rng.next() < biome.altarChance) {
			const spot = this.findSpot(rng, originX, originY);
			if (spot) {
				this.entityWorld.spawn(
					new Altar(spot.x, spot.y, biome.bossDefId, this.entityFactory)
				);
				this.debugStats.altars++;
				return; // алтарь — главная фича чанка
			}
		}

		if (rng.next() < biome.traderChance) {
			const spot = this.findSpot(rng, originX, originY);
			if (spot) {
				const offers = [0, 1, 2].map(() =>
					biome.loot[Math.floor(rng.next() * biome.loot.length)]()
				);
				const trader = new Trader(spot.x, spot.y, offers);
				trader.onTrade = (merchant, actor) => this.openTrade(merchant, actor);
				this.entityWorld.spawn(trader);
				this.safeZones.push({
					x: spot.x,
					y: spot.y,
					radius: TRADER_SAFE_RADIUS,
				});
				this.debugStats.traders++;
				return;
			}
		}

		if (ruins && rng.next() < biome.lootChance) {
			const spot = this.findSpot(rng, originX, originY);
			if (spot) {
				const item =
					biome.loot[Math.floor(rng.next() * biome.loot.length)]();
				this.entityWorld.spawn(createPickupFromItem(item, spot.x, spot.y));
				this.debugStats.loot++;
			}
		}
	}

	/**
	 * Открывает окно бартера торговца.
	 * @param trader - Торговец
	 * @param actor - Покупатель
	 */
	private openTrade(trader: Trader, actor: Entity): void {
		const win = new TradeWindow(
			trader,
			actor,
			this.engine.canvas.width,
			this.engine.canvas.height
		);
		win.setOnClose(() => this.screenManager.closeWindow(win));
		this.screenManager.openWindow(win);
	}

	/**
	 * Проверяет наличие стен в чанке (признак руин) выборочным зондированием.
	 * @param originX - Мировая координата начала чанка
	 * @param originY - Мировая координата начала чанка
	 * @returns true, если в чанке есть непроходимые тайлы
	 */
	private hasRuins(originX: number, originY: number): boolean {
		const size =
			this.worldService.config.chunkSize * this.worldService.config.tileSize;
		let walls = 0;
		for (let i = 1; i < 4; i++) {
			for (let j = 1; j < 4; j++) {
				if (
					!this.worldService.isPassable(
						originX + (size * i) / 4,
						originY + (size * j) / 4
					)
				) {
					walls++;
				}
			}
		}
		return walls > 0;
	}

	/**
	 * Ищет проходимую точку внутри чанка (несколько случайных попыток).
	 * @param rng - Детерминированный генератор чанка
	 * @param originX - Мировая координата начала чанка
	 * @param originY - Мировая координата начала чанка
	 * @returns Точка или null
	 */
	private findSpot(
		rng: SeededRandom,
		originX: number,
		originY: number
	): { x: number; y: number } | null {
		const size =
			this.worldService.config.chunkSize * this.worldService.config.tileSize;
		for (let attempt = 0; attempt < 10; attempt++) {
			const x = originX + rng.next() * size;
			const y = originY + rng.next() * size;
			if (this.worldService.isPassable(x, y)) return { x, y };
		}
		return null;
	}

	/**
	 * Освобождение ресурсов: отписка от событий чанков.
	 */
	dispose(): void {
		this.unsubscribe?.();
		this.unsubscribe = null;
	}
}
