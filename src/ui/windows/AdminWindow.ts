import { Window } from '../Window';
import { Label } from '../components/Label';
import { Button } from '../components/Button';
import { VerticalLayout } from '../containers/VerticalLayout';
import { HorizontalLayout } from '../containers/HorizontalLayout';
import type MouseInput from '../../components/MouseInput';
import type { Camera } from '../../components/Camera';
import type { World } from '@firec/map-module';
import type Entity from '../../entities/Entity';
import type { EntityWorld } from '../../core/EntityWorld';
import { DeclarativeEntity } from '../../entities/DeclarativeEntity';
import { Trader } from '../../entities/Trader';
import { Medic } from '../../entities/Medic';
import { Altar } from '../../entities/Altar';
import { Campfire } from '../../entities/Campfire';
import Player from '../../Player';
import { EnemyFsmController } from '../../controllers/EnemyFsmController';
import type { AiProfile, EnemyBehavior } from '../../content/entities/definitions';
import { ITEM_DEFINITIONS } from '../../content/items/definitions';
import { REGION_DEFINITIONS, REGION_ORDER } from '../../content/regions/definitions';
import { TILES, TILE_DEFS } from '../../map/Types';
import type { Weapon } from '../../items/Weapon';
import type { Chip } from '../../items/Chip';
import type { Modifier } from '../../items/modifiers/Modifier';
import { DashChip } from '../../items/chips/DashChip';
import { HealChip } from '../../items/chips/HealChip';
import { NovaChip } from '../../items/chips/NovaChip';
import { ShieldChip } from '../../items/chips/ShieldChip';
import { TeleportChip } from '../../items/chips/TeleportChip';
import {
	DamagePlusModifier,
	DamageMultModifier,
	MulticastModifier,
	SinusoidalModifier,
	SplitModifier,
} from '../../items/modifiers/catalog';
import { areHostile, type Team } from '../../types/Team';

/** Зависимости админ-панели (передаются из GameFactory, только полигон). */
export interface AdminDeps {
	/** Текущая управляемая сущность. */
	getControlled: () => Entity;
	/** Контейнер всех сущностей мира. */
	entityWorld: EntityWorld;
	/** Тайловый мир (тайлы, регенерация чанков). */
	world: World;
	/** Камера (преобразование экранных координат в мировые). */
	camera: Camera;
	/** Seed текущего забега. */
	runSeed: number;
	/** Перезапуск полигона с новым seed. */
	restartWithSeed: (seed: number) => void;
	/** Центр региона в мировых координатах (null — регион без прямоугольника). */
	regionCenter: (id: string) => { x: number; y: number } | null;
}

/** Вкладка админ-панели. */
type AdminTab = 'entity' | 'gear' | 'world' | 'teleport';

/** Режим клика по миру вне окна. */
type ClickMode = 'none' | 'brush' | 'teleport';

/** Порядок переключения команд. */
const TEAMS: Team[] = ['player', 'enemy', 'neutral'];

/** Порядок переключения архетипов FSM. */
const BEHAVIORS: EnemyBehavior[] = ['chaser', 'kiter', 'kamikaze', 'timid'];

/** id оружия из реестра предметов. */
const WEAPON_IDS = Object.keys(ITEM_DEFINITIONS).filter(
	(id) => ITEM_DEFINITIONS[id].kind === 'weapon'
);
/** id чипов из реестра предметов. */
const CHIP_IDS = Object.keys(ITEM_DEFINITIONS).filter(
	(id) => ITEM_DEFINITIONS[id].kind === 'chip'
);
/** id модификаторов из реестра предметов. */
const MODIFIER_IDS = Object.keys(ITEM_DEFINITIONS).filter(
	(id) => ITEM_DEFINITIONS[id].kind === 'modifier'
);

/**
 * Админ-панель debug-сцены (?playground): живой инструментарий для
 * изменения параметров сущностей и предметов, выдачи снаряжения любому
 * существу (включая боссов), редактирования тайлов кистью, регенерации
 * чанков со сменой seed, телепортации и поиска ближайших NPC.
 *
 * Окно НЕ ставит игру на паузу: все правки применяются мгновенно,
 * мир продолжает жить. Числовые параметры редактируются кнопками-степперами
 * (текстового ввода на канвасе нет).
 */
export class AdminWindow extends Window {
	/** Активная вкладка. */
	private tab: AdminTab = 'entity';
	/** Выбранная цель (null — управляемая сущность). */
	private target: Entity | null = null;
	/** Тайл кисти. */
	private brushTile = TILES.WALL;
	/** Кисть 3×3 вместо одиночного тайла. */
	private brush3x3 = false;
	/** Режим клика по миру вне окна. */
	private clickMode: ClickMode = 'none';
	/** Выбранный слот чипов (0..4). */
	private chipSlot = 0;
	/** Выбранный слот модификаторов оружия. */
	private modSlot = 0;
	/** Редактируемый seed (до перезапуска). */
	private seedEdit: number;
	/** Строка статуса (результат последней операции). */
	private statusText = 'Готово.';
	/** Метка тайла под курсором (обновляется каждый кадр). */
	private tileInfoLabel: Label | null = null;

