# Техническая документация js-rogue-like

> Полное описание архитектуры, кода, контентных таблиц и инструментария.
> Соответствует текущему состоянию ветки `master`.
> Лор и дизайн-видение — в `DESIGN.md`.

---

## Оглавление

1. [Обзор](#1-обзор)
2. [Стек, сборка, запуск](#2-стек-сборка-запуск)
3. [Архитектура: слои и поток данных](#3-архитектура-слои-и-поток-данных)
4. [Ядро (core)](#4-ядро-core)
5. [Системы (systems)](#5-системы-systems)
6. [Сервисы (services)](#6-сервисы-services)
7. [Сущности и компоненты](#7-сущности-и-компоненты)
8. [Конвейер сущностей](#8-конвейер-сущностей)
9. [Искусственный интеллект и контроллеры](#9-искусственный-интеллект-и-контроллеры)
10. [Предметы: оружие, модификаторы, чипы](#10-предметы-оружие-модификаторы-чипы)
11. [Эффекты и снаряды](#11-эффекты-и-снаряды)
12. [Мир: регионы, генерация, структуры](#12-мир-регионы-генерация-структуры)
13. [UI: canvas-фреймворк и окна](#13-ui-canvas-фреймворк-и-окна)
14. [Оболочка: меню, сейвы, журнал, статистика, настройки](#14-оболочка-меню-сейвы-журнал-статистика-настройки)
15. [События (EventBus)](#15-события-eventbus)
16. [Фракции и боевая модель](#16-фракции-и-боевая-модель)
17. [Прогрессия и уровни](#17-прогрессия-и-уровни)
18. [Ввод и управление](#18-ввод-и-управление)
19. [Отладка: __debug-хуки и playground](#19-отладка-__debug-хуки-и-playground)
20. [Тестирование](#20-тестирование)
21. [Репозиторий и артефакты](#21-репозиторий-и-артефакты)
22. [Не реализовано / точки расширения](#22-не-реализовано--точки-расширения)

---

## 1. Обзор

**Жанр и формат:** 2D top-down rogue-like. Чистый TypeScript + Canvas 2D,
без игрового движка; единственный внешний игровой модуль — `@firec/map-module`
(тайловый мир с чанковой подгрузкой).

**Масштаб:** 140 TypeScript-файлов, ~14 000 строк в `src/`; 8 файлов
юнит-тестов (31 тест); E2E-смоук из 8 сценариев на puppeteer.

**Ключевые свойства:**

| Свойство | Значение |
|---|---|
| Частота симуляции | Фиксированные 60 Гц (аккумулятор времени, догон ≤250 мс за кадр) |
| Рендер | Canvas 2D каждый кадр (rAF); весь UI — тоже canvas, без DOM-оверлеев |
| Мир | Бесконечные чанки 16×16 тайлов, тайл 32 px (чанк = 512×512 px) |
| Структура мира | Мир собран из **регионов**: прямоугольник чанков + собственный генератор, палитра, таблица спавна, пул лута |
| Контент | Декларативные реестры (`ENTITY_DEFINITIONS`, `ITEM_DEFINITIONS`, `REGION_DEFINITIONS`): новые враги/предметы/регионы добавляются данными, без новых классов |
| Персистентность | localStorage: 3 слота сохранений, мета (журнал + статистика), настройки |
| Оболочка | Главное меню с attract-камерой, пауза, итоги забега, журнал открытий, настройки с ремапом клавиш |
| Тайминги | Все кулдауны и таймеры — в кадрах фиксированного тика, не в миллисекундах |

---

## 2. Стек, сборка, запуск

### Зависимости

| Пакет | Роль |
|---|---|
| `typescript` ^5.5 (strict) | Язык; компиляция через `ts-loader` |
| `webpack` 5 + `webpack-cli` | Сборка в `build/index.js` |
| `eslint` 9 + `eslint-webpack-plugin` | Линт (flat config) внутри сборки |
| `prettier` | Форматирование (табы) |
| `vitest` ^4 (dev) | Юнит-тесты |
| `@firec/map-module` | `World`, `ChunkGenerator`, `GeneratorRegistry`, `SeededRandom`, `CanvasChunkRenderer`, `ChunkViewManager` |

### Скрипты npm

| Скрипт | Команда | Назначение |
|---|---|---|
| `build` | `webpack --mode production` | Прод-сборка |
| `build:dev` | `webpack --mode development` | Отладочная сборка |
| `watch` | `webpack --watch --progress` | Пересборка при изменениях |
| `test` | `vitest run` | Юнит-тесты (однократный прогон) |
| `serve` | `node serve.js` | Локальный статик-сервер |
| `lint` / `format` | eslint / prettier | Качество кода |

### Точка входа и параметры URL

`src/index.ts`:
```ts
const game = await GameFactory.create(parseBootOptions());
game.start();
window.addEventListener('beforeunload', () => game.dispose());
```

| URL | Поведение |
|---|---|
| `index.html` | Главное меню: attract-камера кружит над миром, симуляция стоит |
| `index.html?run=new` | Новый забег (seed случайный), спавн в Ядре Пустоты |
| `index.html?slot=N` (1..3) | Продолжить забег из слота N (мир воссоздаётся из seed) |
| `index.html?playground` | Отладочный полигон: весь контент рядом со спавном + `__debug`-хуки |
| `…&seed=N` | Фиксированный seed забега (детерминированная генерация мира; приоритет у seed из сейва слота) |

`__debug`-хуки доступны во всех режимах загрузки.

### Ключи localStorage

| Ключ | Содержимое |
|---|---|
| `jsrl.save.1` … `jsrl.save.3` | Снимки забегов (`SaveData`, см. §6/§14) |
| `jsrl.meta.v1` | Мета между забегами: журнал, непрочитанные записи, суммарная статистика |
| `jsrl.settings.v1` | Настройки: бинды, зум, радиус рендера, HUD, debug-оверлей |

---

## 3. Архитектура: слои и поток данных

```
src/
├── index.ts                 # бутстрап: parseBootOptions → GameFactory.create → start
├── Player.ts                # класс игрока
├── core/                    # Game (цикл), GameFactory (composition root),
│                            # GameContext, EntityWorld, GameFlow, BootOptions, interfaces
├── systems/                 # 14 систем кадра (фазы UpdatePhase)
├── services/                # 11 сервисов: WorldService, Pathfinder, RegionMap,
│                            # EntityFactory, Journal/Stats/Settings/Meta/Save,
│                            # ControlSwitch, SystemManager
├── controllers/             # ИИ и управление: FSM-враги, червь, турель, поселенец,
│                            # сегмент, игрок (top-down и танковая схемы), чипы
├── entities/                # Entity (база), DeclarativeEntity (конвейер), Trader,
│                            # Altar, пикапы, TrainingDummy
├── components/              # GameObject, Inventory, Camera, Engine, Keyboard,
│                            # MouseInput, Cooldown, FloatingText
├── items/                   # Item/Weapon/Chip/Modifier, CastState, каталоги
├── effects/                 # Снаряды и зоны: Bullet, Laser, Rocket, FireZone, Explosion
├── content/                 # КОНТЕНТНЫЕ РЕЕСТРЫ (данные, не классы):
│   ├── entities/definitions.ts   # ENTITY_DEFINITIONS, AiProfile, AiPhase
│   ├── items/definitions.ts      # ITEM_DEFINITIONS (id → фабрика)
│   ├── regions/definitions.ts    # REGION_DEFINITIONS, REGION_ORDER
│   ├── regions/palette.ts        # процедурные тайл-спрайты пола/стен региона
│   └── upgrades.ts               # пул улучшений уровня
├── map/                     # генераторы чанков регионов, дома руин
├── ui/                      # canvas-UI-фреймворк: Component/Container/Window,
│                            # ScreenManager, 13 окон, HUD
├── input/                   # InputAction (enum), InputMapper (ремап)
├── events/                  # EventBus (типизированная шина)
├── types/                   # Team, EntityTraits, Interactable
├── debug/playground.ts      # наполнение отладочной сцены
└── utils.ts
```

**Кадр игры:**

```
Game.tick (rAF)
 ├─ аккумулятор += min(dt, 250ms); while (аккумулятор ≥ 1/60c) → Game.update()
 └─ Game.render()

Game.update()
 ├─ flow.state === 'menu'? → attract-камера (круг R=6200, 0.0016 рад/тик),
 │                            worldService, screenManager, return
 ├─ camera.update() + follow(controlled)
 ├─ worldService.update(controlled.x, controlled.y)   # чанки вокруг игрока
 ├─ mouse.update() (+ зум колесом)
 ├─ screenManager.isGamePaused()
 │    ├─ да  → systemManager.updateWhilePaused()      # только runsWhilePaused
 │    └─ нет → systemManager.update()                 # все системы по фазам
 ├─ screenManager.update()      # мышь передаётся только верхнему окну стека
 └─ keyboard.update() + глобальные клавиши (Esc: закрыть окно → иначе пауза)

Game.render() → фон/чанки (ChunkView) → системы (IRenderable) → сущности
                → эффекты → screenManager.render (затемнение + HUD + окна)
```

**Архитектурные правила:**

- Системы не ссылаются друг на друга — только `GameContext` и шина событий.
- Подписки на события возвращают `Unsubscribe`; системы отписываются в `dispose()`.
- Контент описывается данными в реестрах; поведение собирается конвейером
  (`EntityFactory`) из определения.
- UI живёт на canvas (Component/Container/Window), без DOM-элементов поверх игры.
- Окна с флагом `causesPause` останавливают симуляцию; ввод мыши получает
  только верхнее окно стека (перекрытые окна не ловят клики).

---

## 4. Ядро (core)

### Game

Игровой цикл с фиксированным шагом: `TICK_MS = 1000/60`, ограничение догона
`MAX_CATCHUP_MS = 250` (защита от «спирали смерти» при лагах/фоновой вкладке).
В меню (`flow.state === 'menu'`) симуляция не идёт — только attract-камера,
мир и UI. Esc в забеге: закрыть верхнее окно → иначе пауза (окно итогов
не закрывается).

### GameFlow

`state: 'menu' | 'playing' | 'ended'` + `menuTicks` (счётчик тиков меню для
attract-камеры). Переходы: меню → playing (новый забег / загрузка слота),
playing → ended (смерть без чипа перерождения → окно итогов), ended → menu
или playing.

### BootOptions

`parseBootOptions()` разбирает URL в `{ mode: 'menu'|'play', playground, slot, seed }`.
`navigateTo(query)` — навигация между оболочкой и забегом через URL.

### GameFactory — composition root

`GameFactory.create(boot)` собирает всё: Engine/canvas, `World` (map-module)
с зарегистрированными генераторами регионов, камеру, ввод, EntityWorld,
сервисы, системы, игрока (новый или из сейва), окна оболочки, подписки
журнала на события, `__debug`-хуки; возвращает `Game`.

Порядок сборки: WorldService → RegionMap → Pathfinder → ControlSwitch →
ScreenManager+HUD → EffectSystem → EntityFactory(…, effectSystem) → системы
по фазам → JournalService/StatsService + подписки событий → окна оболочки.

Журнал открытий подписан на события:
```ts
eventBus.on('itemPicked',      ({ item }) => journal.unlockItem(item.id));
eventBus.on('entityKilled',    ({ victim }) => journal.unlockEntity(victim.definition.id));
eventBus.on('barterCompleted', ({ offerId, playerId }) => { unlockItem(offerId); unlockItem(playerId); });
```

### GameContext

Неизменяемый контейнер зависимостей: `engine, camera, mouse, input,
entityWorld, worldService, pathfinder, systemManager, screenManager,
controlSwitch, chunkView, entityFactory, regionMap, runSeed, flow, journal,
stats, createPauseWindow, createResultsWindow`.

### EntityWorld

Единственный владелец списка сущностей: `spawn(entity)`, `all: readonly Entity[]`.
Системы итерируют `all`.

### SystemManager

Реестр систем: `register()` (сортировка по `phase`), `update()`,
`updateWhilePaused()` (только `runsWhilePaused`), `render()` (для
`IRenderable`), `dispose()` (отписка всех).

### UpdatePhase

| Фаза | № | Системы |
|---|---|---|
| Input | 0 | — (ввод читается из Keyboard/MouseInput напрямую) |
| Movement | 1 | MovementSystem |
| Collision | 2 | CollisionSystem |
| Combat | 3 | RebirthSystem |
| Effects | 4 | EffectSystem, FloatingTextSystem |
| Pickup | 5 | PickupSystem, InteractSystem |
| Spawner | 6 | EnemySpawnerSystem, RegionFeatureSystem |
| Cleanup | 7 | CleanupSystem |
| UI | 8 | UISystem, ProgressionSystem, CutsceneSystem, StatsService |

---

## 5. Системы (systems)

| Система | Фаза | Ответственность и ключевые константы |
|---|---|---|
| `MovementSystem` | Movement | `controller.update(entity, world)` для всех управляемых, `inventory.update()`, `entity.update()` (кастомная логика, например респавн манекена) |
| `CollisionSystem` | Collision | Отталкивание solid-сущностей при пересечении хитбоксов (сущность↔сущность; тайлы — в `WorldService.tryMove`) |
| `RebirthSystem` | Combat | Подписка на `entityDied`: при наличии чипа Rebirth у умершего управление переходит **ближайшему живому врагу** |
| `EffectSystem` | Effects | Контейнер эффектов: `add(effect)`, обновление по списку сущностей, создание снарядов из `weaponFired` (ProjectileSpec), `explodeOnHit`, детонация ракет (onDeath → ExplosionEffect) |
| `FloatingTextSystem` | Effects | Всплывающие тексты (урон, опыт, названия регионов): жизненный цикл + рендер |
| `PickupSystem` | Pickup | Подбор пикапов на E; при занятых слотах — PickupWindow; эмитит `itemPicked` |
| `InteractSystem` | Pickup | Ближайший `Interactable` в радиусе → подсказка `[E] <interactLabel>` в HUD; вызов `interact()` по E |
| `EnemySpawnerSystem` | Spawner | Периодический спавн мобов вокруг игрока: интервал **180 кадров**, кольцо **300–500 px**, 6 попыток; фильтры: регион не `safe`, тайл проходим, вне безопасных зон (+**240 px** отступа для FSM-врагов — блуждающий патруль не заходит в дома); выбор `defId` по весам таблицы региона |
| `RegionFeatureSystem` | Spawner | Структуры по загрузке чанка: дома руин (поселенцы, торговцы, медики), ячейки города, алтари боссов в центрах алтарных регионов, тайники лута, костры и бродячие мусорщики в диких регионах; безопасные зоны; объявление смены региона + открытие региона в журнале; скан встреч для журнала (см. §14); `debugStats` |
| `CleanupSystem` | Cleanup | Удаляет мёртвых из EntityWorld; защищает управляемую сущность и `persistent` |
| `ProgressionSystem` | UI | Подписка на `entityKilled`: опыт управляемого-убийцы, всплывающий `+N`, LEVEL UP → LevelUpWindow |
| `CutsceneSystem` | UI | Подписка на `cutsceneStart`: CutsceneWindow (пауза), далее — клик/E |
| `UISystem` | UI | Глобальные UI-действия: Tab (инвентарь), F12 (fullscreen) |
| `PlayerProgression` | — | Данные уровня: `level`, `experience`, `experienceToNext = level × 100`, `progress` |

---

## 6. Сервисы (services)

### WorldService — фасад тайлового мира

| Метод | Назначение |
|---|---|
| `isPassable(worldX, worldY)` | Проходимость тайла |
| `canFit(x, y, w, h)` | Помещается ли хитбокс |
| `tryMove(x, y, nx, ny, w, h)` | Движение с коллизией о тайлы (скольжение вдоль стен) |
| `hasLineOfSight(x1,y1,x2,y2,maxDist)` | Луч видимости (аггро, стрельба) |
| `destroyTile(worldX, worldY)` | Разрушение тайла стены (→ пол): Destruct-модификатор, взрывы, червь |
| `getPassableNeighbors(...)` | Проходимые соседи тайла (для A*) |
| `worldToTile / tileToWorld` | Преобразования координат |
| `config` | `{ chunkSize: 16, tileSize: 32 }` |
| `update(x, y)` | Центрирование догрузки чанков |
| `onChunkLoaded(cb)` | Подписка на догрузку чанка (использует RegionFeatureSystem) |
| `getLoadedChunks()` | Загруженные чанки |

### Pathfinder

A* по тайлам: `findPath({ start, end, maxNodes }): Path` (`Path = WorldCoord[]`,
`[0]` — стартовая точка). Клиенты кэшируют путь и пересчитывают раз в N кадров.

### RegionMap

Макрораскладка мира (детерминирована, одинакова во всех забегах):
`regionAtChunk(cx, cy)`, `regionAtWorld(x, y)` — первый подходящий
прямоугольник в `REGION_ORDER`, иначе fallback `ruins`; `regionCenterWorld(id)`.

### EntityFactory — конвейер сущностей

- `spawn(defId, x, y): DeclarativeEntity` — собирает сущность из определения:
  статы, внешность, контроллер по `ai.kind`, снаряжение (loadout); открывает
  запись журнала, если спавн в пределах **900 px** от управляемой сущности.
- `spawnBoss(defId, x, y)` — голова + цепочка сегментов (`BossSpec.segments`,
  `segmentGap`); сегменты гибнут вместе с головой.
- Конструктор: `new EntityFactory(entityWorld, pathfinder, getTarget, journal?, effectSystem?)`.

### ControlSwitchService

Хранит текущую управляемую сущность; `switchTo(entity)` переставляет
контроллер игрока (top-down или танковый по `controlScheme` тела) — основа
перерождения и играбельности боссов.

### JournalService

Журнал открытий: до встречи запись показана как «???». API: `unlock(id)`,
`unlockEntity(defId)` → `e:`/`n:`, `unlockItem(itemId)` → `i:`,
`unlockRegion(regionId)` → `r:`, `markRead(id)`, `isNew(id)`, `isUnlocked(id)`,
`getUnlocked()`, `entries(category)`. Персистится через MetaStorage
(`journal`, `journalNew`).

Источники открытия записей:

| Запись | Открывается |
|---|---|
| Враги/NPC (`e:`/`n:`) | спавн в 900 px от игрока; периодический скан встреч (радиус 900 px, раз в 30 кадров); убийство (`entityKilled`) |
| Предметы (`i:`) | подбор (`itemPicked`); обе стороны бартера (`barterCompleted`) |
| Торговец (`n:trader`) | открытие окна бартера |
| Медик (`n:medic`) | встреча в радиусе 900 px (скан) или первое успешное лечение |
| Регионы (`r:`) | первое посещение региона |

### StatsService

Статистика забега (`RunStats`): `ticks` (кадры 60 Гц), `kills` (по id),
`killsTotal`, `bosses`, `pickups`, `trades`. Подписки: `entityKilled` (только
убийства управляемой сущности), `itemPicked`, `barterCompleted`.
`endRun(died)` — однократное слияние в мету; `restoreRun(saved)` — из сейва.

### MetaStorage

`loadMeta()/saveMeta(state)`, ключ `jsrl.meta.v1`, устойчивость к битым
данным (дефолты при ошибке парсинга).
`MetaState = { journal: string[], journalNew: string[], stats: MetaStats }`;
`MetaStats = { runs, runsEnded, totalKills, totalDeaths, bestRunTicks,
totalTrades, totalPickups, bossesKilled }`.

### SettingsService

`loadSettings()/saveSettings()/settingsState.current`, ключ
`jsrl.settings.v1`, частичные данные сливаются с дефолтами:

| Поле | Дефолт | Смысл |
|---|---|---|
| `bindings` | `{}` | Переопределённые клавиши (действие → коды) |
| `minZoom` | `0.2` | Минимальный зум камеры (0.1–0.5) |
| `renderRadius` | `8` | Радиус загрузки/рендера чанков (6–14) |
| `hud.zoneLabel` | `true` | Метка региона |
| `hud.hpBars` | `true` | Полоски HP над сущностями |
| `hud.floatingTexts` | `true` | Всплывающие тексты |
| `debugOverlay` | `false` | Оверлей FPS/чанков |

### SaveService

3 слота (`jsrl.save.1..3`), `SaveData` (version 1):
```ts
{ version: 1, seed: number, date: string /*ISO*/,
  player: { x, y, hp, level, experience },
  inventory: { weapon: string|null, modifiers: (string|null)[], chips: (string|null)[] },
  stats: RunStats }
```
`listSlots(): SlotInfo[]` (`exists, date, level, ticks`) для окна выбора слота.
Мир детерминированно воссоздаётся из `seed`; предметы — из `ITEM_DEFINITIONS` по id.

---

## 7. Сущности и компоненты

### Иерархия

```
GameObject (x, y, hp/maxHP, isDead, getHP, abstract render)
└── Entity (+ Inventory, speed = base × multiplier, width/height,
│           persistent, team, targetable, invulnerable, solid,
│           spawnX/spawnY (точка спавна для ИИ), lastAttacker,
│           takeDamage → entityKilled (при attacker) + entityDied,
│           setHP, heal, getCooldowns)
    ├── Player            # HP 1000, speed 3, damage 10, 10×10 px, цвет по HP
    ├── DeclarativeEntity # конвейер: всё из EntityDefinition
    │                     #   (+ controller, experience, colorOverride)
    ├── Trader            # прилавок offers[3], «Торговать (бартер)»
    ├── Altar             # «Пробудить хранителя руин», одноразовый призыв
    │                     #   босса (bossDefId) + катсцена
    ├── TrainingDummy     # persistent, респавн 180 кадров, показывает урон
    └── PickupItem → WeaponPickup / ModifierPickup / ChipPickup
```

### Inventory

- `weapon: Weapon | null` — одно оружие; `replaceWeapon()` возвращает старое.
- `weapon.modifierSlots` — **4 слота** модификаторов у всех оружий; слоты
  оружия принимают только модификаторы, сам снаряд определяется оружием.
- `chips[5]` — активные чипы (клавиши 1–5/Q).
- `fire(angle)`: готовность → `cooldown.setDuration(weapon.fireRate)`,
  `start()`, `weapon.fire(entity, angle)`.
- `useChip(i)`, `isChipReady(i)`, `addItem(item)` (роутинг по `type`).

### Camera

Следование lerp `0.05`; зум колесом шагами `×2^steps` в диапазоне
`[minZoom (настройка), 4]`; `setMinZoom()`; `setFollowPoint(x, y)` для
attract-режима меню. Прицеливание учитывает зум и положение камеры.

### Прочие компоненты

- **Engine** — canvas + 2D-контекст + кэш изображений; fullscreen по F12.
- **Keyboard** — синглтон: `isDown(code)`, `isKeyPressedOnce(code)`, `update()`.
- **MouseInput** — x/y (экранные), cx/cy (мировые), кнопки, `wheelDelta`.
- **Cooldown** — кадровая перезарядка: `start/update/isReady/setDuration`.
- **FloatingText** — всплывающий текст с временем жизни в кадрах.

---

## 8. Конвейер сущностей

### EntityDefinition — полное описание сущности данными

```ts
interface EntityDefinition {
  id: string; name: string;
  hp: number; speed: number; size: number;       // size = хитбокс и база внешности
  team: Team;                                    // 'player' | 'enemy' | 'neutral'
  solid?: boolean; targetable?: boolean; persistent?: boolean;
  experience?: number;                           // опыт за убийство
  controlScheme?: 'topdown' | 'tank';            // схема управления этим телом
  appearance: { shape: 'rect'|'circle'; size; color; outline?; showHpBar? };
  ai?: AiProfile;                                // поведение (§9)
  loadout?: { weapon?(); modifiers?(); chips?[] };
  boss?: { title; segments; segmentGap?; segmentDef?; summonLines? };
  journal?: 'enemy' | 'boss' | 'npc';            // категория журнала
  description?: string;                          // лор для журнала
}
```

### ENTITY_DEFINITIONS — реестр сущностей

| id | Имя | HP | Скор. | Размер | Команда | Опыт | AI | Снаряжение | Журнал |
|---|---|---|---|---|---|---|---|---|---|
| `rust_grunt` | Ржавый боец | 12 | 1.2 | 8 | enemy | 5 | enemy/**chaser** (агро 500, огонь 400, репуть 60, поводок 1500, блуждание 180) | Shotgun | enemy |
| `rust_worm` | Ржавый червь (БОСС) | 350 | 1.7 | 24 | enemy | 120 | worm (агро 600, огонь 420, волна 0.5/0.05); boss: 6 сегментов, gap 26; tank | BossCannon + RebirthChip | boss |
| `rust_worm_segment` | Сегмент червя | 60 | 2.2 | 16 | enemy | — | follower (дистанция 26) | — | — |
| `glass_shard` | Стеклянный осколок | 10 | 1.6 | 8 | enemy | 6 | enemy/**timid** (агро 520, огонь 380, репуть 50, поводок 1400, блуждание 200, бегство < 40% HP) | LaserGun | enemy |
| `glass_wisp` | Стеклянный блик | 6 | 2.4 | 6 | enemy | 4 | enemy/**kiter** (агро 600, огонь 300, репуть 40, поводок 1600, блуждание 240) | Pistol | enemy |
| `ice_shard` | Ледяной осколок | 12 | 1.4 | 8 | enemy | 6 | enemy/**kamikaze** (агро 500, репуть 30, поводок 1400, блуждание 160; подрыв: триггер 34 px, радиус 70, урон 18, разгон ×1.8) | LaserGun (не используется) | enemy |
| `glass_warden` | Стеклянный страж (БОСС) | 300 | 0 | 22 | enemy | 100 | turret (огонь 480, **фазы** ниже); tank; boss: 0 сегментов | LaserGun + DamageMult + Multicast(2, 0.4) + RebirthChip | boss |
| `scrap_hound` | Мусорный пёс | 8 | 2.2 | 7 | enemy | 4 | enemy/**chaser** (агро 540, огонь 320, репуть 40, поводок 1500, блуждание 240) | Pistol | enemy |
| `ash_crawler` | Пепельный ползун | 16 | 1.0 | 10 | enemy | 7 | enemy/**chaser** (агро 500, огонь 380, репуть 60, поводок 1400, блуждание 160) | Shotgun | enemy |
| `cinder_mite` | Золовка | 5 | 2.6 | 6 | enemy | 3 | enemy/**kamikaze** (агро 480, репуть 30, поводок 1300, блуждание 140; подрыв: триггер 30 px, радиус 55, урон 12, разгон ×2.0) | — | enemy |
| `rust_sniper` | Ржавый снайпер | 10 | 0.9 | 8 | enemy | 8 | enemy/**kiter** (агро 750, огонь 600, репуть 70, поводок 1800, блуждание 120) | Railgun | enemy |
| `crystal_sentinel` | Кристальный часовой | 18 | 1.1 | 9 | enemy | 8 | enemy/**kiter** (агро 620, огонь 420, репуть 55, поводок 1600, блуждание 180) | LaserGun | enemy |
| `scrap_tyrant` | Скрепный тиран (БОСС) | 420 | 0 | 24 | enemy | 150 | turret (огонь 520, **фазы** ниже); tank; boss: 0 сегментов | RocketLauncher + RebirthChip | boss |
| `crystal_serpent` | Кристальный змей (БОСС) | 300 | 2.0 | 20 | enemy | 130 | worm (агро 640, огонь 420, волна 0.7/0.06); boss: 5 сегментов, gap 22; tank | PlasmaRifle + RebirthChip | boss |
| `crystal_serpent_segment` | Грань змея | 45 | 2.4 | 14 | enemy | — | follower (дистанция 22) | — | — |
| `settler` | Поселенец | 30 | 0.6 | 9 | player | — | settler (прогулки у дома) | Pistol (декорация) | npc |
| `scavenger` | Мусорщик | 25 | 0.7 | 9 | player | — | settler (прогулки у точки спавна) | — | npc |

Не-конвейерные NPC (отдельные классы, §12): `Trader` (бартер), `Medic`
(полное лечение по E, перезарядка 900 кадров), `Altar` (призыв босса).

### Фазы glass_warden (`AiProfile.phases`)

| Фаза | Условие (доля HP) | Залп | Темп | Урон | Внешность |
|---|---|---|---|---|---|
| 0 | ≤ 1.0 (старт) | базовый (1 × Multicast 2) | ×1 | ×1 | синий `#0ea5e9` |
| 1 | ≤ 0.6 | 3 снаряда, веер 0.5 рад | ×0.75 (чаще) | ×1 | — |
| 2 | ≤ 0.3 | 8 снарядов, кольцо 2π | ×0.6 | ×1.25 | красный `#f87171` (`colorOverride`) |

### Фазы scrap_tyrant

| Фаза | Условие (доля HP) | Залп | Темп | Урон | Внешность |
|---|---|---|---|---|---|
| 0 | ≤ 1.0 (старт) | 1 ракета | ×1 | ×1 | серый `#737373` |
| 1 | ≤ 0.6 | 4 ракеты, веер 1.1 рад | ×0.8 | ×1 | — |
| 2 | ≤ 0.3 | 10 ракет, кольцо 2π | ×0.6 | ×1.25 | оранжевый `#f97316` |

Фазы применяются `TurretController.updatePhase()`: перезапись
`weapon.fireRate/shots/shotSpread/damageMultiplier` от захваченных базовых
значений + `colorOverride` тела. `phaseIndex` публичен.

---

## 9. Искусственный интеллект и контроллеры

`IController.update(entity, world)` — единый интерфейс; контроллер назначается
`EntityFactory.createController` по `ai.kind`:

| kind | Контроллер | Для кого |
|---|---|---|
| `enemy` | **EnemyFsmController** | все рядовые враги (4 архетипа) |
| `worm` | WormController | головы rust_worm, crystal_serpent |
| `turret` | TurretController (+фазы) | glass_warden, scrap_tyrant |
| `follower` | FollowerController | сегменты червя и змея |
| `settler` | SettlerController | поселенцы, мусорщики |
| `stationary` | — (null) | неподвижные |
| — | PlayerController / WormPlayerController | управляемая сущность |

### EnemyFsmController — конечный автомат рядовых врагов

**Состояния** (публичное поле `state`):

| Состояние | Поведение |
|---|---|
| `idle` | Блуждание у точки спавна (`wanderRadius`, скорость ×0.5) со случайными паузами 60–180 кадров (шанс 40%) |
| `chase` | Погоня через A* к цели (или к последней известной позиции); стрельба/архетипное поведение |
| `search` | Обыск последней известной позиции (240 кадров): подходы, осмотры по кругу |
| `flee` | Бегство прямо от цели (×1.25), пока дистанция > 1.5×агро → `return` |
| `return` | Возврат домой (×1.1), лечение 1 HP/30 кадров; в точке спавна (<24 px) — полное восстановление → `idle` |

**Обнаружение цели (аггро):**

- по **прямой видимости**: цель в `aggroRange` **и** `hasLineOfSight` —
  сквозь стены враги игрока не «чувствуют»;
- по **свежему урону**: после `takeDamage` 300 кадров действует память
  атакующего (`Entity.lastAttacker`) — аггро в радиусе `aggroRange × 1.5`
  без требования видимости (атакованный враг знает, откуда прилетело).

**Движение в бою (`moveAlong`):** всегда строится A*-путь (пересчёт раз в
`repathInterval`); прямолинейный ход допустим только когда цель видна. Если
путь не найден и цели не видно — враг стоит на месте (дальше отработают память
цели → `search` → `return`). Враги огибают стены, а не давят в них.

**Память цели:** при видимости каждый кадр запоминается `lastKnown`,
`memoryTimer = 180`; без видимости таймер тикает, по исходу — `search`;
не нашёл — `return`.

**Поводок (leash):** `dist(дом) > leashRange` → немедленный `return`; в
`return` при новом аггро и `dist(дом) < leashRange × 0.8` — обратно в `chase`.

**Архетипы (`AiProfile.behavior`):**

| Архетип | Тактика | Кто использует |
|---|---|---|
| `chaser` | Сближается по пути и стреляет в `fireRange` при LOS | rust_grunt, scrap_hound, ash_crawler |
| `kiter` | Держит дистанцию ~`fireRange × 0.75`; ближе `0.55×` — отходит; стреляет при LOS | glass_wisp, rust_sniper, crystal_sentinel |
| `kamikaze` | Разгон `speed × chargeSpeedMult`; на `explodeTrigger` px — `ExplosionEffect(explodeRadius, explodeDamage)` и гибель (без attacker → опыт не начисляется) | ice_shard, cinder_mite |
| `timid` | Как kiter, но при HP < `fleeBelow × maxHP` → `flee` | glass_shard |

Константы: `MEMORY_FRAMES = 180`, `SEARCH_FRAMES = 240`,
`DAMAGE_MEMORY_FRAMES = 300`.

### WormController (голова червя)

Вне аггро (600 px) — патруль (плавный поворот курса); внутри — курс на цель с
поперечной волной (`waveAmplitude 0.5`, `waveFrequency 0.05` рад/кадр), залпы
из BossCannon в `fireRange 420` при LOS. FollowerController-сегменты держат
`followDistance 26` за предыдущим звеном; смерть головы убивает тело.

### WormPlayerController (танковая схема)

Управление телом червя после перерождения: **W/S** — ход вдоль курса,
**A/D** — поворот (`TURN_RATE = 0.05` рад/кадр), **ЛКМ** — выстрел вдоль курса.

### SettlerController

Прогулки в небольшом радиусе вокруг дома (seed от координат), без боя.

### ChipUsage (общее для контроллеров игрока)

Shift → чип `dash` (если экипирован и готов); 1–5/Q → активные чипы.

---

## 10. Предметы: оружие, модификаторы, чипы

### Модель: оружие-оболочка + очередь модификаторов

- **Weapon** — «оболочка»: `fireRate`, `baseDamage`, `projectileId`, `shots`,
  `shotSpread`, `damageMultiplier`, `modifierSlotsCount = 4`, `cooldown`.
- `Weapon.fire(source, angle)`: `resolveShot()` прогоняет модификаторы слотов
  **по порядку**, накапливая **CastState** (`copies, spread, damageAdd,
  damageMult, pierce, wave, explodeOnHit, destruct, homing`), и эмитит `weaponFired`
  со списком **ProjectileSpec** (`projectileId, angle, damage, …`);
  EffectSystem создаёт из них снаряды.
- Копии распределяются веером: `copies = shots × state.copies`, углы
  `-spread/2 … +spread/2`.

### Оружие (у всех `modifierSlotsCount = 4`)

| Класс | id | fireRate (кадров) | baseDamage | projectileId | Особенность |
|---|---|---|---|---|---|
| PistolWeapon | `pistol` | 15 | 5 | bullet | стартовое оружие игрока |
| LaserGunWeapon | `laser_gun` | 30 | 25 | laser | луч (LaserBeam) |
| ShotgunWeapon | `shotgun` | 25 | 4 | bullet | 5 дробин, spread 0.8 |
| FlamethrowerWeapon | `flamethrower` | 20 | 3 | fire_zone | зона огня |
| RocketLauncherWeapon | `rocket_launcher` | 90 | 15 | rocket | детонация → взрыв |
| BossCannonWeapon | `boss_cannon` | 90 | 12 | bullet | корпусная пушка (оружие червя; встречается в бункере) |
| MinigunWeapon | `minigun` | 4 | 3 | bullet | шквальный темп, собственный разброс 0.12 |
| RailgunWeapon | `railgun` | 75 | 70 | laser | редкий тяжёлый луч |
| PlasmaRifleWeapon | `plasma_rifle` | 40 | 30 | plasma | медленный крупный шар (PlasmaBall) |

### Модификаторы (`items/modifiers/catalog.ts`)

| Класс | id | Эффект (в CastState) |
|---|---|---|
| DamagePlusModifier | `mod_damage_plus` | `damageAdd += 3` |
| DamageMultModifier | `mod_damage_mult` | `damageMult *= 2` |
| PierceModifier | `mod_pierce` | `pierce = true` (снаряд переживает попадание) |
| SinusoidalModifier | `mod_sinusoidal` | `wave { amplitude: 24, frequency: 0.15 }` |
| MulticastModifier(count, spread) | `mod_multicast` | `copies *= count; spread += spread` |
| ExplosiveEndModifier | `mod_explosive_end` | `explodeOnHit = true` (взрыв при попадании/гибели снаряда) |
| DestructModifier | `mod_destruct` | `destruct = true` (снаряд разрушает стены → пол) |
| HomingModifier | `mod_homing` | `homing = true` (снаряд доворачивает к ближайшей цели: радиус 460 px, доворот 0.1 рад/кадр) |
| SplitModifier | `mod_split` | `copies *= 3; spread += 1.4` (широкий веер) |

### Чипы (`items/chips/`)

| Чип | id | Кулдаун | Действие |
|---|---|---|---|
| DashChip | `dash` | 60 кадров | `speedMultiplier × 3` на короткую активную фазу; множитель снимается по таймеру и при снятии чипа (парные умножение/деление — накопления нет) |
| TeleportChip | `teleport` | 120 кадров | Мгновенный перенос к курсору |
| RebirthChip | `rebirth` | — | Пассивный: при смерти носителя управление переходит ближайшему живому **враждебному** телу (враг/босс) |
| HealChip | `heal` | 900 кадров | Мгновенно +300 HP |
| ShieldChip | `shield` | 1200 кадров | Неуязвимость на 240 кадров (парная установка/снятие флага, как у даша) |
| NovaChip | `nova` | 480 кадров | Круговой взрыв вокруг носителя (урон 40, радиус 140) через снаряд-спецификацию `explosion` |

### ITEM_DEFINITIONS

Реестр `id → { id, kind: 'weapon'|'modifier'|'chip', name, description,
factory() }` — источник для сохранений (id), журнала (`i:`-записи), лута и
торговли. **Инвариант (проверяется юнит-тестом):** каждый предмет реестра
достиим в обычной игре — стартовый `pistol` + пулы лута регионов покрывают
все id (см. таблицу регионов в §12).

### Достижимость предметов по регионам

| Предмет | Где найти |
|---|---|
| pistol | стартовое оружие |
| shotgun | руины, город, бункер, алтарь червя, пепельные пустоши |
| laser_gun | бункер, ледяные поля, стеклянная равнина |
| flamethrower, rocket_launcher, boss_cannon | бункер |
| minigun | бункер, кристальные залы |
| railgun | кристальные залы |
| plasma_rifle | кристальные залы, пепельные пустоши |
| mod_damage_plus | руины, город |
| mod_pierce | руины, алтарь червя, ледяные поля, пепельные пустоши |
| mod_sinusoidal | руины |
| mod_multicast, mod_explosive_end | бункер, стеклянная равнина |
| mod_damage_mult | ледяные поля, стеклянная равнина, кристальные залы |
| mod_destruct | бункер |
| mod_homing | бункер, кристальные залы |
| mod_split | стеклянная равнина, пепельные пустоши |
| dash | руины, город |
| teleport | ледяные поля, стеклянная равнина, кристальные залы |
| rebirth | алтарь червя |
| heal | руины, город |
| shield | бункер, пепельные пустоши |
| nova | алтарь червя, пепельные пустоши |

### Улучшения уровня (`content/upgrades.ts`)

При LEVEL UP предлагается случайные 3 из пула `LEVEL_UP_UPGRADES`:

| id | Эффект |
|---|---|
| `weapon_damage` | Урон оружия +15% (`damageMultiplier *= 1.15`) |
| `weapon_speed` | Перезарядка −10% (`fireRate × 0.9`, минимум 3) |
| `max_health` | Здоровье +50 |

---

## 11. Эффекты и снаряды

Базовый `Effect` (x, y, angle, source, damage, `team` источника):
`canHit(entity)` = не источник, жив, `targetable`, **чужая команда**
(урон по своим отсутствует; взрыв камикадзе не задевает других врагов).

| Эффект | Поведение |
|---|---|
| `BulletEffect` | Прямолинейный снаряд; урон при пересечении; гибнет о стены/по времени; `homing` — доворот курса к ближайшей цели |
| `PlasmaBall` | Наследник пули: медленный (3.5) крупный снаряд, время жизни 150 кадров, свечение; поддерживает те же флаги (pierce/wave/homing/взрыв) |
| `LaserBeam` | Неподвижный отрезок `duration` кадров; урон всем в полосе |
| `RocketEffect` | Летит, детонирует о стену/сущность/таймер; `onDeath` → EffectSystem создаёт взрыв |
| `FireZone` | Круг периодического урона (огнемёт) |
| `ExplosionEffect` | 12 кадров; на 6-м кадре урон в радиусе; радиус настраивается (дефолт 40); применяют ракеты, ExplosiveEnd, камикадзе, чип Nova (спецификация `explosion` с `radius`) |

---

## 12. Мир: регионы, генерация, структуры

### Параметры мира

- Чанк 16×16 тайлов, тайл 32 px → чанк = 512×512 px; мировые px = чанки × 512.
- Координаты регионов — в чанках **относительно чанка спавна**; раскладка
  фиксирована и одинакова во всех забегах.
- Вне прямоугольников регионов — fallback `ruins` (бесконечные руины).
- Seed забега детерминирует дома, лут и расстановку NPC; генерация рельефа
  детерминирована координатами чанка.

### REGION_DEFINITIONS — полная таблица

| id | Название | Rect (чанки x,y,w,h) | Генератор | Безопасен | Спавны (веса) | Босс | Пул лута | Тайник/чанк | Особенность |
|---|---|---|---|---|---|---|---|---|---|
| `void_core` | Пустота | `{-8,-8,16,16}` (центр) | void | ✅ | — | — | — | — | Точка спавна игрока |
| `city` | Город | `{-20,-70,40,40}` | city | ✅ | — | — | Shotgun, DamagePlus, Dash, Heal | 0.05 | Здания-ячейки, жители, торговцы, медики |
| `bunker` | Бункер | `{80,-70,40,40}` | bunker | — | rust_grunt (4), rust_sniper (2) | — | LaserGun, Multicast(2,0.3), ExplosiveEnd, Shotgun, Flamethrower, RocketLauncher, BossCannon, Destruct, Minigun, Homing, Shield | 0.12 | Комнаты/коридоры, самый богатый лут |
| `crystal_halls` | Кристальные залы | `{80,30,40,40}` | crystal | — | crystal_sentinel (3), glass_wisp (1) | `crystal_serpent` | Railgun, PlasmaRifle, Minigun, Homing, DamageMult, Teleport | 0.12 | Комнаты кристалла, арена змея в центре |
| `worm_altar` | Алтарь червя | `{-106,-56,12,12}` | altar | — | rust_grunt (2) | `rust_worm` | Pierce, Shotgun, Rebirth, Nova | 0.10 | Алтарь в центре региона, костры 0.06 |
| `iced_fields` | Ледяные поля | `{-230,-30,60,60}` | iced | — | ice_shard (3) | — | LaserGun, Pierce, Teleport, DamageMult | 0.08 | Открытое поле, обломки |
| `glass_plain` | Стеклянная равнина | `{170,-30,60,60}` | glass | — | glass_shard (3), glass_wisp (2) | `glass_warden` | LaserGun, Multicast(2,0.3), ExplosiveEnd, Teleport, DamageMult, Split | 0.08 | Дюны, алтарь стража в центре |
| `ash_wastes` | Пепельные пустоши | `{-230,30,60,60}` | ash | — | ash_crawler (3), cinder_mite (2), scrap_hound (1) | `scrap_tyrant` | PlasmaRifle, Split, Shield, Nova, Shotgun, Pierce | 0.08 | Поле золы, алтарь тирана в центре |
| `ruins` | Ржавые пустоши | `null` (fallback) | ruins | — | rust_grunt (3), scrap_hound (2), rust_worm (0) | `rust_worm` | Shotgun, DamagePlus, Pierce, Dash, Sinusoidal, Heal | 0.12 | PNG-тайлы (`imageTiles`), `ruinsDensity 1`, дома |

«Тайник/чанк» — `lootChance`: вероятность наземного тайника с предметом из
пула региона на загруженный чанк. Инвариант фиксирует юнит-тест: у каждого
региона с непустым пулом лута шанс больше нуля. Дополнительные поля диких
регионов: `campfireChance` (костры: руины/пепел 0.05, поля 0.04, алтарь червя
0.06) и `scavengerChance` (мусорщики: руины/пепел 0.07, поля 0.06).

Каждый регион имеет `name` и `description` (лор — текст записи журнала в
категории «Регионы»). `REGION_ORDER = [void_core, city, bunker, crystal_halls,
worm_altar, iced_fields, glass_plain, ash_wastes, ruins]` (конкретные
прямоугольники раньше fallback; непересечение прямоугольников проверяет
юнит-тест).

### Схема раскладки (координаты чанков)

```
  СЕВЕР (y < 0)                                x
            iced_fields            city           worm_altar        bunker
           x=-230…-170          x=-20…20        x=-106…-95        x=80…120
              y=-30…30           y=-70…-30       y=-56…-45        y=-70…-30
               ┌──────┐            ┌──────┐        ┌───┐           ┌──────┐
               │ 60×60│            │ 40×40│        │12²│           │ 40×40│
               └──────┘            └──────┘        └───┘           └──────┘
    ◄── 200 чанков ──►    void_core (СПАВН)    ◄─ 50 ─►   ◄── 100 чанков ──►
                          x=-8…8, y=-8…8
               ┌──────┐         (0,0)
               │ 60×60│  glass_plain
               └──────┘  x=170…230, y=-30…30
  ЮГ (y ≥ 30)
               ┌──────┐                                        ┌──────┐
               │ 60×60│  ash_wastes              crystal_halls │ 40×40│
               └──────┘  x=-230…-170, y=30…90    x=80…120      └──────┘
                                                 y=30…70
```

Южные регионы зеркальны северным: пепельные пустоши под ледяными полями,
кристальные залы под бункером (между ними и бункером — полоса руин).

### Генераторы чанков (`map/generation/`)

Регистрируются в `GeneratorRegistry` (@firec/map-module); каждый обслуживает
свой регион (`ChunkGenerator.canGenerate/getPriority`).

| Генератор | Регион | Описание |
|---|---|---|
| `VoidGenerator` | void_core | Ровный тёмный пол безопасной пустоты |
| `RuinsGenerator` | ruins | Процедурные руины (плотность `ruinsDensity`); PNG-тайлы из `images/` (floor_0..6, walls, trash_0..2); штамповка домов |
| `CityGenerator` | city | Сетка ячеек `CELL_TILES = 64` (4×4 чанка): здания с дверями (`DOOR_WIDTH = 4`), дороги |
| `BunkerGenerator` | bunker | Сетка комнат `ROOM_TILES = 32`, коридоры, двери 4, внешние ворота (`GATE_HALF = 4`); прямоугольник берётся из региона тайла — базовый класс для «комнатных» регионов |
| `CrystalHallsGenerator` | crystal_halls | Наследник бункера: та же сетка комнат + открытая арена с кольцом-подиумом в центре (алтарь Кристального змея) |
| `IcedFieldsGenerator` | iced_fields | Открытое поле: ровный пол + детерминированные скопления обломков (базовый класс для открытых полей) |
| `GlassPlainGenerator` | glass_plain | Стеклянные дюны + алтарная платформа стража в центре |
| `AltarRegionGenerator` | worm_altar | Ровная площадка + кольцо-подиум в центре |
| `AshWastesGenerator` | ash_wastes | Поле золы (густые скопления обломков 1–5 на чанк) + платформа алтаря Скрепного тирана в центре |
| `structures.ts` | — | Общие штампы: кольцо алтарной платформы (Chebyshev) и пр. |

### Палитры и тайлы (`content/regions/palette.ts`)

`regionFloorCanvas(region)` / `regionWallCanvas(region)` — процедурные
тайл-спрайты 32×32 из `RegionPalette { floor[], wall, wallDark, fog }`
(`fog` — цвет метки региона в HUD). Регионы с `imageTiles` (ruins) вместо
палитры используют PNG из `images/`.

### Дома руин (`map/structures/houses.ts`)

«Восстановленные дома» — безопасные структуры с торговцами и поселенцами.

| Константа | Значение | Смысл |
|---|---|---|
| `BLOCK_CHUNKS` | 8 | Блок размещения = 8×8 чанков = 128×128 тайлов |
| `HOUSE_W × HOUSE_H` | 12 × 10 | Размер дома в тайлах |
| `HOUSE_CHANCE` | 0.45 | Шанс дома на блок (детерминированно от seed) |
| Отступ | 8…(128−размер−8) | Положение дома в блоке |

API: `houseOfBlock(bx, by, runSeed)`, `housesForChunk(chunkX, chunkY, runSeed)`
(дома, пересекающие чанк, включая соседние блоки), `houseWallAt(house, gx, gy)`
(контур — стена; **дверь** — 2 тайла в центре южной стены),
`houseInterior(house)` (внутренность с отступом 1 тайл).

### RegionFeatureSystem — фичи по загрузке чанков

| Фича | Правило |
|---|---|
| Дома (ruins) | Каждый дом регистрируется один раз: 1–2 поселенца (±96/±64 px от центра), торговец с шансом **60%**, медик с шансом **35%**; безопасная зона `HOUSE_SAFE_RADIUS = 256` |
| Ячейки города | Якорный чанк (1,1) каждой сетки 4×4: здание с шансом **55%**, 1–2 жителя (±256 px), торговец с шансом **50%**, медик с шансом **25%** |
| Алтари | В центральном чанке алтарного региона, один на регион; `Altar(bossDefId)` + катсцена призыва |
| Тайники лута | Во всех несейфовых регионах с непустым пулом и `lootChance` (0.05–0.12 на чанк): пикап случайного предмета из пула региона в проходимой точке чанка (до 10 попыток) |
| Торговцы | `Trader` с 3 предложениями из `region.loot`; открытие окна → `n:trader` в журнал |
| Медики | `Medic` в домах и городе: полное лечение по E, перезарядка 900 кадров; встреча/лечение → `n:medic` в журнал |
| Мусорщики | Бродячий NPC (`scavenger`, ai settler) в диких регионах с `scavengerChance`; journal-запись открывается сканом встреч |
| Костры | `Campfire` в диких регионах с `campfireChance`: лечит команду player на 1 HP/30 кадров в радиусе 130 px |
| Регион в журнале | Смена региона управляемой сущностью → `unlockRegion` + объявление названия (FloatingText + метка HUD) |
| Скан встреч | Раз в 30 кадров: сущности с `definition.journal` (и медики) в радиусе 900 px от игрока открывают свою запись журнала (так открываются поселенцы и мусорщики — они спавнятся вместе с чанком, часто дальше 900 px от игрока) |
| debugStats | `{ chunks, houses, traders, settlers, altars, loot, medics, scavengers, campfires }` → `__debug.zoneStats()` |

---

## 13. UI: canvas-фреймворк и окна

### Фреймворк (`ui/`)

- **Component** — база: позиция/размер, `getText()`, `getGlobalPosition()`, render.
- **Container** (+ `AbsoluteContainer`, `VerticalLayout`, `HorizontalLayout`).
- **Компоненты**: `Button` (текст/hover/click), `Label`, `ItemSlot` (слот
  предмета с тултипом), `Tooltip`, `Crosshair`.
- **Window** — корневой контейнер с фоном/заголовком (`title`), `autoSize()`,
  `centerWindow()`, флаг **`causesPause`** (модальность), `update(mouse)`,
  `render(ctx)`.
- **ScreenManager** — стек окон + HUD: `pushWindow/popWindow/openWindow/
  closeWindow/getWindows/getTopWindow`, `isGamePaused()` (у любого окна
  `causesPause`); ввод мыши получает **только верхнее окно** (перекрытые
  окна обновляются с «мёртвой» мышью и не ловят клики сквозь стек); рендер:
  затемнение `#0008` под стеком, окна снизу вверх, подсказка при наведении.

### Окна (13)

| Окно | causesPause | Содержание |
|---|---|---|
| `MainMenuWindow` | ✅ | «РУИНЫ ПУСТОТЫ»: Новый забег / Продолжить… / Журнал / Статистика / Настройки |
| `SlotPickerWindow` | ✅ | 3 слота (дата, уровень, время); режимы «загрузка» (из меню) и «запись» (из паузы) |
| `PauseWindow` | ✅ | Продолжить / Сохранить… / Журнал / Статистика / Настройки / Выйти в меню |
| `JournalWindow` («Журнал смотрителя») | ✅ | Вкладки: Враги / Боссы / NPC / Предметы / **Регионы**; неоткрытые записи — «???»; бейдж «• новое» у непрочитанных (снимается выбором записи); лор-описания |
| `StatsWindow` | ✅ | Статистика забега + мета (тики → мм:сс) |
| `SettingsWindow` | ✅ | Ремап клавиш, мин. зум, дальность рендера, тумблеры HUD, debug-оверлей |
| `RunResultsWindow` («Забег завершён») | ✅ | Показатели забега; Новый забег / В главное меню |
| `TradeWindow` | ✅ | Бартер 1:1 без валюты: прилавок (3 предложения) → выбор → ряд предметов игрока **того же типа** → обмен слотами; эмитит `barterCompleted { offerId, playerId }`; закрывается кнопкой «Закрыть» |
| `CutsceneWindow` | ✅ | Реплики катсцен (призыв босса и пр.), далее — клик/E |
| `LevelUpWindow` | ✅ | Выбор 1 из 3 улучшений уровня |
| `InventoryWindow` | — | Tab: оружие/модификаторы/чипы, 3 колонки, интерактивные слоты (перестановка, снятие) |
| `PickupWindow` | ✅ | Выбор слота для подбираемого предмета |
| `HudScreen` | — | Полоса опыта сверху; HP + чипы справа внизу; оружие + модификаторы слева внизу; метка региона; подсказка `[E] <label>`; прицел; debug-оверлей (FPS/чанки) |

---

## 14. Оболочка: меню, сейвы, журнал, статистика, настройки

### Поток игры

```
[без параметров] → ГЛАВНОЕ МЕНЮ (attract-камера: круг R=6200 px, 0.0016 рад/тик;
                   симуляция стоит, мир грузится вокруг камеры)
   ├─ «Новый забег»   → ?run=new   → новый seed, спавн в Ядре Пустоты
   ├─ «Продолжить…»   → SlotPickerWindow → ?slot=N → мир из seed сейва
   └─ «Журнал» / «Статистика» / «Настройки» → окна поверх меню
[в забеге]
   ├─ Esc → PauseWindow (пауза симуляции)
   │     ├─ «Сохранить…» → SlotPickerWindow (запись в слот 1..3)
   │     └─ «Выйти в меню» → меню
   └─ смерть без чипа Rebirth → flow 'ended' → RunResultsWindow
         ├─ «Новый забег» → ?run=new
         └─ «В главное меню» → меню (мета сохранена)
```

### Журнал (категории и id)

| Категория | Префикс id | Источники записей |
|---|---|---|
| Враги | `e:` | `ENTITY_DEFINITIONS` с `journal: 'enemy'` |
| Боссы | `e:` | `ENTITY_DEFINITIONS` с `journal: 'boss'` |
| NPC | `n:` | `journal: 'npc'` (поселенец, мусорщик) + статические записи `n:trader`, `n:medic` |
| Предметы | `i:` | `ITEM_DEFINITIONS` |
| Регионы | `r:` | `REGION_DEFINITIONS` (порядок `REGION_ORDER`) |

Непрочитанные записи хранятся в `journalNew` (мета) и помечаются бейджем
«• новое» до первого открытия в окне журнала.

### Мета-прогресс (`jsrl.meta.v1`)

`journal[]`, `journalNew[]`, `stats { runs, runsEnded, totalKills,
totalDeaths, bestRunTicks, totalTrades, totalPickups, bossesKilled }`.

### Сохранения

См. `SaveData` в §6. Сохраняются: позиция/HP/уровень/опыт, инвентарь (id),
статистика забега, seed мира. Загрузка воссоздаёт мир из seed.

---

## 15. События (EventBus)

Типизированная шина: `on(name, listener): Unsubscribe`, `emit(name, data)`.

| Событие | Payload | Эмитент | Подписчики |
|---|---|---|---|
| `entityKilled` | `{ killer, victim }` | `Entity.takeDamage` (только при attacker) | ProgressionSystem, JournalService, StatsService |
| `entityDied` | `{ entity }` | `Entity.takeDamage` (всегда при смерти) | RebirthSystem |
| `weaponFired` | `{ source, specs: ProjectileSpec[] }` | `Weapon.fire` | EffectSystem |
| `cutsceneStart` | `{ lines: string[] }` | Altar | CutsceneSystem |
| `itemPicked` | `{ item, by }` | PickupSystem | JournalService, StatsService |
| `barterCompleted` | `{ offerId, playerId }` | TradeWindow (offerId — отданный торговцу, playerId — полученный) | JournalService, StatsService |

---

## 16. Фракции и боевая модель

- `Team = 'player' | 'enemy' | 'neutral'`; `areHostile(a, b) = a !== b`.
- `neutral` (манекены) — валидная цель для всех, сами не воюют.
- `Effect.canHit`: цель жива, `targetable`, чужая команда, не источник —
  урон по союзникам невозможен (в т.ч. взрыв камикадзе не задевает врагов).
- `Entity.takeDamage(damage, attacker?)` → при смерти `entityKilled` (если
  attacker) + `entityDied`; фиксирует `lastAttacker` (аггро FSM по урону).
- Флаги: `invulnerable` (debug), `persistent` (не удаляется Cleanup).

---

## 17. Прогрессия и уровни

- Опыт за убийство (только если убийца — управляемая сущность):
  rust_grunt 5, glass_wisp 4, glass_shard 6, ice_shard 6, scrap_hound 4,
  ash_crawler 7, cinder_mite 3, rust_sniper 8, crystal_sentinel 8;
  боссы: rust_worm 120, glass_warden 100, crystal_serpent 130,
  scrap_tyrant 150.
- Порог уровня: `experienceToNext = level × 100`.
- LEVEL UP → `LevelUpWindow` (пауза) → 1 из 3 случайных улучшений (§10).
- Уровень/опыт сохраняются в слот и восстанавливаются при загрузке.

---

## 18. Ввод и управление

### InputAction и дефолтные биндинги

| Действие | Клавиши по умолчанию |
|---|---|
| MoveUp / Down / Left / Right | W/S/A/D + стрелки |
| Dash | ShiftLeft / ShiftRight (нужен чип `dash`) |
| Chip1…Chip5 | 1…5 (Chip1 дублирует Q) |
| Interact | E (подбор, торговля, алтарь, реплики катсцен) |
| Inventory | Tab |
| Fullscreen | F12 |

- `InputMapper.rebind(action, keys)` / `getBindings()`; переопределения
  хранятся в `settings.bindings`, применяются при старте; SettingsWindow
  даёт UI ремапа («нажмите клавишу»).
- Мышь: ЛКМ — выстрел (в top-down — к курсору с учётом зума и камеры; в
  танковой схеме — вдоль корпуса), колесо — зум.

### Схемы управления телами (`controlScheme`)

| Схема | Тела | Управление |
|---|---|---|
| `topdown` (дефолт) | Игрок | WASD — движение, ЛКМ — выстрел к курсору |
| `tank` | rust_worm, glass_warden (после перерождения) | W/S — ход вдоль курса, A/D — поворот (0.05 рад/кадр), ЛКМ — выстрел вдоль курса |

---

## 19. Отладка: __debug-хуки и playground

### `window.__debug` (все режимы)

| Хук | Назначение |
|---|---|
| `getControlled()` | Текущая управляемая сущность |
| `entityWorld` | Контейнер сущностей (`.all`) |
| `entityFactory` | Конвейер (`spawn(defId,x,y)`, `spawnBoss(...)`) |
| `regionMap` | `regionAtWorld/regionAtChunk` |
| `screenManager` | Стек окон (`getWindows()`, `isGamePaused()`) |
| `worldService` | Фасад мира (тайлы, LOS) |
| `housesAt(cx, cy)` | Дома, пересекающие чанк |
| `zoneStats()` | `{ chunks, houses, traders, settlers, altars, loot, medics, scavengers, campfires }` |
| `journalUnlocked()` | Открытые id журнала |
| `giveChip('dash')` / `giveItem('damage_plus'\|'pierce')` | Выдача тестовых предметов |
| `setInvulnerable(bool)` | Неуязвимость управляемого (debug-сцена) |
| `forceDeath()` | Мгновенная смерть (debug-сцена; игнорируется при invulnerable) |

### Playground (`?playground`)

Отладочный полигон рядом со спавном: пикапы всех 9 оружий (x=800), всех 9
модификаторов (x=600), чипов Teleport/Dash/Heal/Shield/Nova (x=700),
тренировочные манекены; мобы всех архетипов (rust_grunt ×2, scrap_hound,
crystal_sentinel, cinder_mite в отдалении), мусорщик, медик, костёр и три
алтаря (rust_worm, scrap_tyrant, crystal_serpent); игроку выдаются
Teleport/Dash/Rebirth-чипы. При загрузке играет вступительная катсцена
(закрывается клавишей E).

---

## 20. Тестирование

### Юнит-тесты (`npm test`, vitest)

Окружение node + in-memory-заглушка localStorage (`tests/setup.ts`).
8 файлов / 31 тест:

| Файл | Покрытие |
|---|---|
| `tests/metaStorage.test.ts` | Дефолты, round-trip, устойчивость к битому JSON |
| `tests/journal.test.ts` | unlock/isNew, markRead, префиксы `e:`/`i:`, персистентность между экземплярами |
| `tests/settings.test.ts` | Дефолты, сохранение, частичное слияние |
| `tests/stats.test.ts` | Счётчики забега по событиям (только свои убийства), боссы/пикапы/трейды, однократный `endRun` |
| `tests/regionMap.test.ts` | Все регионы раскладки (включая южные), ruins-fallback, world↔chunk согласованность |
| `tests/houses.test.ts` | Детерминизм от seed, наличие домов, интерьер/стены/дверь |
| `tests/inputMapper.test.ts` | Дефолты, rebind, изоляция экземпляров |
| `tests/content.test.ts` | **Достижимость каждого предмета** через стартовый набор + лут-пулы регионов; валидность ссылок лута на реестр; `lootChance > 0` у регионов с пулом; **каждый враг встречается в спавн-таблице**; **каждый босс доступен** (алтарь региона или спавн); непересечение прямоугольников регионов; описания у всех регионов и журнальных сущностей |

### E2E-смоук (puppeteer, 8 сценариев)

Прогоняется против статик-сервера с игрой. Сценарии стартуют с фиксированным
seed (`?…&seed=777001`) — раскладка мира детерминирована. В конце каждого
сценария — скриншоты; итог `SMOKE: OK/FAIL`.

| Сценарий | URL | Проверяет |
|---|---|---|
| `game` | `?run=new` | движение, базовый геймплей |
| `playground` | `?playground` | подбор оружия, Tab-инвентарь, стрельба, мир не статичен |
| `altar` | `?playground` | призыв босса у алтаря (катсцена не перехватывает E), босс активен |
| `fixes` | `?playground` | скорость 3 → даш → 3 (без остаточного ускорения); перерождение во врага |
| `worm` | `?playground` | танковая схема червя: поворот, ход, перемещение |
| `zones` | `?playground` | регион спавна; руины: имя региона и спавны; облёт: zoneStats; дом: поселенцы и отсутствие «живущих» врагов; бартер 1:1 (+ журнал обеих сторон); город: жители без врагов; алтарь червя; **бункер/кристальные залы: наземные тайники лута ≥1**; **алтари змея и тирана**; спавны пепла из таблицы; журнал: все посещённые регионы, `n:settler`, `n:scavenger`, `n:medic` |
| `ai` | `?playground` | FSM: idle→chase, поводок→return→idle с полным HP; камикадзе взрывается; timid убегает <40% HP; kiter держит дистанцию; фазы босса 0/1/2 (shots 1/3/8, цвет) |
| `shell` | (меню) | меню→забег; клик не проходит сквозь журнал к меню; бейдж «• новое» снимается при прочтении; пауза→сейв в слот 1→загрузка `?slot=1` (позиция/оружие/моды); журнал открывает врага по встрече и по убийству дальнего врага; смерть→итоги→меню |

---

## 21. Репозиторий и артефакты

- Ветка разработки: `master`. История линейная, включает как оригинальную
  историю проекта, так и полный инкрементальный рефакторинг
  (от `64fc91f` до текущего HEAD): ядро и цикл → геймплей и фракции → UI и
  прогрессия → очередь заклинаний → конвейер сущностей и боссы → ревизия
  модификаторов → танковая схема червя → регионы и бартер → мир регионов с
  генераторами → оболочка (меню/сейвы/журнал/настройки) → FSM-враги и фазы
  боссов → юнит-тесты → исправления по отзывам и журнал регионов → лут-тайники
  во всех регионах и seed забега из URL → контент-пак: кристальные залы и
  пепельные пустоши, два босса, пять врагов, мусорщик/медик/костры, три оружия,
  два модификатора и три чипа.
- Сборка: `npm run build` → `build/index.js` (+ `index.html`, `images/`).
- Дистрибутив истории: git-bundle `js-rogue-like-refactor.bundle` (ветка
  master целиком) — позволяет развернуть репозиторий без доступа к удалённому
  origin:
  ```bash
  git init -b master && git fetch <path>/js-rogue-like-refactor.bundle master
  git reset --mixed FETCH_HEAD
  ```
- Смоук-стенд: отдельная папка с puppeteer-окружением (`smoke.js` +
  probe-скрипты для локализации сбоев); запускается против любого
  статик-сервера со сборкой.

---

## 22. Не реализовано / точки расширения

| Пункт | Статус / как расширять |
|---|---|
| Текстуры регионов | PNG-тайлы есть только у ruins (`images/`); остальные регионы рисуют процедурные палитры. Замена: положить спрайты и выставить `imageTiles` + загрузку в `palette.ts` |
| Дипломатия фракций | Модель простая: `areHostile(a,b) = a !== b`. Расширение — матрица отношений в `types/Team.ts` + учёт в `Effect.canHit` и аггро FSM |
| Урон по своим | Отсутствует по дизайну (canHit по командам) |
| Опыт с камикадзе | Самоподрыв идёт без attacker → `entityKilled` не эмитится → опыт не начисляется (осознанное поведение) |
| Аудио | Нет |
| Мобильное управление | Нет (клавиатура + мышь) |
| Новые враги/боссы | Запись в `ENTITY_DEFINITIONS` (+ при необходимости контроллер и `AiKind`); боссы — `BossSpec` (сегменты) или `AiProfile.phases` (турель) |
| Новые предметы | Класс в `items/` + запись в `ITEM_DEFINITIONS` + добавление в лут-пулы регионов (тест `content.test.ts` проследит достижимость) |
| Новые регионы | Запись в `REGION_DEFINITIONS` (+ генератор в `map/generation/` при необходимости), порядок в `REGION_ORDER` |

---

*При изменении контентных таблиц обновляйте соответствующие разделы
(§8, §10, §12) и проверяйте `npm test` — тест `content.test.ts` фиксирует
инвариант достижимости предметов.*
