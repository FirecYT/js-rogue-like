import Engine from '../components/Engine';
import MouseInput from '../components/MouseInput';
import { Camera } from '../components/Camera';
import { InputMapper } from '../input/InputMapper';
import { EntityWorld } from './EntityWorld';
import { WorldService } from '../services/WorldService';
import { Pathfinder } from '../services/Pathfinder';
import { SystemManager } from '../services/SystemManager';
import { MovementSystem } from '../systems/MovementSystem';
import { CollisionSystem } from '../systems/CollisionSystem';
import { FloatingTextSystem } from '../systems/FloatingTextSystem';
import { CleanupSystem } from '../systems/CleanupSystem';
import { EffectSystem } from '../systems/EffectSystem';
import { PickupSystem } from '../systems/PickupSystem';
import { EnemySpawnerSystem } from '../systems/EnemySpawnerSystem';
import { UISystem } from '../systems/UISystem';
import { ProgressionSystem } from '../systems/ProgressionSystem';
import { CutsceneSystem } from '../systems/CutsceneSystem';
import { ControlSwitchService } from '../services/ControlSwitchService';
import { EntityFactory } from '../services/EntityFactory';
import { DashChip } from '../items/chips/DashChip';
import {
	DamagePlusModifier,
	PierceModifier,
} from '../items/modifiers/catalog';
import { DeclarativeEntity } from '../entities/DeclarativeEntity';
import { WormPlayerController } from '../controllers/WormPlayerController';
import { RegionMap } from '../services/RegionMap';
import { RegionFeatureSystem } from '../systems/RegionFeatureSystem';
import type { BootOptions } from './BootOptions';
import { navigateTo } from './BootOptions';
import { GameFlow } from './GameFlow';
import { eventBus } from '../events/EventBus';
import { JournalService } from '../services/JournalService';
import { StatsService } from '../services/StatsService';
import { loadSave, saveSave, type SaveData } from '../services/SaveService';
import { loadMeta, saveMeta } from '../services/MetaStorage';
import { settingsState } from '../services/SettingsService';
import { ITEM_DEFINITIONS } from '../content/items/definitions';
import { MainMenuWindow } from '../ui/windows/MainMenuWindow';
import { SlotPickerWindow } from '../ui/windows/SlotPickerWindow';
import { JournalWindow } from '../ui/windows/JournalWindow';
import { StatsWindow } from '../ui/windows/StatsWindow';
import { SettingsWindow } from '../ui/windows/SettingsWindow';
import { AdminWindow } from '../ui/windows/AdminWindow';
import { RunResultsWindow } from '../ui/windows/RunResultsWindow';
import { PauseWindow } from '../ui/windows/PauseWindow';
import type { Window } from '../ui/Window';
import type { InputAction } from '../input/InputAction';
import type { Modifier } from '../items/modifiers/Modifier';
import type { Chip } from '../items/Chip';
import { housesForChunk } from '../map/structures/houses';
import {
	regionFloorCanvas,
	regionWallCanvas,
} from '../content/regions/palette';
import { InteractSystem } from '../systems/InteractSystem';