	/** Состояние клавиши мыши для отслеживания фронта нажатия. */
	private wasPressedLocal = false;

	private lastCanvasWidth: number;
	private lastCanvasHeight: number;

	/**
	 * @param deps - Зависимости панели (мир, камера, сущности)
	 * @param canvasWidth - Ширина канваса
	 * @param canvasHeight - Высота канваса
	 * @param onBack - Закрыть окно
	 */
	constructor(
		private readonly deps: AdminDeps,
		canvasWidth: number,
		canvasHeight: number,
		private readonly onBack: () => void
	) {
		super();
		this.title = 'Админ-панель полигона';
		this.causesPause = false;
		this.seedEdit = deps.runSeed;
		this.lastCanvasWidth = canvasWidth;
		this.lastCanvasHeight = canvasHeight;
		this.createUI();
	}

	/**
	 * Обновление окна: дочерние компоненты плюс клик по миру вне окна
	 * (кисть тайлов или телепорт управляемой сущности).
	 * @param mouse - Входные данные мыши
	 */
	update(mouse: MouseInput): void {
		const pressEdge = mouse.pressed && !this.wasPressedLocal;
		this.wasPressedLocal = mouse.pressed;
		super.update(mouse);

		if (this.tileInfoLabel) {
			const pt = this.deps.camera.screenToWorld(mouse.x, mouse.y);
			const tile = this.deps.world.getTileAt(pt.x, pt.y);
			const def = TILE_DEFS.find((d) => d.id === tile);
			this.tileInfoLabel.setText(
				`Курсор: ${Math.round(pt.x)}, ${Math.round(pt.y)} — тайл «${def?.name ?? tile}»`
			);
		}

		if (pressEdge && this.clickMode !== 'none' && !this.isInsideWindow(mouse.x, mouse.y)) {
			const pt = this.deps.camera.screenToWorld(mouse.x, mouse.y);
			if (this.clickMode === 'brush') {
				this.paintTiles(pt.x, pt.y);
			} else {
				this.teleportControlled(pt.x, pt.y);
			}
			this.commit();
		}
	}

	/**
	 * Проверяет попадание точки в прямоугольник окна.
	 * @param x - Экранная координата X
	 * @param y - Экранная координата Y
	 * @returns true, если точка внутри окна
	 */
	private isInsideWindow(x: number, y: number): boolean {
		return (
			x >= this.x && x <= this.x + this.width &&
			y >= this.y && y <= this.y + this.height
		);
	}

	/** Текущая цель панели (выбранная или управляемая сущность). */
	private get subject(): Entity {
		if (this.target && !this.target.isDead() && this.deps.entityWorld.all.includes(this.target)) {
			return this.target;
		}
		this.target = null;
		return this.deps.getControlled();
	}

	/** Пересобирает окно после изменения состояния. */
	private commit(): void {
		this.createUI();
	}

	/** Полная пересборка интерфейса под текущую вкладку и состояние. */
	private createUI(): void {
		this.root.children = [];
		const layout = new VerticalLayout();
		layout.spacing = 5;
		layout.padding = { top: 38, right: 18, bottom: 14, left: 18 };

		layout.addChild(this.targetRow());
		layout.addChild(this.tabRow());

		switch (this.tab) {
			case 'entity':
				this.buildEntityTab(layout);
				break;
			case 'gear':
				this.buildGearTab(layout);
				break;
			case 'world':
				this.buildWorldTab(layout);
				break;
			case 'teleport':
				this.buildTeleportTab(layout);
				break;
		}

		this.tileInfoLabel = new Label('', 520);
		this.tileInfoLabel.setColor('#8bd');
		layout.addChild(this.tileInfoLabel);

		const status = new Label(`» ${this.statusText}`, 640);
		status.setColor('#9c9');
		layout.addChild(status);

		const close = new Button('Закрыть (F9)', 160, 28);
		close.setOnClick(() => this.onBack());
		layout.addChild(close);

		this.root.addChild(layout);
		this.autoSize();
		this.centerWindow(this.lastCanvasWidth, this.lastCanvasHeight);
	}

