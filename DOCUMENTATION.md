# Техническая документация — js-rogue-like (рефакторинг)

> Полное описание архитектуры, кода, контентных таблиц и инструментария
> по состоянию на коммит `91f5c68` (этап 11). Дата: 2026-11-02.
>
> Оригинальный проект: [github.com/FirecYT/js-rogue-like](https://github.com/FirecYT/js-rogue-like).
> Рефакторинг выполнен инкрементально (этапы 0–11), игра играбельна на каждом этапе.
> Лор и дизайн-видение — в `DESIGN.md`.

---

## Оглавление

1. [Обзор и статус проекта](#1-обзор-и-статус-проекта)
2. [Стек, сборка, запуск](#2-стек-сборка-запуск)
3. [Архитектура: слои и поток данных](#3-архитектура-слои-и-поток-данных)
4. [Ядро (core)](#4-ядро-core)
5. [Системы (systems)](#5-системы-systems)
6. [Сервисы (services)](#6-сервисы-services)
7. [Сущности и компоненты](#7-сущности-и-компоненты)
8. [Конвейер сущностей (declarative pipeline)](#8-конвейер-сущностей-declarative-pipeline)
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
20. [Тесты: puppeteer-смоук и vitest](#20-тесты-puppeteer-смоук-и-vitest)
21. [Git: история, артефакты, восстановление](#21-git-история-артефакты-восстановление)
22. [Известные ограничения и отложенное](#22-известные-ограничения-и-отложенное)

---

## 1. Обзор и статус проекта

**Что это:** 2D top-down rogue-like на чистом TypeScript + Canvas 2D, без
игрового движка. Мир — бесконечные чанки (`@firec/map-module`), собранные из
**регионов**: каждый регион — прямоугольник чанков со своим генератором,
палитрой, таблицей спавна и лутом (модель как в Noita).

**Масштаб кода:** 121 TypeScript-файл, ~12 700 строк в `src/`, плюс 7 файлов
юнит-тестов (22 теста) и puppeteer-смоук из 8 end-to-end сценариев.

**Ключевые свойства реализации:**

| Свойство | Значение |
|---|---|
| Частота симуляции | Фиксированные 60 Гц (аккумулятор, догон максимум 250 мс) |
| Рендер | Canvas 2D, каждый кадр (rAF), UI — тоже canvas (без DOM-элементов поверх) |
| Мир | Чанки 16×16 тайлов, тайл 32 px (чанк = 512 px) |
| Контент | Декларативные реестры: сущности, предметы, регионы — новые без новых классов |
| Персистентность | localStorage: 3 слота сохранений + мета (журнал/статистика) + настройки |
| Оболочка | Главное меню с attract-камерой, пауза, итоги забега, журнал, настройки |
| Тесты | `npm test` (vitest run) + смоук `node smoke.js` (puppeteer) |

**Этапы рефакторинга (все завершены):**

| Этап | Коммит | Содержание |
|---|---|---|
| 0 | `64fc91f` | Санитарная чистка наследия |
| 1 | `d63a46e` | Ядро: владение сущностями, фиксированный тик, честные подписки |
| 2 | `858edb5` | Геймплей: фракции, честное прицеливание, доменный инвентарь, ракета |
| 3 | `4d73228` | UI без dual-state, рабочая прогрессия + DESIGN.md (`c7459d5`) |
| 4 | `4689f1b` | Очередь заклинаний в духе Noita: оружие-оболочка + модификаторы |
| 5 | `e3cca11` | Конвейер сущностей, босс-эталон «Ржавый червь», алтари призыва |
| 6 | `e47ef78` | Ревизия модификаторов + пакет исправлений по отзыву |
| 6.1 | `664b1eb` | Танковое управление червём, разрушенные стены → пол |
| 7 | `0d7beaa` | Зоны/биомы + бартер 1:1 без валюты (+хотфикс `b98472c`) |
| 8 | `927e41c` | Мир регионов на генераторах (Noita-like), дома, город, бункер, поля |
| 9 | `5569a95` | Оболочка: меню, пауза, сейвы, журнал, статистика, настройки, итоги (+хотфикс `064154a`) |
| 10 | `efa173d` | Жизнь вражеского AI: FSM, архетипы, фазы боссов |
| 11 | `91f5c68` | Юнит-тесты vitest |

---

## 2. Стек, сборка, запуск

### Зависимости

| Пакет | Роль |
|---|---|
| `typescript` ^5.5 (strict) | Язык; компиляция через `ts-loader` |
| `webpack` 5 + `webpack-cli` | Сборка в `build/index.js` |
| `eslint` 9 + `eslint-webpack-plugin` | Линт (flat config) прямо в сборке |
| `prettier` | Форматирование (табы) |
| `vitest` ^4 (dev) | Юнит-тесты (`npm test`) |
| `@firec/map-module` (github:FirecYT/map-module) | Тайловый мир: `World`, `ChunkGenerator`, `GeneratorRegistry`, `SeededRandom`, `CanvasChunkRenderer`, `ChunkViewManager` |

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
| `index.html` (без параметров) | Главное меню, attract-камера кружит над миром, симуляция стоит |
| `index.html?run=new` | Сразу новый забег (seed случайный) |
| `index.html?slot=N` (1..3) | Продолжить забег из слота N |
| `index.html?playground` | Отладочный полигон: весь контент, манекены, `__debug`-хуки |

`__debug`-хуки доступны **во всех режимах** (не только playground).

### localStorage-ключи

| Ключ | Содержимое |
|---|---|
| `jsrl.save.1` … `jsrl.save.3` | Снимки забегов (формат `SaveData`, см. §14) |
| `jsrl.meta.v1` | Мета между забегами: журнал, метки «Новое», суммарная статистика |
| `jsrl.settings.v1` | Настройки: бинды, зум, радиус рендера, HUD, debug-оверлей |

---

## 3. Архитектура: слои и поток данных

```
src/
├── index.ts                 # бутстрап: parseBootOptions → GameFactory.create → start
├── Player.ts                # класс игрока
├── core/                    # ядро: Game (цикл), GameFactory (composition root),
│                            # GameContext, EntityWorld, GameFlow, BootOptions, interfaces
├── systems/                 # 14 систем: поведение каждого кадра (фазы UpdatePhase)
├── services/                # 11 сервисов: WorldService, Pathfinder, RegionMap,
│                            # EntityFactory, Journal/Stats/Settings/Meta/Save,
│                            # ControlSwitch, SystemManager
├── controllers/             # ИИ и управление: FSM-враги, червь, турель, поселенец,
│                            # сегмент, игрок (top-down и танковая схемы), чипы
├── entities/                # Entity (база), DeclarativeEntity (конвейер), Trader,
│                            # Altar, пикапы, TrainingDummy
├── components/              # GameObject, Inventory, Camera, Engine, Keyboard,
│                            # MouseInput, Cooldown, FloatingText
├── items/                   # Item/Weapon/Chip/Modifier + CastState + каталоги
├── effects/                 # Снаряды и зоны: Bullet, Laser, Rocket, FireZone, Explosion
├── content/                 # КОНТЕНТНЫЕ РЕЕСТРЫ (данные, не классы):
│   ├── entities/definitions.ts   # ENTITY_DEFINITIONS + AiProfile/AiPhase
│   ├── items/definitions.ts      # ITEM_DEFINITIONS (id → фабрика)
│   ├── regions/definitions.ts    # REGION_DEFINITIONS + REGION_ORDER
│   ├── regions/palette.ts        # процедурные спрайты пола/стен региона
│   └── upgrades.ts               # пул улучшений уровня
├── map/                     # генераторы чанков регионов + дома руин
├── ui/                      # canvas-UI-фреймворк: Component/Container/Window,
│                            # ScreenManager, 13 окон, HUD, компоненты
├── input/                   # InputAction (enum), InputMapper (ремап)
├── events/                  # EventBus (типизированная шина)
├── types/                   # Team, EntityTraits, Interactable
├── debug/playground.ts      # наполнение отладочной сцены
└── utils.ts
```

**Поток данных за тик (60 Гц):**

```
Game.update()
 ├─ flow.state === 'menu'?  → attract-камера, worldService, screenManager, return
 ├─ camera.update() + follow(controlled)
 ├─ worldService.update(controlled.x, controlled.y)   # догрузка чанков вокруг игрока
 ├─ mouse.update() (+ зум колесом)
 ├─ screenManager.isGamePaused()
 │    ├─ да  → systemManager.updateWhilePaused()      # только окна с runsWhilePaused
 │    └─ нет → systemManager.update()                 # все системы по фазам
 ├─ screenManager.update()                            # мышь ТОЛЬКО верхнему окну
 └─ keyboard.update() + глобальные клавиши (Esc и т.д.)
Game.render()  → engine.context → camera → chunkView.render → системы (IRenderable)
                 → сущности → эффекты → screenManager.render (HUD + окна)
```

**Принципы, зафиксированные рефакторингом:**

- Системы не знают друг о друге — только `GameContext` и шина событий.
- Подписки на события возвращают `Unsubscribe`; системы обязаны отписываться в `dispose()`.
- Контент (враги, предметы, регионы, улучшения) — данные в реестрах; новые сущности
  добавляются записью в `ENTITY_DEFINITIONS` без новых классов.
- UI живёт на canvas (общий фреймворк Component/Container/Window), без DOM-оверлеев.
- Все кулдауны/таймеры — в кадрах фиксированного тика (60 Гц), не в миллисекундах.

---

## 4. Ядро (core)

### Game (`core/Game.ts`)

Игровой цикл: аккумулятор времени, `TICK_MS = 1000/60`, догон не более
`MAX_CATCHUP_MS = 250` за кадр (защита от «спирали смерти» на лагах).
`update()` — логика (см. поток выше), `render()` — отрисовка. В меню
(`flow.state === 'menu'`) симуляция не идёт: только attract-камера
(круг радиуса 6200 px, угол `menuTicks * 0.0016`), мир и UI.

Esc в игре: закрыть верхнее окно → иначе пауза (окно итогов не закрывается).

### GameFlow (`core/GameFlow.ts`)

`state: 'menu' | 'playing' | 'ended'` + `menuTicks`. Переходы:
меню → playing (новый забег/загрузка слота), playing → ended (смерть без
перерождения → окно итогов), ended → menu / playing (новый забег).

### BootOptions (`core/BootOptions.ts`)

`parseBootOptions()` читает URL: `{ mode: 'menu'|'play', playground: boolean, slot: number|null }`.
`navigateTo(query)` — переход по URL (меню → забег и обратно).

### GameFactory (`core/GameFactory.ts`) — composition root

`GameFactory.create(boot: BootOptions): Promise<GameContext+Game>`:
создаёт Engine/canvas, World (map-module) с генераторами регионов, камеру,
ввод, EntityWorld, все сервисы и системы, игрока (или загрузку из слота),
окна оболочки, подписки журнала на события, `__debug`-хуки. Возвращает `Game`.

Порядок сборки (ключевые шаги): WorldService → RegionMap → Pathfinder →
ControlSwitch → ScreenManager+HUD → EffectSystem → EntityFactory(…, effectSystem) →
системы по фазам → JournalService/StatsService + подписки событий → окна.

Подписки журнала (хотфикс этапа 9):
```ts
eventBus.on('itemPicked',     ({ item }) => journal.unlockItem(item.id));
eventBus.on('entityKilled',   ({ victim }) => journal.unlockEntity(victim.definition.id));
eventBus.on('barterCompleted',({ offerId, playerId }) => { unlockItem(offerId); unlockItem(playerId); });
```

### GameContext (`core/GameContext.ts`)

Неизменяемый «контейнер всего»: `engine, camera, mouse, input, entityWorld,
worldService, pathfinder, systemManager, screenManager, controlSwitch,
chunkView, entityFactory, regionMap, runSeed, flow, journal, stats,
createPauseWindow, createResultsWindow`.

### EntityWorld (`core/EntityWorld.ts`)

Владеет списком сущностей: `spawn(entity)`, `all: readonly Entity[]`.
Единственный источник правды о сущностях (системы итерируют `all`).

### SystemManager (`services/SystemManager.ts`)

Реестр систем: `register()` сортирует по `phase`, `update()` вызывает
включённые по порядку фаз, `updateWhilePaused()` — только `runsWhilePaused`
(оконный ввод), `render()` — для `IRenderable`, `dispose()` — отписка всех.

### UpdatePhase (`core/interfaces.ts`)

| Фаза | № | Системы |
|---|---|---|
| Input | 0 | — (ввод читается напрямую из Keyboard/MouseInput) |
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
| `MovementSystem` | Movement | Вызывает `controller.update(entity, world)` для всех управляемых, `inventory.update()`, `entity.update()` (кастомная логика, например респавн манекена) |
| `CollisionSystem` | Collision | Отталкивание solid-сущностей при пересечении хитбоксов (только сущность↔сущность; тайлы — в `WorldService.tryMove`) |
| `RebirthSystem` | Combat | Подписка на `entityDied`: если у умершего есть чип Rebirth — управление переходит **ближайшему живому врагу** (контроллер переставляется ControlSwitchService) |
| `EffectSystem` | Effects | Контейнер эффектов (снаряды/зоны/взрывы): `add(effect)`, обновление со списком сущностей, обработка `weaponFired` (создание снарядов из ProjectileSpec), `explodeOnHit`, детонация ракет (onDeath → ExplosionEffect) |
| `FloatingTextSystem` | Effects | Всплывающие тексты (урон, опыт, названия регионов): жизненный цикл + рендер |
| `PickupSystem` | Pickup | Подбор пикапов (оружие/модификатор/чип) клавишей E: при занятом слоте открывает PickupWindow; эмитит `itemPicked` |
| `InteractSystem` | Pickup | Ближайший `Interactable` в радиусе → подсказка `[E] <interactLabel>` в HUD; вызов `interact()` по E |
| `EnemySpawnerSystem` | Spawner | Периодический спавн мобов вокруг игрока: интервал **180 кадров**, кольцо **300–500 px**, 6 попыток; фильтры: `region.safe`, `isPassable`, безопасные зоны (+**240 px** дополнительного отступа для FSM-врагов, чтобы блуждание не заводило их в дома); выбор моба по весам таблицы региона |
| `RegionFeatureSystem` | Spawner | Структуры по событию загрузки чанка: дома руин (поселенцы + торговцы), ячейки города (здания/NPC/торговцы), алтари боссов в центрах алтарных регионов, тайники лута; ведёт безопасные зоны и `debugStats` |
| `CleanupSystem` | Cleanup | Удаляет мёртвых из EntityWorld; защищает управляемую сущность и `persistent` (манекен) |
| `ProgressionSystem` | UI | Подписка на `entityKilled`: опыт убийцы (если убийца — управляемый), всплывающий `+N`, LEVEL UP → LevelUpWindow |
| `CutsceneSystem` | UI | Подписка на `cutsceneStart`: открывает CutsceneWindow (пауза симуляции), выход по клику/E |
| `UISystem` | UI | Глобальные UI-действия: Tab (инвентарь), F12 (fullscreen) |
| `PlayerProgression` | — | Не система: данные уровня (`level`, `experience`, `experienceToNext = level × 100`, `progress`) |

---

## 6. Сервисы (services)

### WorldService — фасад тайлового мира (`@firec/map-module`)

| Метод | Назначение |
|---|---|
| `isPassable(worldX, worldY)` | Проходимость тайла |
| `canFit(x, y, w, h)` | Помещается ли хитбокс |
| `tryMove(x, y, nx, ny, w, h)` | Движение с коллизией о тайлы (скольжение) |
| `hasLineOfSight(x1,y1,x2,y2,maxDist)` | Луч видимости (для аггро/стрельбы) |
| `destroyTile(worldX, worldY)` | Разрушение тайла стены (→ пол; Destruct-модификатор, взрывы) |
| `getPassableNeighbors(...)` | Соседи тайла (для A*) |
| `worldToTile / tileToWorld` | Преобразования координат |
| `config` | `{ chunkSize: 16, tileSize: 32 }` |
| `update(x, y)` | Центрирование загрузки чанков вокруг точки |
| `onChunkLoaded(cb)` | Подписка на догрузку чанка (использует RegionFeatureSystem) |
| `getLoadedChunks()` | Список загруженных чанков |

### Pathfinder

A* по тайлам: `findPath({ start, end, maxNodes }): Path` (`Path = WorldCoord[]`,
`[0]` — старт). Используется FSM-врагами (кэш пути, пересчёт раз в
`repathInterval` кадров) и червём.

### RegionMap

Макрораскладка мира (детерминирована, не зависит от забега):
`regionAtChunk(cx, cy)`, `regionAtWorld(x, y)` (первый подходящий прямоугольник
в `REGION_ORDER`, иначе fallback `ruins`), `regionCenterWorld(id)`.

### EntityFactory — конвейер сущностей

`spawn(defId, x, y): DeclarativeEntity` — собирает сущность целиком из
определения: статы, внешность, контроллер по `ai.kind`, снаряжение (loadout),
журнал (открытие записи при спавне в пределах **900 px** от игрока).
`spawnBoss(defId, x, y)` — голова + цепочка сегментов (`BossSpec.segments`,
`segmentGap`), сегменты гибнут вместе с головой.

Конструктор: `new EntityFactory(entityWorld, pathfinder, getTarget, journal?, effectSystem?)`.

### ControlSwitchService

Хранит текущую управляемую сущность; `switchTo(entity)` переставляет
PlayerController (или WormPlayerController для танковой схемы) — основа
перерождения и играбельности боссов.

### JournalService

Журнал открытий (Rogue Legacy / RoR2-стиль): до встречи запись показана как «???».
`unlock(id)` (идемпотентно, помечает «новым»), `unlockEntity(defId)` →
префикс `e:` (или `n:` для npc), `unlockItem(itemId)` → `i:` (только id из
`ITEM_DEFINITIONS`), `markRead(id)`, `isNew(id)`, `isUnlocked(id)`,
`getUnlocked()`, `entries(category)` для окна. Персистится через MetaStorage
(`journal`, `journalNew`).

Источники открытия: спавн в 900 px от игрока, `entityKilled`, `itemPicked`,
`barterCompleted` (обе стороны), открытие окна торговли (`n:trader`).

### StatsService

Статистика забега (`RunStats`): `ticks` (кадры 60 Гц), `kills` (по id),
`killsTotal`, `bosses`, `pickups`, `trades`. Подписки: `entityKilled`
(только kills управляемого), `itemPicked`, `barterCompleted`.
`endRun(died)` — однократное слияние в мету (`runsEnded`, `totalKills`,
`totalDeaths`, `bestRunTicks`, `totalTrades`, `totalPickups`, `bossesKilled`).
`restoreRun(saved)` — восстановление из сейва.

### MetaStorage

`loadMeta()/saveMeta(state)`: ключ `jsrl.meta.v1`, устойчиво к битым данным
(try/catch → дефолты). `MetaState = { journal: string[], journalNew: string[], stats: MetaStats }`.

### SettingsService

`loadSettings()/saveSettings()/settingsState.current`: ключ `jsrl.settings.v1`,
частичные данные сливаются с `DEFAULT_SETTINGS`:

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

3 слота (`jsrl.save.1..3`). `SaveData` (version 1):
```ts
{ version: 1, seed: number, date: string /*ISO*/,
  player: { x, y, hp, level, experience },
  inventory: { weapon: string|null, modifiers: (string|null)[], chips: (string|null)[] },
  stats: RunStats }
```
`listSlots(): SlotInfo[]` (`exists, date, level, ticks`) для SlotPickerWindow.
Мир детерминированно воссоздаётся из `seed`.

---

## 7. Сущности и компоненты

### Иерархия

```
GameObject (x, y, hp/maxHP, isDead, getHP, abstract render)
└── Entity (+ Inventory, speed = base × multiplier, width/height,
│           persistent, team, targetable, invulnerable, solid,
│           spawnX/spawnY, lastAttacker,
│           takeDamage → entityKilled(если есть attacker)+entityDied,
│           setHP, heal, getCooldowns)
    ├── Player            # HP 1000, speed 3, damage 10, 10×10 px, цвет по HP
    ├── DeclarativeEntity # конвейер: всё из EntityDefinition (+ controller,
    │                     #   experience, colorOverride для фаз боссов)
    ├── Trader            # прилавок offers[3], interactLabel «Торговать (бартер)»
    ├── Altar             # interactLabel «Пробудить хранителя руин», одноразовый
    │                     #   призыв босса (bossDefId) + катсцена
    ├── TrainingDummy     # persistent, респавн через 180 кадров, показывает урон
    └── PickupItem → WeaponPickup / ModifierPickup / ChipPickup
```

### Inventory (`components/Inventory.ts`)

- `weapon: Weapon | null` — одно оружие; `replaceWeapon()` возвращает старое (пикап).
- `weapon.modifierSlots` — **4 слота** модификаторов у всех оружий
  (`modifierSlotsCount = 4`); слоты оружия — только модификаторы, сам снаряд фиксирован.
- `chips[5]` — активные чипы (клавиши 1–5/Q).
- `fire(angle)`: готовность → `cooldown.setDuration(weapon.fireRate)`, `start()`,
  `weapon.fire(entity, angle)`.
- `useChip(i)`, `isChipReady(i)`, `addItem(item)` (роутинг по `type`).

### Camera

Следование lerp `0.05`; зум колесом шагами `×2^steps`, диапазон
`[minZoom (настройка, ≥0.05), MAX_ZOOM = 4]`; `setMinZoom()` из настроек;
`setFollowPoint(x, y)` для attract-режима меню.

### Прочие компоненты

- **Engine** — canvas + 2D-контекст + кэш изображений; fullscreen F12.
- **Keyboard** — синглтон: `isDown(code)`, `isKeyPressedOnce(code)`, `update()`.
- **MouseInput** — привязан к canvas: x/y (экранные), cx/cy (мировые), кнопки, `wheelDelta`.
- **Cooldown** — кадровая перезарядка: `start/update/isReady/setDuration`.
- **FloatingText** — всплывающий текст (время жизни в кадрах).

---

## 8. Конвейер сущностей (declarative pipeline)

### EntityDefinition — полное описание сущности данными

```ts
interface EntityDefinition {
  id: string; name: string;
  hp: number; speed: number; size: number;      // size = хитбокс и база внешности
  team: Team;                                    // 'player' | 'enemy' | 'neutral'
  solid?: boolean; targetable?: boolean; persistent?: boolean;
  experience?: number;                           // опыт за убийство
  controlScheme?: 'topdown' | 'tank';            // схема при перерождении в это тело
  appearance: { shape: 'rect'|'circle'; size; color; outline?; showHpBar? };
  ai?: AiProfile;                                // поведение (см. §9)
  loadout?: { weapon?(); modifiers?(); chips?[] };
  boss?: { title; segments; segmentGap?; segmentDef?; summonLines? };
  journal?: 'enemy' | 'boss' | 'npc';            // категория журнала
  description?: string;                          // лор для журнала
}
```

### ENTITY_DEFINITIONS — реестр сущностей (полная таблица)

| id | Имя | HP | Скорость | Размер | Команда | Опыт | AI | Оружие/снаряжение | Журнал |
|---|---|---|---|---|---|---|---|---|---|
| `rust_grunt` | Ржавый боец | 12 | 1.2 | 8 | enemy | 5 | enemy/**chaser** (агро 500, огонь 400, репуть 60, поводок 1500, блуждание 180) | Shotgun | enemy |
| `rust_worm` | Ржавый червь (БОСС) | 350 | 1.7 | 24 | enemy | 120 | worm (агро 600, огонь 420, волна 0.5/0.05); boss: 6 сегментов, gap 26; tank-схема | BossCannon + RebirthChip | boss |
| `rust_worm_segment` | Сегмент червя | 60 | 2.2 | 16 | enemy | — | follower (дистанция 26) | — | — |
| `glass_shard` | Стеклянный осколок | 10 | 1.6 | 8 | enemy | 6 | enemy/**timid** (агро 520, огонь 380, репуть 50, поводок 1400, блуждание 200, бегство < 40% HP) | LaserGun | enemy |
| `glass_wisp` | Стеклянный блик | 6 | 2.4 | 6 | enemy | 4 | enemy/**kiter** (агро 600, огонь 300, репуть 40, поводок 1600, блуждание 240) | Pistol | enemy |
| `ice_shard` | Ледяной осколок | 12 | 1.4 | 8 | enemy | 6 | enemy/**kamikaze** (агро 500, репуть 30, поводок 1400, блуждание 160, подрыв: триггер 34 px, радиус 70, урон 18, разгон ×1.8) | LaserGun (не используется) | enemy |
| `glass_warden` | Стеклянный страж (БОСС) | 300 | 0 | 22 | enemy | 100 | turret (огонь 480, **фазы** ниже); tank-схема; boss: 0 сегментов | LaserGun + DamageMult + Multicast(2, 0.4) + RebirthChip | boss |
| `settler` | Поселенец | 30 | 0.6 | 9 | player | — | settler (прогулки у дома) | Pistol (не стреляет) | npc |

### Фазы glass_warden (AiProfile.phases)

| Фаза | Условие (доля HP) | Залп | Темп | Урон | Внешность |
|---|---|---|---|---|---|
| 0 | ≤ 1.0 (старт) | базовый (1 + Multicast ×2) | ×1 | ×1 | синий `#0ea5e9` |
| 1 | ≤ 0.6 | 3 снаряда, веер 0.5 рад | ×0.75 (чаще) | ×1 | — |
| 2 | ≤ 0.3 | 8 снарядов, кольцо 2π | ×0.6 | ×1.25 | красный `#f87171` (colorOverride) |

Фазы применяются `TurretController.updatePhase()`: перезаписывают
`weapon.fireRate/shots/shotSpread/damageMultiplier` от захваченных базовых
значений + `colorOverride` тела. `phaseIndex` публичен (отладка/смоук).

---

## 9. Искусственный интеллект и контроллеры

`IController.update(entity, world)` — единый интерфейс; контроллер назначается
`EntityFactory.createController` по `ai.kind`:

| kind | Контроллер | Для кого |
|---|---|---|
| `enemy` | **EnemyFsmController** | все рядовые враги (4 архетипа) |
| `worm` | WormController | голова rust_worm |
| `turret` | TurretController (+фазы) | glass_warden |
| `follower` | FollowerController | сегменты червя |
| `settler` | SettlerController | поселенцы |
| `stationary` | — (null) | неподвижные |
| — | PlayerController / WormPlayerController | управляемая сущность (top-down / tank) |

### EnemyFsmController (этап 10) — конечный автомат

**Состояния** (публичное поле `state`):

| Состояние | Поведение |
|---|---|
| `idle` | Блуждание у точки спавна (`wanderRadius`, скорость ×0.5) со случайными паузами 60–180 кадров (шанс 40%) |
| `chase` | Погоня: A*-путь (кэш, пересчёт раз в `repathInterval`), при потере видимости — движение к последней известной позиции; стрельба/архетипное поведение |
| `search` | Обыск последней известной позиции (240 кадров): подходы, осмотры по кругу |
| `flee` | Бегство прямо от цели (×1.25), пока дистанция > 1.5×агро → `return` |
| `return` | Возврат домой (×1.1), лечение 1 HP/30 кадров; в точке спавна (<24 px) — полное восстановление → `idle` |

**Переходы и правила:**

- Аггро = цель в `aggroRange` **или** (получен урон ≤300 кадров назад **и** цель
  в `aggroRange × 1.5`) — по `Entity.lastAttacker` не требуется видимость.
- Память цели: при видимости (`hasLineOfSight`) запоминается `lastKnown`,
  `memoryTimer = 180`; истёк без видимости → `search`.
- Поводок: `dist(дом) > leashRange` → немедленный `return`; в `return` при
  новом аггро и `dist(дом) < leashRange × 0.8` — обратно в `chase`.
- Видимость цели обновляет `lastKnown` каждый кадр с LOS.

**Архетипы (`AiProfile.behavior`):**

| Архетип | Тактика в бою | Кто использует |
|---|---|---|
| `chaser` | Сближается (путь/напрямую) и стреляет в `fireRange` при LOS | rust_grunt |
| `kiter` | Держит дистанцию ~`fireRange × 0.75`; ближе `0.55×` — отходит; стреляет при LOS | glass_wisp |
| `kamikaze` | Разгон `speed × chargeSpeedMult`; на `explodeTrigger` px — `ExplosionEffect(explodeRadius, explodeDamage)` + самоубийство (без attacker → без опыта игроку) | ice_shard |
| `timid` | Как kiter, но при HP < `fleeBelow × max` → `flee` | glass_shard |

**Константы контроллера:** `MEMORY_FRAMES = 180`, `SEARCH_FRAMES = 240`,
`DAMAGE_MEMORY_FRAMES = 300`.

### WormController (голова червя)

Вне аггро (600 px) — патруль: плавный поворот курса; внутри — курс на цель с
поперечной волной (`waveAmplitude 0.5`, `waveFrequency 0.05` рад/кадр), залпы
из BossCannon в `fireRange 420` при LOS. Сегменты (FollowerController) держат
`followDistance 26` за предыдущим звеном; смерть головы убивает тело.

### WormPlayerController (танковая схема, этап 6.1)

При перерождении в червя: **W/S** — ход вдоль курса, **A/D** — поворот
(`TURN_RATE = 0.05` рад/кадр), **ЛКМ** — выстрел вдоль курса. Разрушенные
стены становятся полом (destroyTile).

### SettlerController

Прогулки в небольшом радиусе вокруг дома (детерминированный seed от
координат), без боя. Оружие в loadout — декорация.

### ChipUsage (общее для контроллеров игрока)

Shift → чип `dash` (если экипирован и готов); 1–5/Q → активные чипы.

---

## 10. Предметы: оружие, модификаторы, чипы

### Модель (Noita-like «очередь заклинаний», этап 4)

- **Weapon** — «оболочка»: `fireRate`, `baseDamage`, `projectileId`, `shots`,
  `shotSpread`, `damageMultiplier`, `modifierSlotsCount = 4`, `cooldown`.
- `Weapon.fire(source, angle)`: `resolveShot()` прогоняет модификаторы слотов
  по порядку, накапливая **CastState** (`copies, spread, damageAdd, damageMult,
  pierce, wave, explodeOnHit, destruct`), и эмитит `weaponFired` со списком
  **ProjectileSpec** (`projectileId, angle, damage, …`) — EffectSystem создаёт
  из них снаряды.
- Копии распределяются веером: `copies = shots × state.copies`, углы
  `-spread/2 … +spread/2`.

### Оружие (все — `modifierSlotsCount 4`)

| Класс | id в реестре | fireRate (кадров) | baseDamage | projectileId | Особенность |
|---|---|---|---|---|---|
| PistolWeapon | `pistol` | 15 | 5 | bullet | стартовое |
| LaserGunWeapon | `laser_gun` | 30 | 25 | laser | луч (LaserBeam) |
| ShotgunWeapon | `shotgun` | 25 | 4 | bullet | 5 дробин, spread 0.8 |
| FlamethrowerWeapon | `flamethrower` | 20 | 3 | fire_zone | зона огня |
| RocketLauncherWeapon | `rocket_launcher` | 90 | 15 | rocket | детонация → взрыв |
| BossCannonWeapon | `boss_cannon` | 90 | 12 | bullet | пушка червя |

### Модификаторы (`items/modifiers/catalog.ts`)

| Класс | id | Эффект (в CastState) |
|---|---|---|
| DamagePlusModifier | `mod_damage_plus` | `damageAdd += 3` |
| DamageMultModifier | `mod_damage_mult` | `damageMult *= 2` |
| PierceModifier | `mod_pierce` | `pierce = true` (снаряд не умирает после попадания) |
| SinusoidalModifier | `mod_sinusoidal` | `wave { amplitude: 24, frequency: 0.15 }` |
| MulticastModifier(count, spread) | `mod_multicast` | `copies *= count; spread += spread` |
| ExplosiveEndModifier | `mod_explosive_end` | `explodeOnHit = true` (взрыв при попадании/смерти снаряда) |
| DestructModifier | `mod_destruct` | `destruct = true` (снаряд разрушает стены → пол) |

### Чипы (`items/chips/`)

| Чип | id | Кулдаун | Действие |
|---|---|---|---|
| DashChip | `dash` | 60 кадров | `speedMultiplier × 3` на короткую активную фазу; снятие множителя по таймеру/снятию чипа (без «вечного» ускорения при двойном даше) |
| TeleportChip | `teleport` | 120 кадров | Мгновенный перенос к курсору |
| RebirthChip | `rebirth` | — | Пассивный: при смерти носителя управление переходит ближайшему живому **врагу** (RebirthSystem + ControlSwitch) |

### ITEM_DEFINITIONS (`content/items/definitions.ts`)

Реестр `id → { id, kind: 'weapon'|'modifier'|'chip', name, description, factory() }` —
источник для сохранений (id), журнала (`i:`-записи), лута и торговли.
Включает все оружия (`pistol`, `laser_gun`, `shotgun`, `flamethrower`,
`rocket_launcher`, `boss_cannon`), модификаторы (`mod_*`) и чипы (`dash`,
`teleport`, `rebirth`).

### Улучшения уровня (`content/upgrades.ts`)

При LEVEL UP окно предлагает случайные 3 из пула `LEVEL_UP_UPGRADES`:

| id | Эффект |
|---|---|
| `weapon_damage` | Урон оружия +15% (`damageMultiplier *= 1.15`) |
| `weapon_speed` | Перезарядка −10% (`fireRate ×0.9`, мин 3) |
| `max_health` | Здоровье +50 |

---

## 11. Эффекты и снаряды

Базовый `Effect` (x, y, angle, source, damage, `team` источника): `canHit(entity)` =
не источник, жив, `targetable`, **чужая команда** (friendly fire отсутствует).

| Эффект | Поведение |
|---|---|
| `BulletEffect` | Прямолинейный снаряд; урон при пересечении; гибнет о стены/по времени |
| `LaserBeam` | Неподвижный отрезок `duration` кадров; урон всем в полосе |
| `RocketEffect` | Летит, детонирует о стену/сущность/таймер; `onDeath` → EffectSystem создаёт взрыв |
| `FireZone` | Круг периодического урона (огнемёт) |
| `ExplosionEffect` | 12 кадров; на 6-м наносит урон в радиусе; радиус настраивается (дефолт 40); используется взрывами ракет, ExplosiveEnd и **камикадзе** |

---

## 12. Мир: регионы, генерация, структуры

### Параметры мира

- Чанк 16×16 тайлов, тайл 32 px → **чанк = 512×512 px**.
- Координаты регионов — в чанках **относительно чанка спавна**.
- Мир бесконечен: вне прямоугольников регионов — fallback `ruins`.
- Seed забега детерминирует лут/дома/фичи; раскладка регионов фиксирована.

### REGION_DEFINITIONS — полная таблица

| id | Название | Rect (чанки x,y,w,h) | Генератор | Безопасен | Спавны (веса) | Босс | Лут-пул | Особенность |
|---|---|---|---|---|---|---|---|---|
| `void_core` | Пустота | `{-8,-8,16,16}` (центр) | void | ✅ | — | — | — | Точка спавна игрока |
| `city` | Город | `{-20,-70,40,40}` (50 чанков вверх) | city | ✅ | — | — | Shotgun, DamagePlus, DashChip | Здания-ячейки, жители, торговцы |
| `bunker` | Бункер | `{80,-70,40,40}` (+100 вправо от города) | bunker | — | rust_grunt (4) | — | LaserGun, Multicast(2,0.3), ExplosiveEnd, Shotgun | Коридоры/комнаты, богатый лут |
| `worm_altar` | Алтарь червя | `{-106,-56,12,12}` (50 влево от города) | altar | — | rust_grunt (2) | `rust_worm` | Pierce, Shotgun | Алтарь в центре |
| `iced_fields` | Ледяные поля | `{-230,-30,60,60}` (200 влево) | iced | — | ice_shard (3) | — | LaserGun, Pierce, TeleportChip | Открытое поле, обломки |
| `glass_plain` | Стеклянная равнина | `{170,-30,60,60}` (зеркально, 200 вправо) | glass | — | glass_shard (3), glass_wisp (2) | `glass_warden` | LaserGun, Multicast(2,0.3), ExplosiveEnd, TeleportChip | Дюны, алтарь стража в центре |
| `ruins` | Ржавые пустоши | `null` (fallback везде) | ruins | — | rust_grunt (3), rust_worm (0) | `rust_worm` | Shotgun, DamagePlus, Pierce, DashChip | **imageTiles** (PNG), `ruinsDensity 1`, `lootChance 0.12`/чанк, дома |

`REGION_ORDER = [void_core, city, bunker, worm_altar, iced_fields, glass_plain, ruins]`
(первые конкретные прямоугольники, ruins — fallback).

### Раскладка мира (схема, чанки)

```
                     y=-230          y=-70…-30           y=-70…-30
                iced_fields            city               bunker
             x=-230…-170            x=-20…20           x=80…120
                  ┌──────┐         ┌──────┐  worm_altar ┌──────┐
                  │ 60×60│         │ 40×40│  x=-106…-95│ 40×40│
                  └──────┘         └──────┘    12×12    └──────┘
   x=-102400px        ▲                ▲       ┌───┐        ▲
                      │                │       └───┘        │
  glass_plain    ─────┼────────────────┼────────────────────┼─────
  x=170…230           │        void_core (СПАВН)            │
     60×60            │           x=-8…8, y=-8…8            │
                      ▼             (0,0)                   ▼
              x=+87040px…                        (мировые px = чанки × 512)
```

### Генераторы чанков (`map/generation/`, регистрируются в GeneratorRegistry)

| Генератор | Регион | Описание |
|---|---|---|
| `VoidGenerator` | void_core | Ровный тёмный пол безопасной пустоты |
| `RuinsGenerator` | ruins | Процедурные руины (плотность `ruinsDensity`), PNG-тайлы `images/` (floor_0..6, walls, trash_0..2 — `imageTiles`); штамповка **домов** (houses.ts) |
| `CityGenerator` | city | Сетка ячеек `CELL_TILES = 64` (4×4 чанка): здания с дверями (`DOOR_WIDTH = 4`), дороги |
| `BunkerGenerator` | bunker | Сетка комнат `ROOM_TILES = 32`, коридоры, двери 4, внешние ворота (`GATE_HALF = 4`) |
| `IcedFieldsGenerator` | iced_fields | Открытое поле: ровный пол + детерминированные скопления обломков (базовый класс для полей) |
| `GlassPlainGenerator` | glass_plain | Стеклянные дюны + алтарная платформа стража в центре региона |
| `AltarRegionGenerator` | worm_altar | Ровная площадка + кольцо-подиум в центре (алтарь ставит RegionFeatureSystem) |
| `structures.ts` | — | Общие штампы: кольцо алтарной платформы (Chebyshev) и пр. |

Палитры регионов (`content/regions/palette.ts`): `regionFloorCanvas(region)` /
`regionWallCanvas(region)` — процедурные тайл-спрайты 32×32 из
`RegionPalette { floor[], wall, wallDark, fog }` (fog — цвет метки HUD).
Для `imageTiles`-регионов (ruins) вместо палитры грузятся PNG из `images/`.
> Отложено: замена процедурных палитр остальным регионам на настоящие текстуры.

### Дома руин (`map/structures/houses.ts`)

«Восстановленные дома» — безопасные структуры с торговцами и поселенцами.

| Константа | Значение | Смысл |
|---|---|---|
| `BLOCK_CHUNKS` | 8 | Блок размещения = 8×8 чанков = 128×128 тайлов |
| `HOUSE_W × HOUSE_H` | 12 × 10 | Размер дома в тайлах |
| `HOUSE_CHANCE` | 0.45 | Шанс дома на блок (seed-детерминированно) |
| Отступ | 8…(128−размер−8) | Случайное положение в блоке |

API: `houseOfBlock(bx, by, runSeed)`, `housesForChunk(chunkX, chunkY, runSeed)`
(все дома, пересекающие чанк, включая соседние блоки), `houseWallAt(house, gx, gy)`
(контур — стена; **дверь**: 2 тайла в центре южной стены), `houseInterior(house)`
(внутренность с отступом 1 тайл).

### RegionFeatureSystem — фичи по загрузке чанков

| Фича | Правило |
|---|---|
| Дома (ruins) | На каждый новый чанк — `housesForChunk`; каждый дом регистрируется один раз: 1–2 поселенца (±96/±64 px от центра), торговец с шансом **60%** (в 32 px от центра); безопасная зона `HOUSE_SAFE_RADIUS = 256` |
| Ячейки города | Якорный чанк (1,1) каждой сетки 4×4: здание с шансом **55%**, 1–2 жителя (±256 px), торговец с шансом **50%** |
| Алтари | Только в центральном чанке алтарного региона (`regionCenterTile(rect)`), один на регион; `Altar(bossDefId)` + катсцена призыва |
| Тайники лута | В регионах с `lootChance` (ruins: 0.12/чанк) — пикап случайного предмета из пула региона |
| Торговцы | `Trader` с 3 предложениями из `region.loot`; `onTrade` → TradeWindow; журнал открывает `n:trader` |
| Отслеживание региона | Смена региона управляемой сущности → объявление названия (FloatingText + метка HUD) |
| debugStats | `{ chunks, houses, traders, settlers, altars, loot }` → `__debug.zoneStats()` |

### EnemySpawnerSystem — постоянный спавн

Интервал 180 кадров; кольцо 300–500 px от игрока; 6 попыток на спавн;
фильтры: регион не `safe`, тайл проходим, не в безопасной зоне
(радиус + 240 px для FSM-врагов); выбор `defId` по весам `region.spawns`.

---

## 13. UI: canvas-фреймворк и окна

### Фреймворк (`ui/`)

- **Component** — база: позиция/размер, `getText()`, `getGlobalPosition()`, render.
- **Container** (+ `AbsoluteContainer`, `VerticalLayout`, `HorizontalLayout`) — компоновка.
- **Компоненты**: `Button` (текст/hover/click, `getText()`), `Label` (текст, цвет, размер шрифта), `ItemSlot` (слот предмета с иконкой/тултипом), `Tooltip`, `Crosshair`.
- **Window** — корневой контейнер с фоном/заголовком (`title`), `autoSize()`, `centerWindow()`, флаг **`causesPause`** (модальные окна ставят симуляцию на паузу), `update(mouse)`, `render(ctx)`.
- **ScreenManager** — стек окон + HUD:
  - `pushWindow/popWindow/getWindows/getTopWindow`;
  - `isGamePaused()` — истинно, если у любого окна `causesPause`;
  - **фикс кликов сквозь окна (хотфикс этапа 9):** в `update()` реальную
    `MouseInput` получает **только верхнее окно**; нижние обновляются с
    «мёртвой» мышью (координаты −9999, detached canvas) — перекрытые окна
    не ловят клики;
  - рендер: затемнение `#0008` под стеком окон, окна снизу вверх, подсказка при наведении.

### Окна (13)

| Окно | causesPause | Содержание |
|---|---|---|
| `MainMenuWindow` | ✅ | Заголовок «РУИНЫ ПУСТОТЫ», кнопки: Новый забег / Продолжить… / Журнал / Статистика / Настройки |
| `SlotPickerWindow` | ✅ | 3 слота: дата, уровень, время забега; режимы «загрузка» (из меню) и «запись» (из паузы) |
| `PauseWindow` | ✅ | Esc в забеге: Продолжить / Сохранить… / Журнал / Статистика / Настройки / Выйти в меню |
| `JournalWindow` («Журнал смотрителя») | ✅ | Вкладки: Враги / Боссы / NPC / Предметы; неоткрытые записи — «???»; бейдж **«• новое»** у непрочитанных (снимается выбором записи → `markRead`); лор-описания |
| `StatsWindow` | ✅ | Статистика забега + мета (тики → мм:сс) |
| `SettingsWindow` | ✅ | Ремап клавиш (клик → «нажмите клавишу»), мин. зум, дальность рендера, тумблеры HUD, debug-оверлей |
| `RunResultsWindow` («Забег завершён») | ✅ | Смерть без перерождения: показатели забега; кнопки Новый забег / В главное меню |
| `TradeWindow` | ✅ | Бартер 1:1 без валюты: прилавок (3 предложения) → выбор → ряд предметов игрока **того же типа** → обмен (предметы меняются слотами); эмитит `barterCompleted { offerId, playerId }` |
| `CutsceneWindow` | ✅ | Реплики катсцен (призыв босса и пр.), далее — клик/E |
| `LevelUpWindow` | ✅ | Выбор 1 из 3 улучшений уровня |
| `InventoryWindow` | — | Tab: оружие/модификаторы/чипы, **3 колонки**, интерактивные слоты (перестановка, снятие) |
| `PickupWindow` | ✅ | Выбор слота для подбираемого предмета |
| `HudScreen` | — | Полоса опыта сверху; HP + чипы справа внизу; оружие + модификаторы слева внизу; метка региона; подсказка `[E] <label>`; прицел; debug-оверлей (FPS/чанки) |

---

## 14. Оболочка: меню, сейвы, журнал, статистика, настройки

### Поток игры

```
[без параметров] → ГЛАВНОЕ МЕНЮ (attract-камера: круг R=6200, 0.0016 рад/тик;
                   симуляция стоит, мир грузится вокруг камеры)
   ├─ «Новый забег»   → navigateTo('?run=new')   → новый seed, спавн в void_core
   ├─ «Продолжить…»   → SlotPickerWindow (загрузка) → ?slot=N → мир из seed сейва
   ├─ «Журнал» / «Статистика» / «Настройки» → окна поверх меню
[в забеге]
   ├─ Esc → PauseWindow (пауза симуляции)
   │     ├─ «Сохранить…» → SlotPickerWindow (запись в 1..3)
   │     └─ «Выйти в меню» → меню
   └─ смерть без Rebirth-чипа → flow 'ended' → RunResultsWindow
         ├─ «Новый забег» → ?run=new
         └─ «В главное меню» → меню (мета сохранена)
```

### Мета-прогресс (между забегами, `jsrl.meta.v1`)

- `journal[]` — открытые записи (`e:` враги/боссы через journal-категорию,
  `i:` предметы, `n:` NPC + статический `n:trader`);
- `journalNew[]` — непрочитанные (бейдж «• новое», снимается в окне журнала);
- `stats` — `runs, runsEnded, totalKills, totalDeaths, bestRunTicks,
  totalTrades, totalPickups, bossesKilled`.

### Сохранения (слоты 1–3)

См. `SaveData` в §6. Сохранение: позиция/HP/уровень/опыт игрока, инвентарь
(id оружия, модификаторы, чипы), статистика забега, **seed мира**. Загрузка:
мир воссоздаётся из seed, предметы — из `ITEM_DEFINITIONS` по id.

---

## 15. События (EventBus)

Типизированная шина (`events/EventBus.ts`): `on(name, listener): Unsubscribe`,
`emit(name, data)`. Системы обязаны отписываться в `dispose()`.

| Событие | Payload | Эмитент | Подписчики |
|---|---|---|---|
| `entityKilled` | `{ killer, victim }` | `Entity.takeDamage` (только при attacker) | ProgressionSystem (опыт), JournalService (через GameFactory), StatsService, RebirthSystem |
| `entityDied` | `{ entity }` | `Entity.takeDamage` (всегда при смерти) | RebirthSystem (перерождение), CleanupSystem-логика |
| `weaponFired` | `{ source, specs: ProjectileSpec[] }` | `Weapon.fire` | EffectSystem (создание снарядов) |
| `cutsceneStart` | `{ lines: string[] }` | Altar, скрипты | CutsceneSystem |
| `itemPicked` | `{ item, by }` | PickupSystem/Inventory | JournalService, StatsService |
| `barterCompleted` | `{ offerId, playerId }` | TradeWindow (offerId — отданный торговцу, playerId — полученный) | JournalService (обе стороны), StatsService |

---

## 16. Фракции и боевая модель

- `Team = 'player' | 'enemy' | 'neutral'`; `areHostile(a, b) = a !== b`.
- `neutral` (манекены) — валидная цель для всех, сами не воюют.
- Снаряды/взрывы (`Effect.canHit`): цель жива, `targetable`, **чужая команда**,
  не источник → friendly fire между врагами отсутствует (взрыв камикадзе не
  задевает других врагов).
- Урон: `Entity.takeDamage(damage, attacker?)` → `hp -= damage`; при смерти:
  `entityKilled` (если attacker) + `entityDied`. Флаги: `invulnerable`
  (debug), `persistent` (не удаляется Cleanup).
- `lastAttacker` — для аггро FSM по урону.
- Матрица hostility/кланов (расширенная дипломатия) — **отложена**.

---

## 17. Прогрессия и уровни

- Опыт за убийство (только если убийца — управляемая сущность):
  rust_grunt 5, glass_wisp 4, glass_shard 6, ice_shard 6, rust_worm 120,
  glass_warden 100.
- Порог уровня: `experienceToNext = level × 100`.
- LEVEL UP → `LevelUpWindow` (пауза) → 1 из 3 случайных улучшений (§10).
- Уровень/опыт сохраняются в слот и восстанавливаются при загрузке.

---

## 18. Ввод и управление

### InputAction и дефолтные биндинги (`InputMapper.createDefaultBindings`)

| Действие | Клавиши по умолчанию |
|---|---|
| MoveUp / Down / Left / Right | W/S/A/D + стрелки |
| Dash | ShiftLeft / ShiftRight (нужен чип `dash`) |
| Chip1…Chip5 | 1…5 (Chip1 дублирует Q) |
| Interact | E (подбор, торговля, алтарь, реплики катсцен) |
| Inventory | Tab |
| Fullscreen | F12 |

- `rebind(action, keys)` / `getBindings()`; переопределения хранятся в
  `settings.bindings` и применяются при старте; SettingsWindow предоставляет
  UI ремапа («нажмите клавишу»).
- Мышь: ЛКМ — выстрел (в топ-down — к курсору, честное прицеливание с учётом
  зума и положения камеры; в танковой схеме — вдоль корпуса), колесо — зум.

### Схемы управления телами (`controlScheme`)

| Схема | Тела | Управление |
|---|---|---|
| `topdown` (дефолт) | Игрок | WASD — движение во все стороны, ЛКМ — выстрел к курсору |
| `tank` | rust_worm, glass_warden (при перерождении) | W/S — ход вдоль курса, A/D — поворот (0.05 рад/кадр), ЛКМ — выстрел вдоль курса |

---

## 19. Отладка: __debug-хуки и playground

### `window.__debug` (доступен во всех режимах)

| Хук | Назначение |
|---|---|
| `getControlled()` | Текущая управляемая сущность |
| `entityWorld` | Контейнер сущностей (`.all`) |
| `entityFactory` | Конвейер (`spawn(defId,x,y)`, `spawnBoss(...)`) |
| `regionMap` | `regionAtWorld/regionAtChunk` |
| `screenManager` | Стек окон (`getWindows()`, `isGamePaused()`) |
| `worldService` | Фасад мира (тайлы, LOS) |
| `housesAt(cx, cy)` | Дома, пересекающие чанк |
| `zoneStats()` | `{ chunks, houses, traders, settlers, altars, loot }` |
| `journalUnlocked()` | Открытые id журнала |
| `giveChip('dash')` / `giveItem('damage_plus'\|'pierce')` | Выдача тестовых предметов |
| `setInvulnerable(bool)` | Неуязвимость управляемого (только debug-сцена) |
| `forceDeath()` | Мгновенная смерть (только debug-сцена; игнорируется при invulnerable) |

### Playground (`?playground`)

Отладочный полигон рядом со спавном: все оружия (пикапы x=800), все
модификаторы (x=600), чипы Teleport/Dash (x=700), тренировочные манекены, два
rust_grunt, алтарь червя; игроку выдаются Teleport/Dash/Rebirth-чипы.
При загрузке играет вступительная катсцена (закрывается клавишей E).

---

## 20. Тесты: puppeteer-смоук и vitest

### Смоук (`workspace/.smoke/smoke.js`, 8 сценариев)

Запуск: сервер на :8080 → `node smoke.js` (проходит все сценарии подряд,
в конце `SMOKE: OK/FAIL`; скриншоты каждого этапа).

| Сценарий | URL | Проверяет |
|---|---|---|
| `game` | `?run=new` | движение, базовый геймплей |
| `playground` | `?playground` | подбор оружия, Tab-инвентарь закрывается, стрельба, мир не статичен |
| `altar` | `?playground` | призыв босса у алтаря (катсцена не съедает E), босс существует/активен |
| `fixes` | `?playground` | скорость 3 → даш → 3 (без перманентного буста); перерождение во **врага** |
| `worm` | `?playground` | танковая схема червя: поворот A/D, ход W, перемещение |
| `zones` | `?playground` | дом = void_core; руины: регион+спавны; облёт: zoneStats; дом: поселенцы, **нет «живущих» врагов**; бартер 1:1 (changed + журнал обеих сторон); город: регион+жители, нет врагов; алтарь червя на месте |
| `ai` | `?playground` | FSM: idle→chase (аггро), поводок→return→idle+полное HP дома; камикадзе взрывается; timid убегает <40% HP; kiter держит дистанцию (120–420 px); фазы босса 0/1/2 (shots 1/3/8, цвет `#f87171`) |
| `shell` | (меню) | меню→«Новый забег»; **клик не проходит сквозь журнал** (покрытая кнопка меню не срабатывает); бейдж «• новое» снимается при прочтении; пауза→сохранение в слот 1→загрузка `?slot=1` (позиция/оружие/моды совпадают); журнал открывает rust_grunt по встрече; убийство дальнего врага открывает запись; смерть→итоги→в меню |

Вспомогательные probe-скрипты: `probe_menu.js`, `probe_click.js`, `probe_ct.js`,
`probe_kill.js`, `probe_ai*.js`, `probe_pause*.js`, `probe_worm.js`,
`probe_settings.js`, `probe_regions.js`, `probe_house.js`, `probe_tiles.js`, `probe3.js`.

### Юнит-тесты (`npm test`, vitest, 7 файлов / 22 теста)

Окружение node + in-memory-заглушка localStorage (`tests/setup.ts`).

| Файл | Покрытие |
|---|---|
| `tests/metaStorage.test.ts` | Дефолты, round-trip, устойчивость к битому JSON |
| `tests/journal.test.ts` | unlock/isNew, markRead, префиксы `e:`/`i:`, персистентность между экземплярами |
| `tests/settings.test.ts` | Дефолты, сохранение, частичное слияние с дефолтами |
| `tests/stats.test.ts` | Счётчики забега по событиям (только свои убийства), боссы/пикапы/трейды, однократный `endRun` |
| `tests/regionMap.test.ts` | void_core/city/bunker/iced_fields/glass_plain/ruins-fallback, world↔chunk согласованность |
| `tests/houses.test.ts` | Детерминизм от seed, наличие домов, интерьер внутри коробки, стена/дверь |
| `tests/inputMapper.test.ts` | Дефолтные биндинги, rebind, изоляция экземпляров |

---

## 21. Git: история, артефакты, восстановление

- Ветка: `master` (единственная; push на GitHub невозможен без авторизации).
- Полная история: 55 коммитов — от оригинала (`e244f89 Initital`, `0dff8ca
  Finally Version`, переписывание `b3311f9` на map-module, `cf0fe9a Checkpoint`)
  до этапов рефакторинга 0–11 (таблица в §1).
- **Артефакт:** `workspace/js-rogue-like-refactor.bundle` — git-bundle ветки
  master (актуален до `91f5c68`). Рецепт восстановления рабочего репозитория
  из bundle (проверен трижды — песочница периодически стирает `.git`):
  ```bash
  cd repo
  git init -b master
  git fetch ../js-rogue-like-refactor.bundle master
  git reset --mixed FETCH_HEAD     # рабочее дерево сохраняется
  git config user.name "Qwen" && git config user.email "qwen@arena.local"
  ```
- Восстановление окружения после сброса песочницы:
  ```bash
  apt-get update && apt-get install -y libglib2.0-0 libnss3 libnspr4 libatk1.0-0 \
    libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 \
    libxfixes3 libxrandr2 libpango-1.0-0 libcairo2 libasound2 libgbm1 libgtk-3-0 \
    fonts-liberation
  cd repo && npm install && npm run build
  cd ../.smoke && npm install && npx puppeteer browsers install chrome
  # сервер: npx http-server -p 8080 -a 0.0.0.0 -c-1 (из папки repo)
  ```

---

## 22. Известные ограничения и отложенное

| Пункт | Статус |
|---|---|
| Текстуры регионов | Только ruins имеют PNG-тайлы (`images/`); остальные регионы — процедурные палитры. Замена на текстуры **отложена** по решению автора |
| Матрица hostility/кланов | Упрощённая модель `areHostile(a,b) = a!==b`; расширенная дипломатия **отложена** |
| Дружественный огонь | Отсутствует по дизайну (canHit по командам) |
| Урон камикадзе игроку-камикадзе | Самоподрыв не даёт опыт игроку (смерть без attacker) — осознанное решение |
| Аудио | Нет |
| Мобильное управление | Нет (клавиатура+мышь) |
| Боссы | Два эталона конвейера (червь-сегменты, турель-фазы); новые боссы добавляются определением + (при необходимости) контроллером |

---

*Документация сгенерирована по состоянию рабочей копии на `91f5c68`.
При изменении контентных таблиц обновляйте соответствующие разделы (§8, §10, §12).*
