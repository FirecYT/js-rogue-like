import type { ChunkViewManager } from '@firec/map-module';
import type Engine from '../components/Engine';
import type { Camera } from '../components/Camera';
import type MouseInput from '../components/MouseInput';
import type { InputMapper } from '../input/InputMapper';
import type { EntityWorld } from './EntityWorld';
import type { WorldService } from '../services/WorldService';
import type { Pathfinder } from '../services/Pathfinder';
import type { SystemManager } from '../services/SystemManager';
import type { ScreenManager } from '../ui/ScreenManager';
import type { ControlSwitchService } from '../services/ControlSwitchService';
import type { EntityFactory } from '../services/EntityFactory';
import type { RegionMap } from '../services/RegionMap';
import type { GameFlow } from './GameFlow';
import type { JournalService } from '../services/JournalService';
import type { StatsService } from '../services/StatsService';
import type { Window } from '../ui/Window';

/**
 * Набор ключевых сервисов игры.
 *
 * ВАЖНО: полный контекст получают только Game и функции-фабрики.
 * Системы и сущности по-прежнему принимают явные зависимости через
 * конструктор (DI), чтобы GameContext не превращался в service locator.
 */
export interface GameContext {
	/** Движок: канвас, контекст, кэш изображений. */
	readonly engine: Engine;
	/** Камера, следующая за управляемой сущностью. */
	readonly camera: Camera;
	/** Состояние мыши. */
	readonly mouse: MouseInput;
	/** Маппер абстрактных действий на клавиши. */
	readonly input: InputMapper;
	/** Контейнер всех сущностей игры. */
	readonly entityWorld: EntityWorld;
	/** Фасад тайлового мира (@firec/map-module). */
	readonly worldService: WorldService;
	/** Поиск пути A*. */
	readonly pathfinder: Pathfinder;
	/** Менеджер систем (update/render по фазам). */
	readonly systemManager: SystemManager;
	/** Менеджер экранов и окон UI. */
	readonly screenManager: ScreenManager;
	/** Переключение управляемой сущности. */
	readonly controlSwitch: ControlSwitchService;
	/** Рендерер чанков карты. */
	readonly chunkView: ChunkViewManager;
	/** Конвейер сущностей: сборка врагов и боссов из декларативных определений. */
	readonly entityFactory: EntityFactory;
	/** Карта регионов мира: регион по координатам. */
	readonly regionMap: RegionMap;
	/** Seed забега (руины и раскладка зон уникальны на партию). */
	readonly runSeed: number;
	/** Машина состояний: меню / забег / итоги. */
	readonly flow: GameFlow;
	/** Журнал мира (открытие записей по встрече). */
	readonly journal: JournalService;
	/** Статистика забега и меты. */
	readonly stats: StatsService;
	/** Фабрика окна паузы (Esc во время забега). */
	readonly createPauseWindow: () => Window;
	/** Фабрика экрана итогов забега. */
	readonly createResultsWindow: () => Window;
}