	/** Строка выбора цели: управляемый, ближайший враг, NPC, босс, цикл. */
	private targetRow(): HorizontalLayout {
		const row = new HorizontalLayout();
		row.spacing = 6;
		const subject = this.subject;
		const label = new Label(`Цель: ${this.entityName(subject)}`, 250);
		label.setColor('#fd8');
		row.addChild(label);
		row.addChild(this.button('Цель: я', () => {
			this.target = null;
			this.commit();
		}));
		row.addChild(this.button('Ближ. враг', () => {
			this.pickTarget((e) =>
				areHostile(this.deps.getControlled().team, e.team) && e.targetable
			);
		}));
		row.addChild(this.button('Торговец', () => this.pickTarget((e) => e instanceof Trader)));
		row.addChild(this.button('Медик', () => this.pickTarget((e) => e instanceof Medic)));
		row.addChild(this.button('Алтарь', () => this.pickTarget((e) => e instanceof Altar)));
		row.addChild(this.button('Босс', () =>
			this.pickTarget((e) => e instanceof DeclarativeEntity && !!e.definition.boss)
		));
		row.addChild(this.button('След. >', () => {
			const all = this.deps.entityWorld.all;
			if (all.length === 0) return;
			const idx = this.target ? all.indexOf(this.target) : -1;
			this.target = all[(idx + 1) % all.length];
			this.commit();
		}));
		return row;
	}

	/** Строка вкладок. */
	private tabRow(): HorizontalLayout {
		const row = new HorizontalLayout();
		row.spacing = 6;
		const tabs: [AdminTab, string][] = [
			['entity', 'Сущность'],
			['gear', 'Снаряжение'],
			['world', 'Мир'],
			['teleport', 'Телепорт'],
		];
		for (const [id, title] of tabs) {
			row.addChild(this.button(id === this.tab ? `» ${title}` : title, () => {
				this.tab = id;
				this.commit();
			}, 110));
		}
		return row;
	}

	// ==================== ВКЛАДКА: СУЩНОСТЬ ====================

	 /** Параметры выбранной сущности: HP, скорость, флаги, профиль ИИ. */
	private buildEntityTab(layout: VerticalLayout): void {
		const e = this.subject;
		const info = new Label(
			`${this.entityName(e)} — HP ${Math.ceil(e.getHP())}/${e.maxHP}, ` +
			`скорость ${e.speed.toFixed(2)}, команда «${e.team}», ` +
			`(${Math.round(e.x)}, ${Math.round(e.y)})` +
			(e.invulnerable ? ' [неуязвима]' : ''),
			660
		);
		layout.addChild(info);

		layout.addChild(this.stepperRow(`HP: ${Math.ceil(e.getHP())}`,
			() => e.setHP(e.getHP() - 25),
			() => e.setHP(e.getHP() + 25)));
		layout.addChild(this.stepperRow(`Макс. HP: ${e.maxHP}`,
			() => {
				e.maxHP = Math.max(1, e.maxHP - 25);
				e.setHP(e.getHP());
			},
			() => {
				e.maxHP += 25;
			}));
		layout.addChild(this.stepperRow(`Скорость: ${e.speed.toFixed(2)}`,
			() => { e.speed = Math.max(0.2, e.speed - 0.2); },
			() => { e.speed += 0.2; }));

		const flags = new HorizontalLayout();
		flags.spacing = 6;
		flags.addChild(this.button(`Неуязвимость: ${e.invulnerable ? 'вкл' : 'выкл'}`, () => {
			e.invulnerable = !e.invulnerable;
			this.commit();
		}));
		flags.addChild(this.button(`Целеуказ.: ${e.targetable ? 'да' : 'нет'}`, () => {
			e.targetable = !e.targetable;
			this.commit();
		}));
		flags.addChild(this.button(`Команда: ${e.team}`, () => {
			const idx = TEAMS.indexOf(e.team);
			e.team = TEAMS[(idx + 1) % TEAMS.length];
			this.commit();
		}));
		layout.addChild(flags);

		const actions = new HorizontalLayout();
		actions.spacing = 6;
		actions.addChild(this.button('Вылечить', () => {
			e.setHP(e.maxHP);
			this.status(`HP восстановлено: ${e.maxHP}`);
		}));
		actions.addChild(this.button('Убить', () => {
			e.invulnerable = false;
			e.takeDamage(999999);
			this.status('Цель убита.');
		}));
		actions.addChild(this.button('Цель ко мне', () => {
			const c = this.deps.getControlled();
			e.x = c.x + 40;
			e.y = c.y;
			e.spawnX = e.x;
			e.spawnY = e.y;
			this.status('Цель телепортирована к управляемой сущности.');
		}));
		actions.addChild(this.button('Меня к цели', () => {
			this.teleportControlled(e.x + 40, e.y);
		}));
		layout.addChild(actions);

		this.buildAiBlock(layout, e);
	}

