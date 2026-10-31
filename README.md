# js-rogue-like

Тайловый roguelike на TypeScript + Canvas 2D. Карта (чанки, LOD, генераторы, рендер) —
внешний модуль [`@firec/map-module`](https://github.com/FirecYT/map-module).

## Разработка

```bash
npm install          # зависимости
npm run build:dev    # сборка в build/ (или npm run watch)
npm run serve        # статический сервер на http://localhost:8080/
```

Открыть `http://localhost:8080/` — игра; `http://localhost:8080/?playground` —
отладочный полигон (все оружия/модификаторы/чипы пикапами, тренировочные манекены,
тестовая катсцена). Полигон живёт в `src/debug/playground.ts` и в боевой режим не входит.

## Скрипты

| Скрипт | Назначение |
|---|---|
| `build` / `build:prod` | production-сборка webpack |
| `build:dev` | development-сборка (source maps) |
| `watch` | пересборка при изменениях |
| `serve` | локальный статический сервер |
| `lint` | ESLint (strict + stylistic) |
| `format` | Prettier |

## Управление

- WASD / стрелки — движение, ЛКМ — стрельба (прицел по курсору)
- Shift — рывок (чип Dash), 1–5 / Q — чипы
- E — подобрать предмет / взаимодействие, Tab — инвентарь
- Колесо мыши — зум (0.5x–4x), F12 — fullscreen

## Структура src/

```
core/         Game (цикл), GameFactory (composition root), интерфейсы ISystem/фазы
components/   Engine, Camera, Keyboard, MouseInput, Cooldown, Inventory, FloatingText
services/     WorldService (фасад map-module), Pathfinder (A*), SystemManager
systems/      Movement, Collision, Effect, Pickup, EnemySpawner, Cleanup,
              Progression, UI, Cutscene, FloatingText, ControlSwitch, Rebirth
entities/     Entity → Player, Enemy, TrainingDummy, PickupItem → {Weapon,Chip,Modifier}Pickup
controllers/  IController → PlayerController, AiController
items/        Item → Weapon | Chip | Modifier + конкретные предметы
effects/      Effect → Bullet, Laser, FireZone, Explosion
events/       EventBus (типизированная шина)
ui/           ScreenManager, Window, HUD и окна (canvas-UI)
map/          тайлы (TILES/TILE_DEFS) и генераторы (Ruins, Void)
debug/        отладочный полигон (?playground)
```