/** Отладочные хуки debug-сцены (?playground): доступ к миру и управляемой сущности. */
export interface GameDebugHooks {
	getControlled: () => import('../entities/Entity').default;
	entityWorld: import('../core/EntityWorld').EntityWorld;
	entityFactory: EntityFactory;
	regionMap: RegionMap;
	/** Менеджер экранов (для смоук-тестов UI). */
	screenManager: import('../ui/ScreenManager').ScreenManager;
	/** Фасад тайлового мира (для смоук-тестов карты). */
	worldService: import('../services/WorldService').WorldService;
	/** Дома руин, пересекающие чанк (для смоук-тестов структур). */
	housesAt: (chunkX: number, chunkY: number) => import('../map/structures/houses').HouseRect[];
	/** Статистика системы фич зон (для смоук-тестов). */
	zoneStats: () => {
		chunks: number;
		altars: number;
		traders: number;
		loot: number;
	};
	/** Выдать тестовый чип управляемой сущности (только debug-сцена). */
	giveChip: (id: 'dash') => void;
	/** Выдать тестовый модификатор в слот 0 (только debug-сцена). */
	giveItem: (id: 'damage_plus' | 'pierce') => void;
	/** Открытые записи журнала (смоук-тесты). */
	journalUnlocked: () => string[];
	/** Мгновенная смерть управляемой сущности (смоук-тесты итогов). */
	forceDeath: () => void;
	/** Неуязвимость управляемой сущности (только debug-сцена). */
	setInvulnerable: (value: boolean) => void;
	/** Тайл в мировых координатах (смоук-тесты карты и админ-панели). */
	tileAt: (worldX: number, worldY: number) => number;
	/** Открыть админ-панель полигона (только debug-сцена). */
	openAdmin: () => void;
	/** Закрыть админ-панель полигона, если открыта. */
	closeAdmin: () => void;
}
import { RebirthSystem } from '../systems/RebirthSystem';
import { PlayerProgression } from '../systems/PlayerProgression';
import { ScreenManager } from '../ui/ScreenManager';
import { PlayerController } from '../controllers/PlayerController';
import Player from '../Player';
import { PistolWeapon } from '../items/weapons/PistolWeapon';
import {
	isPlaygroundEnabled,
	populatePlayground,
} from '../debug/playground';
import {
	World,
	CanvasChunkRenderer,
	ChunkViewManager,
	LODManager,
	SeededRandom,
	DEFAULT_WORLD_CONFIG,
} from '@firec/map-module';
import type { TileVisualProvider, TileVisualContext, TileVisual, WorldOptions } from '@firec/map-module';
import { TILE_DEFS, TILES } from '../map/Types';
import { RuinsGenerator } from '../map/generation/RuinsGenerator';
import { VoidGenerator } from '../map/generation/VoidGenerator';
import { CityGenerator } from '../map/generation/CityGenerator';
import { BunkerGenerator } from '../map/generation/BunkerGenerator';
import { IcedFieldsGenerator } from '../map/generation/IcedFieldsGenerator';
import { GlassPlainGenerator } from '../map/generation/GlassPlainGenerator';
import { AltarRegionGenerator } from '../map/generation/AltarRegionGenerator';
import { CrystalHallsGenerator } from '../map/generation/CrystalHallsGenerator';
import { AshWastesGenerator } from '../map/generation/AshWastesGenerator';
import { Game } from './Game';
import type { GameContext } from './GameContext';

/**
 * Фабрика для создания экземпляра игры со всеми зависимостями.
 * Централизует создание и настройку всех компонентов (composition root).
 */