	/** Блок живой настройки профиля ИИ (если у цели есть контроллер конвейера). */
	private buildAiBlock(layout: VerticalLayout, e: Entity): void {
		if (!(e instanceof DeclarativeEntity) || !e.controller) return;
		const controller = e.controller as { profile?: AiProfile; state?: string };
		const profile = controller.profile;
		if (!profile) return;

		const header = new Label(
			`ИИ: ${profile.kind}${controller.state ? ` (${controller.state})` : ''}`, 400
		);
		header.setColor('#fd8');
		layout.addChild(header);

		layout.addChild(this.stepperRow(`Аггро-радиус: ${profile.aggroRange ?? 500}`,
			() => { profile.aggroRange = Math.max(50, (profile.aggroRange ?? 500) - 50); },
			() => { profile.aggroRange = (profile.aggroRange ?? 500) + 50; }));
		layout.addChild(this.stepperRow(`Дальность огня: ${profile.fireRange ?? 400}`,
			() => { profile.fireRange = Math.max(50, (profile.fireRange ?? 400) - 50); },
			() => { profile.fireRange = (profile.fireRange ?? 400) + 50; }));

		if (e.controller instanceof EnemyFsmController) {
			const row = new HorizontalLayout();
			row.spacing = 6;
			row.addChild(this.button(`Архетип: ${profile.behavior ?? 'chaser'}`, () => {
				const idx = BEHAVIORS.indexOf(profile.behavior ?? 'chaser');
				profile.behavior = BEHAVIORS[(idx + 1) % BEHAVIORS.length];
				this.commit();
			}));
			row.addChild(this.button(`Поводок: ${profile.leashRange ?? 1500}`, () => {
				profile.leashRange = (profile.leashRange ?? 1500) + 250;
				this.commit();
			}));
			layout.addChild(row);
		}

		if (profile.behavior === 'kamikaze' || profile.explodeRadius !== undefined) {
			layout.addChild(this.stepperRow(`Урон взрыва: ${profile.explodeDamage ?? 18}`,
				() => { profile.explodeDamage = Math.max(1, (profile.explodeDamage ?? 18) - 5); },
				() => { profile.explodeDamage = (profile.explodeDamage ?? 18) + 5; }));
			layout.addChild(this.stepperRow(`Радиус взрыва: ${profile.explodeRadius ?? 70}`,
				() => { profile.explodeRadius = Math.max(10, (profile.explodeRadius ?? 70) - 10); },
				() => { profile.explodeRadius = (profile.explodeRadius ?? 70) + 10; }));
		}
	}

	// ==================== ВКЛАДКА: СНАРЯЖЕНИЕ ====================

	/** Выдача и настройка оружия, чипов и модификаторов цели. */
	private buildGearTab(layout: VerticalLayout): void {
		const e = this.subject;
		const inv = e.inventory;

		// --- Оружие ---
		const weapon = inv.weapon;
		const weaponLabel = new Label(
			weapon
				? `Оружие: ${weapon.name} — урон ${weapon.baseDamage}, темп ${weapon.fireRate}, ` +
					`выстрелы ${weapon.shots}, разброс ${weapon.shotSpread.toFixed(2)}, ` +
					`множитель ×${weapon.damageMultiplier.toFixed(2)}`
				: 'Оружие: нет',
			680
		);
		layout.addChild(weaponLabel);

		const weaponRow = new HorizontalLayout();
		weaponRow.spacing = 6;
		weaponRow.addChild(this.button('Оружие <', () => this.cycleWeapon(-1)));
		weaponRow.addChild(this.button('Оружие >', () => this.cycleWeapon(1)));
		layout.addChild(weaponRow);

		if (weapon) {
			layout.addChild(this.stepperRow(`Урон снаряда: ${weapon.baseDamage}`,
				() => { weapon.baseDamage = Math.max(1, weapon.baseDamage - 5); },
				() => { weapon.baseDamage += 5; }));
			layout.addChild(this.stepperRow(`Темп (кадров): ${weapon.fireRate}`,
				() => { weapon.fireRate = Math.max(2, weapon.fireRate - 5); },
				() => { weapon.fireRate += 5; }));
			layout.addChild(this.stepperRow(`Снарядов за выстрел: ${weapon.shots}`,
				() => { weapon.shots = Math.max(1, weapon.shots - 1); },
				() => { weapon.shots += 1; }));
			layout.addChild(this.stepperRow(`Разброс: ${weapon.shotSpread.toFixed(2)}`,
				() => { weapon.shotSpread = Math.max(0, weapon.shotSpread - 0.05); },
				() => { weapon.shotSpread += 0.05; }));
			layout.addChild(this.stepperRow(`Множитель урона: ×${weapon.damageMultiplier.toFixed(2)}`,
				() => { weapon.damageMultiplier = Math.max(0.25, weapon.damageMultiplier / 1.25); },
				() => { weapon.damageMultiplier *= 1.25; }));
		}

		// --- Чипы ---
		const chipNames = inv.chips
			.map((c, i) => `${i + 1}:${c ? c.name : '—'}`)
			.join('  ');
		layout.addChild(new Label(`Чипы [слот ${this.chipSlot + 1}] — ${chipNames}`, 680));

		const chipRow = new HorizontalLayout();
		chipRow.spacing = 6;
		chipRow.addChild(this.button('Слот чипа <', () => {
			this.chipSlot = (this.chipSlot + 4) % 5;
			this.commit();
		}));
		chipRow.addChild(this.button('Слот чипа >', () => {
			this.chipSlot = (this.chipSlot + 1) % 5;
			this.commit();
		}));
		chipRow.addChild(this.button('Чип <', () => this.cycleChip(-1)));
		chipRow.addChild(this.button('Чип >', () => this.cycleChip(1)));
		chipRow.addChild(this.button('Очистить слот', () => {
			inv.removeAt({ type: 'chip', index: this.chipSlot });
			this.status(`Слот чипа ${this.chipSlot + 1} очищен.`);
		}));
		layout.addChild(chipRow);

		const chip = inv.chips[this.chipSlot];
		if (chip) {
			layout.addChild(this.stepperRow(
				`Перезарядка «${chip.name}»: ${chip.cooldown ? chip.cooldown.getMaximum() : '—'}`,
				() => {
					if (chip.cooldown) {
						chip.cooldown.setDuration(Math.max(1, chip.cooldown.getMaximum() - 30));
					}
				},
				() => {
					if (chip.cooldown) {
						chip.cooldown.setDuration(chip.cooldown.getMaximum() + 30);
					}
				}
			));
			this.buildChipParams(layout, chip);
		}

		// --- Модификаторы оружия ---
		if (weapon) {
			const slots = weapon.modifierSlots;
			const modNames = slots.map((m, i) => `${i + 1}:${m ? m.name : '—'}`).join('  ');
			const safeSlot = Math.min(this.modSlot, slots.length - 1);
			layout.addChild(new Label(`Модификаторы [слот ${safeSlot + 1}] — ${modNames}`, 680));

			const modRow = new HorizontalLayout();
			modRow.spacing = 6;
			modRow.addChild(this.button('Слот мода <', () => {
				this.modSlot = (safeSlot + slots.length - 1) % slots.length;
				this.commit();
			}));
			modRow.addChild(this.button('Слот мода >', () => {
				this.modSlot = (safeSlot + 1) % slots.length;
				this.commit();
			}));
			modRow.addChild(this.button('Мод <', () => this.cycleModifier(-1)));
			modRow.addChild(this.button('Мод >', () => this.cycleModifier(1)));
			layout.addChild(modRow);

			const mod = slots[safeSlot];
			if (mod) this.buildModifierParams(layout, mod);
		}
	}

