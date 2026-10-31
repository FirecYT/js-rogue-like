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
import { BiomeMap } from '../services/BiomeMap';
import { ZoneFeatureSystem } from '../systems/ZoneFeatureSystem';
import {
	biomeFloorCanvas,
	biomeWallCanvas,
} from '../content/biomes/palette';
import { InteractSystem } from '../systems/InteractSystem';

/** Отладочные хуки debug-сцены (?playground): доступ к миру и управляемой сущности. */
export interface GameDebugHooks {
	getControlled: () => import('../entities/Entity').default;
	entityWorld: import('../core/EntityWorld').EntityWorld;
	entityFactory: EntityFactory;
	biomeMap: BiomeMap;
	/** Менеджер экранов (для смоук-тестов UI). */
	screenManager: import('../ui/ScreenManager').ScreenManager;
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
	/** Неуязвимость управляемой сущности (только debug-сцена). */
	setInvulnerable: (value: boolean) => void;
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
	static async create(): Promise<Game> {
		// 1. Базовые компоненты
		const canvas = document.querySelector<HTMLCanvasElement>('#canvas');
		if (!canvas) {
			throw new Error('Canvas not found');
		}

		const engine = new Engine(canvas);
		const mouse = new MouseInput(canvas);
		const input = new InputMapper();
		const camera = new Camera(canvas);

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
		const runSeed = (Math.random() * 0x7fffffff) | 0;
		const biomeMap = new BiomeMap(
			runSeed,
			DEFAULT_WORLD_CONFIG.chunkSize,
			DEFAULT_WORLD_CONFIG.tileSize
		);
		const world = this.createWorld(runSeed, biomeMap, {
			config: {
				loadRadius: 8,
			},
		});
		const visuals = this.createVisuals(world, engine, biomeMap);
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

		const getControlled = () => controlSwitch.getCurrentControlled();

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
		systemManager.register(new EffectSystem(entityWorld, worldService));
		systemManager.register(new CleanupSystem(entityWorld, getControlled));
		systemManager.register(pickupSystem);
		const entityFactory = new EntityFactory(
			entityWorld,
			pathfinder,
			getControlled
		);
		const interactSystem = new InteractSystem(entityWorld, getControlled, input);
		systemManager.register(interactSystem);
		const zoneFeatureSystem = new ZoneFeatureSystem(
			entityWorld,
			worldService,
			biomeMap,
			entityFactory,
			runSeed,
			screenManager,
			engine,
			floatingTextSystem,
			getControlled
		);
		systemManager.register(zoneFeatureSystem);
		systemManager.register(
			new EnemySpawnerSystem(
				player,
				entityWorld,
				worldService,
				biomeMap,
				entityFactory,
				() => zoneFeatureSystem.getSafeZones()
			)
		);
		systemManager.register(
			new UISystem(getControlled, entityWorld, input, screenManager, engine, floatingTextSystem)
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
		zoneFeatureSystem.setOnZoneChange((name, color) => {
			screenManager.getHud().setZoneName(name, color);
		});

		// 9. Отладочный полигон (только при ?playground в URL)
		if (isPlaygroundEnabled()) {
			populatePlayground(entityWorld, player, entityFactory);
			// Отладочный доступ только для debug-сцены: смоук-тесты и консоль
			(window as unknown as { __debug?: GameDebugHooks }).__debug = {
				getControlled,
				entityWorld,
				entityFactory,
				biomeMap,
				screenManager,
				zoneStats: () => zoneFeatureSystem.debugStats,
				giveChip: (id: 'dash') => {
					if (id === 'dash') {
						getControlled().inventory.addChip(new DashChip());
					}
				},
				setInvulnerable: (value: boolean) => {
					getControlled().invulnerable = value;
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
			biomeMap,
			runSeed,
		};

		return new Game(ctx);
	}

	/**
	 * Создаёт мир с зарегистрированными тайлами и генераторами.
	 */
	private static createWorld(
		runSeed: number,
		biomeMap: BiomeMap,
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

		world.registerGenerator(new VoidGenerator());
		world.registerGenerator(new RuinsGenerator(runSeed, biomeMap));
		return world;
	}

	/**
	 * Создаёт визуальные провайдеры для тайлов мира.
	 */
	private static createVisuals(
		world: World,
		engine: Engine,
		biomeMap: BiomeMap
	): Map<number, TileVisualProvider> {
		const visuals = new Map<number, TileVisualProvider>();

		const floor: TileVisualProvider = (ctx: TileVisualContext): TileVisual => {
			const chunkHash = new SeededRandom(ctx.chunk.seed);
			const blockHash = chunkHash.fork(ctx.localX + ctx.localY * 16);
			const imageVariant = blockHash.nextInt(3, 8);
			const biome = biomeMap.biomeAtChunk(ctx.chunk.x, ctx.chunk.y);

			if (biome.id !== 'rust_wastes') {
				return { sprite: biomeFloorCanvas(biome, imageVariant % 3) };
			}
			return {
				sprite: engine.getImage(`images/floor_${imageVariant}.png`),
			};
		};

		visuals.set(TILES.FLOOR, floor);

		visuals.set(TILES.WALL, (ctx: TileVisualContext): TileVisual => {
			const wallBiome = biomeMap.biomeAtChunk(ctx.chunk.x, ctx.chunk.y);
			if (wallBiome.id !== 'rust_wastes') {
				return { sprite: biomeWallCanvas(wallBiome) };
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