export class GameFactory {
	/**
	 * Создаёт и настраивает все компоненты игры, возвращает готовый Game.
	 * @returns Экземпляр Game, готовый к запуску
	 */
	static async create(boot: BootOptions): Promise<Game> {
		// 0. Загрузка: сохранение слота и настройки из localStorage
		const saveData = boot.slot !== null ? loadSave(boot.slot) : null;
		const settings = settingsState.current;

		// 1. Базовые компоненты
		const canvas = document.querySelector<HTMLCanvasElement>('#canvas');
		if (!canvas) {
			throw new Error('Canvas not found');
		}

		const engine = new Engine(canvas);
		const mouse = new MouseInput(canvas);
		const input = new InputMapper();
		for (const [action, keys] of Object.entries(settings.bindings)) {
			input.rebind(action as InputAction, keys);
		}
		const camera = new Camera(canvas);
		camera.setMinZoom(settings.minZoom);

		// 2. Загрузка изображений (пути относительные — работают и локально, и на GitHub Pages)
		await engine.loadImages([
			'images/floor_0.png',
			'images/floor_1.png',
			'images/floor_2.png',
			'images/floor_3.png',
			'images/floor_4.png',
			'images/floor_5.png',
			'images/floor_6.png',
			'images/walls.png',
		]);

		// 3. Создание мира (тайловая карта): seed забега и карта зон
		const runSeed =
			saveData?.seed ?? boot.seed ?? ((Math.random() * 0x7fffffff) | 0);
		const regionMap = new RegionMap(
			DEFAULT_WORLD_CONFIG.chunkSize,
			DEFAULT_WORLD_CONFIG.tileSize
		);
		const world = this.createWorld(runSeed, regionMap, {
			config: {
				loadRadius: settings.renderRadius,
			},
		});
		const visuals = this.createVisuals(world, engine, regionMap);
		const renderer = new CanvasChunkRenderer({
			tiles: world.tiles,
			worldConfig: world.config,
			visuals: visuals,
			useCache: true,
		});
		const chunkView = new ChunkViewManager({
			worldConfig: world.config,
			renderer,
			lodManager: new LODManager(),
		});

		// 4. Сервисы
		const worldService = new WorldService(world);
		const pathfinder = new Pathfinder(worldService);
		const systemManager = new SystemManager();
		const entityWorld = new EntityWorld();

		// 5. Игрок (спавн в центре стартового чанка)
		const player = new Player(
			(worldService.config.chunkSize * worldService.config.tileSize) / 2,
			(worldService.config.chunkSize * worldService.config.tileSize) / 2
		);
		const playerController = new PlayerController(mouse, input, camera);
		player.controller = playerController;
		player.inventory.setWeapon(new PistolWeapon());
		if (saveData) {
			// Продолжение забега: позиция, прогресс и инвентарь из сейва
			player.x = saveData.player.x;
			player.y = saveData.player.y;
			player.setHP(saveData.player.hp);
			const inv = saveData.inventory;
			if (inv.weapon && ITEM_DEFINITIONS[inv.weapon]) {
				player.inventory.setWeapon(ITEM_DEFINITIONS[inv.weapon].factory() as never);
			}
			inv.modifiers.forEach((id, index) => {
				if (id && ITEM_DEFINITIONS[id]) {
					player.inventory.installModifier(
						ITEM_DEFINITIONS[id].factory() as Modifier,
						index
					);
				}
			});
			inv.chips.forEach((id, index) => {
				if (id && ITEM_DEFINITIONS[id]) {
					player.inventory.installChip(
						ITEM_DEFINITIONS[id].factory() as Chip,
						index
					);
				}
			});
		}
		entityWorld.spawn(player);

		// 6. Управление и UI
		const controlSwitch = new ControlSwitchService(
			player,
			playerController,
			(entity) => {
				// Танковая схема для червя: курс наследуется от ИИ-головы
				if (
					entity instanceof DeclarativeEntity &&
					entity.definition.controlScheme === 'tank'
				) {
					const previous = entity.controller as {
						getHeading?: () => number;
					} | null;
					return new WormPlayerController(
						input,
						mouse,
						previous?.getHeading?.() ?? 0
					);
				}
				return playerController;
			}
		);
		const screenManager = new ScreenManager(
			engine,
			mouse,
			() => controlSwitch.getCurrentControlled()
		);
		const floatingTextSystem = new FloatingTextSystem();
		const playerProgression = new PlayerProgression();
		if (saveData) {
			playerProgression.level = saveData.player.level;
			playerProgression.experience = saveData.player.experience;
		}

		const getControlled = () => controlSwitch.getCurrentControlled();
		const flow = new GameFlow(boot.mode === 'menu' ? 'menu' : 'playing');
		const journal = new JournalService();
		const stats = new StatsService(getControlled);
		if (saveData) stats.restoreRun(saveData.stats);

		// Журнал: подбор предметов, убийства и бартер открывают записи
		eventBus.on('itemPicked', ({ item }) => journal.unlockItem(item.id));
		eventBus.on('entityKilled', ({ victim }) => {
			const def = (victim as { definition?: { id: string } }).definition;
			if (def) journal.unlockEntity(def.id);
		});
		eventBus.on('barterCompleted', ({ offerId, playerId }) => {
			if (offerId) journal.unlockItem(offerId);
			if (playerId) journal.unlockItem(playerId);
		});

		// 7. Системы
		const pickupSystem = new PickupSystem(
			entityWorld,
			getControlled,
			input,
			screenManager,
			engine
		);

		systemManager.register(new MovementSystem(entityWorld, worldService));
		systemManager.register(new CollisionSystem(entityWorld, worldService));
		systemManager.register(new RebirthSystem(entityWorld, controlSwitch));
		systemManager.register(floatingTextSystem);
		const effectSystem = new EffectSystem(entityWorld, worldService);
		systemManager.register(effectSystem);
		systemManager.register(new CleanupSystem(entityWorld, getControlled));
		systemManager.register(pickupSystem);
		const entityFactory = new EntityFactory(
			entityWorld,
			pathfinder,
			getControlled,
			journal,
			effectSystem
		);
		const interactSystem = new InteractSystem(entityWorld, getControlled, input);
		systemManager.register(interactSystem);
		const regionFeatureSystem = new RegionFeatureSystem(
			entityWorld,
			worldService,
			regionMap,
			entityFactory,
			runSeed,
			screenManager,
			engine,
			floatingTextSystem,
			getControlled,
			journal
		);
		systemManager.register(regionFeatureSystem);
		systemManager.register(stats);
		systemManager.register(
			new EnemySpawnerSystem(
				player,
				entityWorld,
				worldService,
				regionMap,
				entityFactory,
				() => regionFeatureSystem.getSafeZones()
			)
		);
		// 7.5. Админ-панель полигона (F9): живое редактирование сущностей,
		// предметов, тайлов и телепортация. Только debug-сцена (?playground).
		let adminWindow: AdminWindow | null = null;
		const isAdminOpen = (): boolean =>
			adminWindow !== null && screenManager.getWindows().includes(adminWindow);
		const openAdminWindow = (): void => {
			if (isAdminOpen()) return;
			const win = new AdminWindow(
				{
					getControlled,
					entityWorld,
					world,
					camera,
					runSeed,
					restartWithSeed: (seed) => navigateTo(`?playground&seed=${seed}`),
					regionCenter: (id) => regionMap.regionCenterWorld(id),
				},
				engine.canvas.width,
				engine.canvas.height,
				() => {
					screenManager.closeWindow(win);
					adminWindow = null;
				}
			);
			adminWindow = win;
			screenManager.openWindow(win);
		};
		const adminToggle = isPlaygroundEnabled()
			? () => {
					if (isAdminOpen()) {
						screenManager.closeWindow(adminWindow as AdminWindow);
						adminWindow = null;
					} else {
						openAdminWindow();
					}
				}
			: undefined;
		systemManager.register(
			new UISystem(
				getControlled,
				entityWorld,
				input,
				screenManager,
				engine,
				floatingTextSystem,
				adminToggle
			)
		);
		systemManager.register(
			new ProgressionSystem(getControlled, playerProgression, screenManager, engine, floatingTextSystem)
		);
		systemManager.register(new CutsceneSystem(screenManager, engine, input));

		// 8. Настройка HUD
		screenManager.getHud().setPlayerProgression(playerProgression);
		screenManager.getHud().setPickupInRangeGetter(() => pickupSystem.getPickupInRange());
		screenManager.getHud().setInteractInRangeGetter(() =>
			interactSystem.getInteractInRange()
		);
		regionFeatureSystem.setOnZoneChange((name, color) => {
			screenManager.getHud().setZoneName(name, color);
		});

		// 9. Отладочный полигон (только при ?playground в URL)
		if (isPlaygroundEnabled()) {
			populatePlayground(entityWorld, player, entityFactory);
		}
		// Отладочные хуки для смоук-тестов UI (меню, пауза, журнал)
		{
			(window as unknown as { __debug?: GameDebugHooks }).__debug = {
				getControlled,
				entityWorld,
				entityFactory,
				regionMap,
				screenManager,
				worldService,
				housesAt: (chunkX: number, chunkY: number) =>
					housesForChunk(chunkX, chunkY, runSeed),
				zoneStats: () => regionFeatureSystem.debugStats,
				giveChip: (id: 'dash') => {
					if (id === 'dash') {
						getControlled().inventory.addChip(new DashChip());
					}
				},
				setInvulnerable: (value: boolean) => {
					getControlled().invulnerable = value;
				},
				tileAt: (worldX: number, worldY: number) =>
					world.getTileAt(worldX, worldY),
				openAdmin: () => {
					if (isPlaygroundEnabled()) openAdminWindow();
				},
				closeAdmin: () => {
					if (adminWindow) {
						screenManager.closeWindow(adminWindow);
						adminWindow = null;
					}
				},
				journalUnlocked: () => journal.getUnlocked(),
				forceDeath: () => {
					getControlled().takeDamage(999999);
				},
				giveItem: (id: 'damage_plus' | 'pierce') => {
					const modifiers = {
						damage_plus: new DamagePlusModifier(),
						pierce: new PierceModifier(),
					} as const;
					getControlled().inventory.installModifier(modifiers[id], 0);
				},
			};
		}

		// 9.5. Окна оболочек: пауза, итоги, меню; мета-счётчик запусков
		const cw = engine.canvas.width;
		const ch = engine.canvas.height;
		const openWindow = (win: Window): void => screenManager.openWindow(win);
		const openJournal = (): void =>
			openWindow(
				new JournalWindow(journal, cw, ch, () =>
					screenManager.closeWindowsOfType(JournalWindow)
				)
			);
		const openStats = (): void =>
			openWindow(
				new StatsWindow(stats, cw, ch, () =>
					screenManager.closeWindowsOfType(StatsWindow)
				)
			);
		const openSettings = (): void =>
			openWindow(
				new SettingsWindow(
					input,
					cw,
					ch,
					(zoom) => camera.setMinZoom(zoom),
					(radius) => {
						world.config.loadRadius = radius;
					},
					() => screenManager.closeWindowsOfType(SettingsWindow)
				)
			);
		const createPauseWindow = (): Window => {
			const win = new PauseWindow(cw, ch, {
				resume: () => screenManager.closeWindow(win),
				save: () =>
					openWindow(
						new SlotPickerWindow(
							'save',
							cw,
							ch,
							(slot) => {
								saveSave(slot, buildSave());
								screenManager.closeWindowsOfType(SlotPickerWindow);
							},
							() => screenManager.closeWindowsOfType(SlotPickerWindow)
						)
					),
				journal: openJournal,
				stats: openStats,
				settings: openSettings,
				quit: () => navigateTo(''),
			});
			return win;
		};
		const createResultsWindow = (): Window =>
			new RunResultsWindow(
				stats.getRunStats(),
				true,
				cw,
				ch,
				() => navigateTo('?run=new'),
				() => navigateTo('')
			);
		const buildSave = (): SaveData => ({
			version: 1,
			seed: runSeed,
			date: new Date().toISOString(),
			player: {
				x: player.x,
				y: player.y,
				hp: player.getHP(),
				level: playerProgression.level,
				experience: playerProgression.experience,
			},
			inventory: {
				weapon: player.inventory.weapon?.id ?? null,
				modifiers: (player.inventory.weapon?.modifierSlots ?? []).map(
					(modifier) => modifier?.id ?? null
				),
				chips: player.inventory.chips.map((chip) => chip?.id ?? null),
			},
			stats: stats.getRunStats(),
		});

		if (boot.mode === 'play') {
			const meta = loadMeta();
			meta.stats.runs++;
			saveMeta(meta);
			journal.unlockItem(player.inventory.weapon?.id ?? 'pistol');
		} else {
			screenManager.getHud().setVisible(false);
			openWindow(
				new MainMenuWindow(cw, ch, {
					newRun: () => navigateTo('?run=new'),
					continueRun: () =>
						openWindow(
							new SlotPickerWindow(
								'load',
								cw,
								ch,
								(slot) => navigateTo(`?slot=${slot}`),
								() => screenManager.closeWindowsOfType(SlotPickerWindow)
							)
						),
					journal: openJournal,
					stats: openStats,
					settings: openSettings,
				})
			);
		}
		screenManager
			.getHud()
			.setDebugGetter(() => ({ chunks: worldService.getLoadedChunks().length }));

		// 10. Контекст игры
		const ctx: GameContext = {
			engine,
			camera,
			mouse,
			input,
			entityWorld,
			worldService,
			pathfinder,
			systemManager,
			screenManager,
			controlSwitch,
			chunkView,
			entityFactory,
			regionMap,
			runSeed,
			flow,
			journal,
			stats,
			createPauseWindow,
			createResultsWindow,
		};

		return new Game(ctx);
	}