	/** Персональные параметры чипа (у каждого чипа свои поля настройки). */
	private buildChipParams(layout: VerticalLayout, chip: Chip): void {
		if (chip instanceof DashChip) {
			layout.addChild(this.stepperRow(`Множитель рывка: ×${chip.multiplier.toFixed(1)}`,
				() => { chip.multiplier = Math.max(1.1, chip.multiplier - 0.5); },
				() => { chip.multiplier += 0.5; }));
			layout.addChild(this.stepperRow(`Длительность рывка: ${chip.activeCooldown.getMaximum()}`,
				() => {
					chip.activeCooldown.setDuration(
						Math.max(5, chip.activeCooldown.getMaximum() - 5)
					);
				},
				() => { chip.activeCooldown.setDuration(chip.activeCooldown.getMaximum() + 5); }));
		} else if (chip instanceof HealChip) {
			layout.addChild(this.stepperRow(`Объём лечения: ${chip.amount}`,
				() => { chip.amount = Math.max(10, chip.amount - 50); },
				() => { chip.amount += 50; }));
		} else if (chip instanceof NovaChip) {
			layout.addChild(this.stepperRow(`Урон импульса: ${chip.damage}`,
				() => { chip.damage = Math.max(1, chip.damage - 10); },
				() => { chip.damage += 10; }));
			layout.addChild(this.stepperRow(`Радиус импульса: ${chip.radius}`,
				() => { chip.radius = Math.max(20, chip.radius - 20); },
				() => { chip.radius += 20; }));
		} else if (chip instanceof ShieldChip) {
			layout.addChild(this.stepperRow(`Длительность щита: ${chip.activeCooldown.getMaximum()}`,
				() => {
					chip.activeCooldown.setDuration(
						Math.max(10, chip.activeCooldown.getMaximum() - 30)
					);
				},
				() => {
					chip.activeCooldown.setDuration(chip.activeCooldown.getMaximum() + 30);
				}));
		} else if (chip instanceof TeleportChip) {
			layout.addChild(this.stepperRow(`Дальность прыжка: ${chip.distance}`,
				() => { chip.distance = Math.max(20, chip.distance - 50); },
				() => { chip.distance += 50; }));
		}
	}

