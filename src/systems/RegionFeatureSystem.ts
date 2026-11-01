import type { ISystem } from '../core/interfaces';
import { UpdatePhase } from '../core/interfaces';
import { SeededRandom, createSeedFromCoords } from '@firec/map-module';
import type { EntityWorld } from '../core/EntityWorld';
import type Entity from '../entities/Entity';
import type { WorldService } from '../services/WorldService';
import type { RegionMap } from '../services/RegionMap';
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
import type { JournalService } from '../services/JournalService';
import {
	housesForChunk,
	houseInterior,
} from '../map/structures/houses';
import { regionCenterTile } from '../map/generation/structures';

/** Радиус безопасной зоны дома (спавн врагов запрещён). */
const HOUSE_SAFE_RADIUS = 256;

/**
 * Система фич регионов: при загрузке чанка обустраивает структуры региона —
 * восстановленные дома руин с дружественными NPC (торговцы и поселенцы),
 * жителей города, фиксированные алтари боссов в алтарных регионах и редкий
 * лут в руинах. Детерминирована seed'ом забега и координатами.
 * Также объявляет имя региона при входе управляемой сущности в регион.
 */
export class RegionFeatureSystem implements ISystem {
	public readonly phase = UpdatePhase.Spawner;
	public enabled = true;

	private readonly processed = new Set<string>();
	private readonly houses = new Set<string>();
	private readonly altars = new Set<string>();
	/** Счётчики для отладки и смоук-тестов. */
	public debugStats = {
		chunks: 0,
		houses: 0,
		traders: 0,
		settlers: 0,
		altars: 0,
		loot: 0,
	};
	private readonly safeZones: SafeZone[] = [];
	private unsubscribe: Unsubscribe | null = null;
	private lastRegionId = '';
	private onZoneChange: ((name: string, color: string) => void) | null = null;

	/**
	 * @param entityWorld - Контейнер сущностей для спавна фич
	 * @param worldService - Сервис мира (проходимость, события чанков)
	 * @param regionMap - Карта регионов мира
	 * @param entityFactory - Конвейер сущностей
	 * @param runSeed - Seed забега для детерминированной раскладки
	 * @param screenManager - Менеджер окон (окно бартера)
	 * @param engine - Движок (размеры канваса для окон)
	 * @param floatingTextSystem - Система всплывающих текстов (имя региона)
	 * @param getControlled - Функция получения управляемой сущности
	 */
	constructor(
		private readonly entityWorld: EntityWorld,
		private readonly worldService: WorldService,
		private readonly regionMap: RegionMap,
		private readonly entityFactory: EntityFactory,
		private readonly runSeed: number,
		private readonly screenManager: ScreenManager,
		private readonly engine: Engine,
		private readonly floatingTextSystem: FloatingTextSystem,
		private readonly getControlled: () => Entity,
		private readonly journal?: JournalService
	) {
		this.unsubscribe = worldService.onChunkLoaded((chunkX, chunkY) => {
			this.processChunk(chunkX, chunkY);
		}) as Unsubscribe;
	}

	/**
	 * Регистрирует обработчик смены региона (метка в HUD).
	 * @param callback - Обработчик с именем региона и цветом метки
	 */
	setOnZoneChange(callback: (name: string, color: string) => void): void {
		this.onZoneChange = callback;
	}

	/**
	 * Безопасные зоны структур (для спавнера мобов).
	 * @returns Список безопасных зон
	 */
	getSafeZones(): readonly SafeZone[] {
		return this.safeZones;
	}

	/**
	 * Следит за сменой региона управляемой сущностью: объявляет название.
	 */
	update(): void {
		const controlled = this.getControlled();
		const region = this.regionMap.regionAtWorld(controlled.x, controlled.y);
		if (region.id === this.lastRegionId) return;
		this.lastRegionId = region.id;

		this.floatingTextSystem.add(
			new FloatingText(controlled.x, controlled.y - 40, region.name, 150)
		);
		this.onZoneChange?.(region.name, region.palette.fog);
	}