	/**
	 * Создаёт мир с зарегистрированными тайлами и генераторами.
	 */
	private static createWorld(
		runSeed: number,
		regionMap: RegionMap,
		options?: WorldOptions
	): World {
		const world = new World(options);

		for (const def of TILE_DEFS) {
			if (def.id === 0) continue;
			world.registerTile({
				id: def.id,
				name: def.name,
				passable: def.passable,
				opaque: def.opaque,
			});
		}

		world.registerGenerator(new VoidGenerator(regionMap));
		world.registerGenerator(new RuinsGenerator(runSeed, regionMap));
		world.registerGenerator(new CityGenerator(regionMap));
		world.registerGenerator(new BunkerGenerator(regionMap));
		world.registerGenerator(new IcedFieldsGenerator(regionMap));
		world.registerGenerator(new GlassPlainGenerator(regionMap));
		world.registerGenerator(new AltarRegionGenerator(regionMap));
		world.registerGenerator(new CrystalHallsGenerator(regionMap));
		world.registerGenerator(new AshWastesGenerator(regionMap));
		return world;
	}

	/**
	 * Создаёт визуальные провайдеры для тайлов мира.
	 */
	private static createVisuals(
		world: World,
		engine: Engine,
		regionMap: RegionMap
	): Map<number, TileVisualProvider> {
		const visuals = new Map<number, TileVisualProvider>();

		const floor: TileVisualProvider = (ctx: TileVisualContext): TileVisual => {
			const chunkHash = new SeededRandom(ctx.chunk.seed);
			const blockHash = chunkHash.fork(ctx.localX + ctx.localY * 16);
			const imageVariant = blockHash.nextInt(3, 7);
			const region = regionMap.regionAtChunk(ctx.chunk.x, ctx.chunk.y);

			if (!region.imageTiles) {
				return { sprite: regionFloorCanvas(region, imageVariant % 3) };
			}
			return {
				sprite: engine.getImage(`images/floor_${imageVariant}.png`),
			};
		};

		visuals.set(TILES.FLOOR, floor);

		visuals.set(TILES.WALL, (ctx: TileVisualContext): TileVisual => {
			const wallRegion = regionMap.regionAtChunk(ctx.chunk.x, ctx.chunk.y);
			if (!wallRegion.imageTiles) {
				return { sprite: regionWallCanvas(wallRegion) };
			}
			const { globalTileX: worldX, globalTileY: worldY } = ctx;
			const tileSize = world.config.tileSize;
			const gap = 1;

			function isWall(dx: number, dy: number): boolean {
				return world.getTileAtTile(worldX + dx, worldY + dy) === TILES.WALL;
			}

			let index = 0;
			if (isWall(0, -1)) index |= 1;
			if (isWall(1, 0)) index |= 2;
			if (isWall(0, 1)) index |= 4;
			if (isWall(-1, 0)) index |= 8;

			const spriteX = (index % 4) * (tileSize + gap);
			const spriteY = Math.floor(index / 4) * (tileSize + gap);

			return {
				sprite: engine.getImage('images/walls.png'),
				spriteRect: {
					x: spriteX,
					y: spriteY,
					width: tileSize,
					height: tileSize,
				},
			};
		});

		visuals.set(TILES.ROCK, floor);

		visuals.set(TILES.BUILDING, (ctx: TileVisualContext): TileVisual => {
			const chunkHash = new SeededRandom(ctx.chunk.seed);
			const blockHash = chunkHash.fork(ctx.localX + ctx.localY * 16);

			return {
				sprite: engine.getImage(
					`images/floor_${blockHash.nextInt(0, 4)}.png`
				),
			};
		});

		visuals.set(TILES.WATER, {
			color: '#369',
		});

		return visuals;
	}
}