	/** Персональные параметры модификатора. */
	private buildModifierParams(layout: VerticalLayout, mod: Modifier): void {
		if (mod instanceof DamagePlusModifier) {
			layout.addChild(this.stepperRow(`Прибавка урона: +${mod.bonus}`,
				() => { mod.bonus = Math.max(1, mod.bonus - 1); },
				() => { mod.bonus += 1; }));
		} else if (mod instanceof DamageMultModifier) {
			layout.addChild(this.stepperRow(`Множитель урона: ×${mod.factor}`,
				() => { mod.factor = Math.max(0.5, mod.factor / 2); },
				() => { mod.factor *= 2; }));
		} else if (mod instanceof MulticastModifier) {
			layout.addChild(this.stepperRow(`Копий мультикаста: ${mod.count}`,
				() => { mod.count = Math.max(2, mod.count - 1); },
				() => { mod.count += 1; }));
			layout.addChild(this.stepperRow(`Разброс мультикаста: ${mod.spread.toFixed(2)}`,
				() => { mod.spread = Math.max(0, mod.spread - 0.1); },
				() => { mod.spread += 0.1; }));
		} else if (mod instanceof SinusoidalModifier) {
			layout.addChild(this.stepperRow(`Амплитуда волны: ${mod.amplitude}`,
				() => { mod.amplitude = Math.max(2, mod.amplitude - 4); },
				() => { mod.amplitude += 4; }));
			layout.addChild(this.stepperRow(`Частота волны: ${mod.frequency.toFixed(2)}`,
				() => { mod.frequency = Math.max(0.01, mod.frequency - 0.05); },
				() => { mod.frequency += 0.05; }));
		} else if (mod instanceof SplitModifier) {
			layout.addChild(this.stepperRow(`Копий расщепления: ${mod.count}`,
				() => { mod.count = Math.max(2, mod.count - 1); },
				() => { mod.count += 1; }));
			layout.addChild(this.stepperRow(`Разброс расщепления: ${mod.spread.toFixed(2)}`,
				() => { mod.spread = Math.max(0, mod.spread - 0.2); },
				() => { mod.spread += 0.2; }));
		}
	}

	// ==================== ВКЛАДКА: МИР ====================

	/** Кисть тайлов, регенерация чанков и смена seed. */
	private buildWorldTab(layout: VerticalLayout): void {
		const tileName = TILE_DEFS.find((d) => d.id === this.brushTile)?.name ?? '?';

		const brushRow = new HorizontalLayout();
		brushRow.spacing = 6;
		brushRow.addChild(this.button(`Тайл кисти: ${tileName}`, () => {
			const idx = TILE_DEFS.findIndex((d) => d.id === this.brushTile);
			this.brushTile = TILE_DEFS[(idx + 1) % TILE_DEFS.length].id;
			this.commit();
		}));
		brushRow.addChild(this.button(`Кисть: ${this.brush3x3 ? '3×3' : '1×1'}`, () => {
			this.brush3x3 = !this.brush3x3;
			this.commit();
		}));
		brushRow.addChild(this.button(
			`Клик по миру: ${this.clickMode === 'none' ? 'выкл' : this.clickMode === 'brush' ? 'кисть' : 'телепорт'}`,
			() => {
				this.clickMode =
					this.clickMode === 'none' ? 'brush'
					: this.clickMode === 'brush' ? 'teleport'
					: 'none';
				this.commit();
			}
		));
		layout.addChild(brushRow);

		const hint = new Label(
			'Включите «клик по миру» и щёлкните вне окна: кисть ставит тайлы, телепорт переносит героя.',
			680
		);
		hint.setColor('#999');
		layout.addChild(hint);

		const chunkRow = new HorizontalLayout();
		chunkRow.spacing = 6;
		chunkRow.addChild(this.button('Реген чанка здесь', () => {
			const c = this.deps.getControlled();
			const [cx, cy] = this.chunkOf(c.x, c.y);
			this.deps.world.regenerateChunk(cx, cy);
			this.status(`Чанк (${cx}, ${cy}) перегенерирован.`);
		}));
		chunkRow.addChild(this.button('Реген 3×3 вокруг', () => {
			const c = this.deps.getControlled();
			const [cx, cy] = this.chunkOf(c.x, c.y);
			for (let dx = -1; dx <= 1; dx++) {
				for (let dy = -1; dy <= 1; dy++) {
					this.deps.world.regenerateChunk(cx + dx, cy + dy);
				}
			}
			this.status(`Чанки вокруг (${cx}, ${cy}) перегенерированы.`);
		}));
		layout.addChild(chunkRow);

		const seedRow = new HorizontalLayout();
		seedRow.spacing = 6;
		seedRow.addChild(new Label(`Seed забега: ${this.deps.runSeed} → новый: ${this.seedEdit}`, 300));
		seedRow.addChild(this.button('Seed −', () => {
			this.seedEdit -= 1;
			this.commit();
		}));
		seedRow.addChild(this.button('Seed +', () => {
			this.seedEdit += 1;
			this.commit();
		}));
		seedRow.addChild(this.button('Seed +100', () => {
			this.seedEdit += 100;
			this.commit();
		}));
		seedRow.addChild(this.button('Случайный seed', () => {
			this.seedEdit = (Math.random() * 2_000_000 - 1_000_000) | 0;
			this.commit();
		}));
		layout.addChild(seedRow);

		layout.addChild(this.button('Перезапустить полигон с новым seed', () => {
			this.deps.restartWithSeed(this.seedEdit);
		}, 340));
	}