	/**
	 * Обустраивает свежезагруженный чанк (однократно): дома и NPC руин,
	 * жители города, алтари алтарных регионов, редкий лут.
	 * @param chunkX - Координата чанка X
	 * @param chunkY - Координата чанка Y
	 */
	private processChunk(chunkX: number, chunkY: number): void {
		const key = `${chunkX}:${chunkY}`;
		if (this.processed.has(key)) return;
		this.processed.add(key);
		this.debugStats.chunks++;

		const region = this.regionMap.regionAtChunk(chunkX, chunkY);
		const rng = new SeededRandom(
			(this.runSeed ^
				Math.imul(chunkX, 0x27d4eb2f) ^
				Math.imul(chunkY, 0x1656681)) >>>
				0
		);

		if (region.id === 'ruins') {
			this.processHouses(chunkX, chunkY, rng, region.loot);
			// Редкий лут в открытых руинах
			if (rng.next() < (region.lootChance ?? 0) && region.loot.length) {
				const origin = this.chunkOrigin(chunkX, chunkY);
				const spot = this.findSpot(rng, origin.x, origin.y);
				if (spot) {
					const item =
						region.loot[Math.floor(rng.next() * region.loot.length)]();
					this.entityWorld.spawn(createPickupFromItem(item, spot.x, spot.y));
					this.debugStats.loot++;
				}
			}
			return;
		}

		if (region.id === 'city') {
			this.processCityCell(chunkX, chunkY, rng, region.loot);
			return;
		}

		if (region.bossDefId && region.rect) {
			const center = regionCenterTile(region.rect);
			const ccx = Math.floor(center.x / 16);
			const ccy = Math.floor(center.y / 16);
			if (ccx === chunkX && ccy === chunkY && !this.altars.has(region.id)) {
				this.altars.add(region.id);
				this.entityWorld.spawn(
					new Altar(
						center.x * 32 + 16,
						center.y * 32 + 16,
						region.bossDefId,
						this.entityFactory
					)
				);
				this.debugStats.altars++;
			}
		}
	}

	/**
	 * Дома руин, пересекающие чанк: безопасная зона и NPC в доме,
	 * центр которого пришёл на этот чанк.
	 */
	private processHouses(
		chunkX: number,
		chunkY: number,
		rng: SeededRandom,
		loot: RegionLoot
	): void {
		for (const house of housesForChunk(chunkX, chunkY, this.runSeed)) {
			const hkey = `${house.x}:${house.y}`;
			if (this.houses.has(hkey)) continue;
			this.houses.add(hkey);

			const interior = houseInterior(house);
			const cxTile = interior.x + interior.w / 2;
			const cyTile = interior.y + interior.h / 2;
			const wx = cxTile * 32;
			const wy = cyTile * 32;
			this.safeZones.push({ x: wx, y: wy, radius: HOUSE_SAFE_RADIUS });
			this.debugStats.houses++;

			// NPC заселяются один раз — при регистрации дома
			const settlers = 1 + (rng.next() < 0.5 ? 1 : 0);
			for (let i = 0; i < settlers; i++) {
				this.entityFactory.spawn(
					'settler',
					wx + (rng.next() - 0.5) * 96,
					wy + (rng.next() - 0.5) * 64
				);
				this.debugStats.settlers++;
			}
			if (rng.next() < 0.6 && loot.length) {
				this.spawnTrader(wx + 32, wy, rng, loot);
			}
		}
	}

	/** Якорный чанк ячейки города (1,1): жители и торговец здания. */
	private processCityCell(
		chunkX: number,
		chunkY: number,
		rng: SeededRandom,
		loot: RegionLoot
	): void {
		const cellX = Math.floor(chunkX / 4);
		const cellY = Math.floor(chunkY / 4);
		if (chunkX - cellX * 4 !== 1 || chunkY - cellY * 4 !== 1) return;

		const cellRng = new SeededRandom(createSeedFromCoords(cellX, cellY, 0xc17a));
		const isBuilding = cellRng.next() < 0.55;
		if (!isBuilding) return;

		const wx = (cellX * 4 + 2) * 512;
		const wy = (cellY * 4 + 2) * 512;
		const settlers = 1 + (rng.next() < 0.6 ? 1 : 0);
		for (let i = 0; i < settlers; i++) {
			this.entityFactory.spawn(
				'settler',
				wx + (rng.next() - 0.5) * 256,
				wy + (rng.next() - 0.5) * 256
			);
			this.debugStats.settlers++;
		}
		if (rng.next() < 0.5 && loot.length) {
			this.spawnTrader(wx + 48, wy, rng, loot);
		}
	}

	/** Торговец с прилавком из пула лута региона. */
	private spawnTrader(
		x: number,
		y: number,
		rng: SeededRandom,
		loot: RegionLoot
	): void {
		const offers = [0, 1, 2].map(
			() => loot[Math.floor(rng.next() * loot.length)]()
		);
		const trader = new Trader(x, y, offers);
		trader.onTrade = (merchant, actor) => this.openTrade(merchant, actor);
		this.entityWorld.spawn(trader);
		this.debugStats.traders++;
	}

	/**
	 * Открывает окно бартера торговца.
	 * @param trader - Торговец
	 * @param actor - Покупатель
	 */
	private openTrade(trader: Trader, actor: Entity): void {
		this.journal?.unlock('n:trader');
		const win = new TradeWindow(
			trader,
			actor,
			this.engine.canvas.width,
			this.engine.canvas.height
		);
		win.setOnClose(() => this.screenManager.closeWindow(win));
		this.screenManager.openWindow(win);
	}

	/** Мировое начало чанка в пикселях. */
	private chunkOrigin(
		chunkX: number,
		chunkY: number
	): { x: number; y: number } {
		const size =
			this.worldService.config.chunkSize * this.worldService.config.tileSize;
		return { x: chunkX * size, y: chunkY * size };
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

/** Пул лута региона (фабрики предметов). */
type RegionLoot = import('../content/regions/definitions').LootFactory[];
