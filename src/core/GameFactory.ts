import Engine from '../components/Engine';
import MouseInput from '../components/MouseInput';
import { Camera } from '../components/Camera';
import { InputMapper } from '../input/InputMapper';
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
import { ControlSwitchSystem } from '../systems/ControlSwitchSystem';
import { RebirthSystem } from '../systems/RebirthSystem';
import { PlayerProgression } from '../systems/PlayerProgression';
import { ScreenManager } from '../ui/ScreenManager';
import { PlayerController } from '../controllers/PlayerController';
import Player from '../Player';
import Entity from '../entities/Entity';
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
} from '@firec/map-module';
import type { TileVisualProvider, TileVisualContext, TileVisual, WorldOptions } from '@firec/map-module';
import { TILE_DEFS, TILES } from '../map/Types';
import { RuinsGenerator } from '../map/generation/RuinsGenerator';
import { Game } from './Game';
import { VoidGenerator } from '../map/generation/VoidGenerator';

/**
 * Фабрика для создания экземпляра игры со всеми зависимостями.
 * Централизует создание и настройку всех компонентов (DI-контейнер).
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
		const camera = new Camera();

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

		// 3. Создание мира
		const world = this.createWorld({
			config: {
				loadRadius: 8
			}
		});
		const visuals = this.createVisuals(world, engine);
		const renderer = new CanvasChunkRenderer({
			tiles: world.tiles,
			worldConfig: world.config,
			visuals: visuals,
			useCache: true,
		});
		const viewManager = new ChunkViewManager({
			worldConfig: world.config,
			renderer,
			lodManager: new LODManager(),
		});

		// 4. Сервисы
		const worldService = new WorldService(world);
		const pathfinder = new Pathfinder(worldService);

		// 5. Системы и сущности
		const systemManager = new SystemManager();
		const floatingTextSystem = new FloatingTextSystem();
		const playerProgression = new PlayerProgression();
		const entities: Entity[] = [];

		// 6. Игрок
		const player = new Player(
			worldService.config.chunkSize * worldService.config.tileSize / 2,
			worldService.config.chunkSize * worldService.config.tileSize / 2
		);
		
		const playerController = new PlayerController(mouse, input);
		player.controller = playerController;
		entities.push(player);

		// 7. Управление
		const controlSwitchSystem = new ControlSwitchSystem(player, playerController);
		new RebirthSystem(entities, controlSwitchSystem);

		// 8. UI
		const screenManager = new ScreenManager(
			engine,
			mouse,
			() => controlSwitchSystem.getCurrentControlled()
		);

		// 9. Создание систем
		const movementSystem = new MovementSystem(entities, worldService);
		const collisionSystem = new CollisionSystem(entities);
		const cleanupSystem = new CleanupSystem(
			entities,
			() => controlSwitchSystem.getCurrentControlled()
		);
		const effectSystem = new EffectSystem(entities, worldService);
		const pickupSystem = new PickupSystem(
			entities,
			() => controlSwitchSystem.getCurrentControlled(),
			input,
			screenManager,
			engine
		);
		const enemySpawnerSystem = new EnemySpawnerSystem(
			player,
			entities,
			worldService,
			pathfinder
		);
		const uiSystem = new UISystem(
			() => controlSwitchSystem.getCurrentControlled(),
			entities,
			input,
			screenManager,
			engine,
			floatingTextSystem
		);
		const progressionSystem = new ProgressionSystem(
			() => controlSwitchSystem.getCurrentControlled(),
			playerProgression,
			screenManager,
			engine,
			floatingTextSystem
		);
		const cutsceneSystem = new CutsceneSystem(screenManager, engine, input);

		// 10. Регистрация систем
		systemManager.register(movementSystem);
		systemManager.register(collisionSystem);
		systemManager.register(floatingTextSystem);
		systemManager.register(cleanupSystem);
		systemManager.register(effectSystem);
		systemManager.register(pickupSystem);
		systemManager.register(enemySpawnerSystem);
		systemManager.register(uiSystem);
		systemManager.register(progressionSystem);
		systemManager.register(cutsceneSystem);

		// 11. Настройка HUD
		screenManager.getHud().setPlayerProgression(playerProgression);
		screenManager.getHud().setPickupInRangeGetter(() => pickupSystem.getPickupInRange());

		// 12. Начальное оружие игрока
		player.inventory.setWeapon(new PistolWeapon());

		// 13. Отладочный полигон (только при ?playground в URL)
		if (isPlaygroundEnabled()) {
			populatePlayground(entities, player);
		}

		return new Game(
			engine,
			camera,
			worldService,
			viewManager,
			systemManager,
			screenManager,
			controlSwitchSystem,
			entities,
			mouse
		);
	}

	/**
	 * Создаёт мир с зарегистрированными тайлами и генератором.
	 */
	private static createWorld(options?: WorldOptions): World {
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
		world.registerGenerator(new RuinsGenerator());
		return world;
	}

	/**
	 * Создаёт визуальные провайдеры для тайлов мира.
	 */
	private static createVisuals(
		world: World,
		engine: Engine
	): Map<number, TileVisualProvider> {
		const visuals = new Map<number, TileVisualProvider>();

		const floor: TileVisualProvider = (ctx: TileVisualContext): TileVisual => {
			const chunkHash = new SeededRandom(ctx.chunk.seed);
			const blockHash = chunkHash.fork(ctx.localX + ctx.localY * 16);

			return {
				sprite: engine.getImage(
					`images/floor_${blockHash.nextInt(3, 7)}.png`
				),
			};
		};

		visuals.set(TILES.FLOOR, floor);

		visuals.set(TILES.WALL, (ctx: TileVisualContext): TileVisual => {
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