	// ==================== ВКЛАДКА: ТЕЛЕПОРТ ====================

	/** Поиск ближайших NPC/врагов и прыжки по регионам. */
	private buildTeleportTab(layout: VerticalLayout): void {
		const searchRow = new HorizontalLayout();
		searchRow.spacing = 6;
		searchRow.addChild(this.button('К торговцу', () => this.jumpTo((e) => e instanceof Trader, 'Торговец')));
		searchRow.addChild(this.button('К медику', () => this.jumpTo((e) => e instanceof Medic, 'Медик')));
		searchRow.addChild(this.button('К костру', () => this.jumpTo((e) => e instanceof Campfire, 'Костёр')));
		layout.addChild(searchRow);

		const searchRow2 = new HorizontalLayout();
		searchRow2.spacing = 6;
		searchRow2.addChild(this.button('К алтарю', () => this.jumpTo((e) => e instanceof Altar, 'Алтарь')));
		searchRow2.addChild(this.button('К боссу', () =>
			this.jumpTo((e) => e instanceof DeclarativeEntity && !!e.definition.boss, 'Босс')
		));
		searchRow2.addChild(this.button('К врагу', () =>
			this.jumpTo(
				(e) => areHostile(this.deps.getControlled().team, e.team) && e.targetable,
				'Враг'
			)
		));
		layout.addChild(searchRow2);

		const regionHeader = new Label('Прыжок в центр региона:', 400);
		regionHeader.setColor('#fd8');
		layout.addChild(regionHeader);

		let column: HorizontalLayout | null = null;
		let count = 0;
		for (const id of REGION_ORDER) {
			const def = REGION_DEFINITIONS[id];
			if (!def.rect) continue;
			if (count % 3 === 0) {
				column = new HorizontalLayout();
				column.spacing = 6;
				layout.addChild(column);
			}
			column?.addChild(this.button(`→ ${def.name}`, () => {
				const center = this.deps.regionCenter(id);
				if (!center) return;
				this.teleportControlled(center.x, center.y);
				this.status(`Прыжок в регион «${def.name}».`);
			}, 150));
			count++;
		}

		layout.addChild(this.button(
			`Телепорт-клик по миру: ${this.clickMode === 'teleport' ? 'вкл' : 'выкл'}`,
			() => {
				this.clickMode = this.clickMode === 'teleport' ? 'none' : 'teleport';
				this.commit();
			},
			300
		));
	}

	// ==================== ОПЕРАЦИИ ====================

	/** Ставит управляемую сущность в точку мира (с поиском проходимого места). */
	private teleportControlled(px: number, py: number): void {
		const c = this.deps.getControlled();
		const spot = this.findPassableNear(px, py);
		c.x = spot.x;
		c.y = spot.y;
		this.status(`Телепорт в (${Math.round(spot.x)}, ${Math.round(spot.y)}).`);
	}

	/** Ищет ближайшую проходимую точку (спиралью, до 6 колец по 16 px). */
	private findPassableNear(px: number, py: number): { x: number; y: number } {
		if (this.deps.world.isPassable(px, py)) return { x: px, y: py };
		for (let ring = 1; ring <= 6; ring++) {
			const r = ring * 16;
			for (let a = 0; a < 8; a++) {
				const angle = (a / 8) * Math.PI * 2;
				const x = px + Math.cos(angle) * r;
				const y = py + Math.sin(angle) * r;
				if (this.deps.world.isPassable(x, y)) return { x, y };
			}
		}
		return { x: px, y: py };
	}

	/** Красит тайлы кистью в точке мира. */
	private paintTiles(px: number, py: number): void {
		const tileSize = this.deps.world.config.tileSize;
		const offsets = this.brush3x3 ? [-1, 0, 1] : [0];
		let painted = 0;
		for (const dx of offsets) {
			for (const dy of offsets) {
				if (this.deps.world.setTileAt(px + dx * tileSize, py + dy * tileSize, this.brushTile)) {
					painted++;
				}
			}
		}
		this.statusText = painted > 0
			? `Кисть: ${painted} тайл(ов) → «${TILE_DEFS.find((d) => d.id === this.brushTile)?.name}».`
			: 'Кисть: чанк не загружен — подойдите ближе.';
	}

	 /** Координаты чанка мировой позиции. */
	private chunkOf(px: number, py: number): [number, number] {
		const chunkPixel = this.deps.world.config.chunkSize * this.deps.world.config.tileSize;
		return [Math.floor(px / chunkPixel), Math.floor(py / chunkPixel)];
	}

	 /** Выбирает ближайшую к управляемому сущность по предикату. */
	private pickTarget(pred: (e: Entity) => boolean): void {
		const found = this.findNearest(pred);
		if (!found) {
			this.status('Не найдено ни одной подходящей сущности.');
						return;
		}
		this.target = found;
		this.status(`Цель: ${this.entityName(found)} (${Math.round(this.distanceTo(found))} px).`);
			}

	/** Телепорт управляемой сущности к ближайшей подходящей цели. */
	private jumpTo(pred: (e: Entity) => boolean, label: string): void {
		const found = this.findNearest(pred);
		if (!found) {
			this.status(`${label}: не найден в загруженных чанках.`);
						return;
		}
		const dist = this.distanceTo(found);
		this.teleportControlled(found.x + 40, found.y);
		this.status(`${label} найден в ${Math.round(dist)} px — телепорт выполнен.`);
			}

	/** Ближайшая к управляемому сущность по предикату (загруженные чанки). */
	private findNearest(pred: (e: Entity) => boolean): Entity | null {
		const c = this.deps.getControlled();
		let best: Entity | null = null;
		let bestDist = Infinity;
		for (const e of this.deps.entityWorld.all) {
			if (e === c || e.isDead() || !pred(e)) continue;
			const d = Math.hypot(e.x - c.x, e.y - c.y);
			if (d < bestDist) {
				bestDist = d;
				best = e;
			}
		}
		return best;
	}

	/** Расстояние от управляемой сущности до цели. */
	private distanceTo(e: Entity): number {
		const c = this.deps.getControlled();
		return Math.hypot(e.x - c.x, e.y - c.y);
	}

	 /** Прокрутка оружия цели по реестру предметов. */
	private cycleWeapon(dir: number): void {
		const e = this.subject;
		const current = e.inventory.weapon?.id ?? null;
		const idx = current ? WEAPON_IDS.indexOf(current) : -1;
		const next = WEAPON_IDS[(idx + dir + WEAPON_IDS.length) % WEAPON_IDS.length];
		const weapon = ITEM_DEFINITIONS[next].factory() as Weapon;
		e.inventory.replaceWeapon(weapon);
		this.status(`Выдано оружие: ${weapon.name}.`);
			}

	/** Прокрутка чипа в выбранном слоте по реестру предметов. */
	private cycleChip(dir: number): void {
		const e = this.subject;
		const current = e.inventory.chips[this.chipSlot]?.id ?? null;
		const idx = current ? CHIP_IDS.indexOf(current) : -1;
		const next = CHIP_IDS[(idx + dir + CHIP_IDS.length) % CHIP_IDS.length];
		const chip = ITEM_DEFINITIONS[next].factory() as Chip;
		e.inventory.installChip(chip, this.chipSlot);
		this.status(`В слот ${this.chipSlot + 1} установлен чип: ${chip.name}.`);
			}

	/** Прокрутка модификатора в выбранном слоте оружия по реестру. */
	private cycleModifier(dir: number): void {
		const weapon = this.subject.inventory.weapon;
		if (!weapon) return;
		const slots = weapon.modifierSlots;
		const slot = Math.min(this.modSlot, slots.length - 1);
		const current = slots[slot]?.id ?? null;
		const idx = current ? MODIFIER_IDS.indexOf(current) : -1;
		const next = MODIFIER_IDS[(idx + dir + MODIFIER_IDS.length) % MODIFIER_IDS.length];
		const mod = ITEM_DEFINITIONS[next].factory() as Modifier;
		this.subject.inventory.installModifier(mod, slot);
		this.status(`В слот ${slot + 1} установлен модификатор: ${mod.name}.`);
			}

	/** Человекочитаемое имя сущности (устойчиво к минификации имён классов). */
	private entityName(e: Entity): string {
		if (e instanceof DeclarativeEntity) {
			return `${e.definition.name} [${e.definition.id}]`;
		}
		if (e instanceof Trader) return 'Торговец';
		if (e instanceof Medic) return 'Медик';
		if (e instanceof Altar) return 'Алтарь';
		if (e instanceof Campfire) return 'Костёр';
		if (e instanceof Player) return 'Игрок';
		return e.constructor.name;
	}

	/** Устанавливает статус и пересобирает окно. */
	private status(text: string): void {
		this.statusText = text;
		this.commit();
	}

	/** Фабрика кнопок панели. */
	private button(text: string, onClick: () => void, width = 100): Button {
		const btn = new Button(text, width, 26);
		btn.setOnClick(onClick);
		return btn;
	}

	/** Строка «подпись + минус/плюс» для числовых параметров. */
	private stepperRow(title: string, dec: () => void, inc: () => void): HorizontalLayout {
		const row = new HorizontalLayout();
		row.spacing = 8;
		row.addChild(new Label(title, 340));
		const minus = new Button('−', 34, 24);
		minus.setOnClick(() => {
			dec();
			this.commit();
		});
		row.addChild(minus);
		const plus = new Button('+', 34, 24);
		plus.setOnClick(() => {
			inc();
			this.commit();
		});
		row.addChild(plus);
		return row;
	}
}
