import type { Item } from '../../items/Item';
import { PistolWeapon } from '../../items/weapons/PistolWeapon';
import { LaserGunWeapon } from '../../items/weapons/LaserGunWeapon';
import { ShotgunWeapon } from '../../items/weapons/ShotgunWeapon';
import { FlamethrowerWeapon } from '../../items/weapons/FlamethrowerWeapon';
import { RocketLauncherWeapon } from '../../items/weapons/RocketLauncherWeapon';
import { BossCannonWeapon } from '../../items/weapons/BossCannonWeapon';
import {
	DamagePlusModifier,
	DamageMultModifier,
	PierceModifier,
	SinusoidalModifier,
	MulticastModifier,
	ExplosiveEndModifier,
	DestructModifier,
} from '../../items/modifiers/catalog';
import { DashChip } from '../../items/chips/DashChip';
import { TeleportChip } from '../../items/chips/TeleportChip';
import { RebirthChip } from '../../items/chips/RebirthChip';

/** Вид предмета для вкладок журнала и слотов инвентаря. */
export type ItemKind = 'weapon' | 'modifier' | 'chip';

/**
 * Декларативная запись журнала/сейвов предмета: человекочитаемое имя,
 * лор-описание и фабрика нового экземпляра (id совпадает с id класса).
 */
export interface ItemJournalDefinition {
	id: string;
	kind: ItemKind;
	name: string;
	description: string;
	factory: () => Item;
}

/**
 * Реестр предметов: единая таблица для журнала, сохранений и выдачи.
 * Ключ равен id предмета.
 */
export const ITEM_DEFINITIONS: Record<string, ItemJournalDefinition> = {
	pistol: {
		id: 'pistol',
		kind: 'weapon',
		name: 'Pistol',
		description:
			'Табельный пистолет смотрителя руин: три патрона честного калибра и бесконечный запас терпения. Оружие, с которого начинает каждый вошедший в пустоту.',
		factory: () => new PistolWeapon(),
	},
	laser_gun: {
		id: 'laser_gun',
		kind: 'weapon',
		name: 'Laser Gun',
		description:
			'Лучевой излучатель стеклянных дюн: бьёт тонким лучом с перезарядкой в две секунды. Не оставляет гильз — только оплавленные точки на стенах.',
		factory: () => new LaserGunWeapon(),
	},
	shotgun: {
		id: 'shotgun',
		kind: 'weapon',
		name: 'Shotgun',
		description:
			'Обрез шахтёрского дробовика клана ржавых: ведро дроби в упор решает большинство споров о территориальной принадлежности руин.',
		factory: () => new ShotgunWeapon(),
	},
	flamethrower: {
		id: 'flamethrower',
		kind: 'weapon',
		name: 'Flamethrower',
		description:
			'Смесевый огнемёт восстановителей: выжигает грибницу плесени и всё остальное, что не успело уйти из конуса пламени.',
		factory: () => new FlamethrowerWeapon(),
	},
	rocket_launcher: {
		id: 'rocket_launcher',
		kind: 'weapon',
		name: 'Rocket Launcher',
		description:
			'Реактивный метатель бункера: один выстрел, одна стена меньше. Требует уважения к радиусу собственного поражения.',
		factory: () => new RocketLauncherWeapon(),
	},
	boss_cannon: {
		id: 'boss_cannon',
		kind: 'weapon',
		name: 'Корпусная пушка',
		description:
			'Снятая с корпуса червя корпусная пушка: тяжёлый снаряд, тяжёлая отдача, тяжёлые воспоминания у всего, что выживет после залпа.',
		factory: () => new BossCannonWeapon(),
	},
	mod_damage_plus: {
		id: 'mod_damage_plus',
		kind: 'modifier',
		name: 'Урон +3',
		description:
			'Притирочный модуль ствола: добавляет фиксированную навеску урона к каждому снаряду. Грубо, зато предсказуемо.',
		factory: () => new DamagePlusModifier(),
	},
	mod_damage_mult: {
		id: 'mod_damage_mult',
		kind: 'modifier',
		name: 'Множитель урона',
		description:
			'Компрессор заряда: умножает урон снаряда на коэффициент. Любимец тех, кто сначала стреляет, потом считает.',
		factory: () => new DamageMultModifier(),
	},
	mod_pierce: {
		id: 'mod_pierce',
		kind: 'modifier',
		name: 'Пронзание',
		description:
			'Сердечник из обломка монолита: снаряд проходит сквозь цели, поражая всех на линии. Стекло одобряет.',
		factory: () => new PierceModifier(),
	},
	mod_sinusoidal: {
		id: 'mod_sinusoidal',
		kind: 'modifier',
		name: 'Синусоида',
		description:
			'Стабилизатор-возмутитель: заставляет снаряд идти волной. Попадание становится лотереей, зато скучно не бывает.',
		factory: () => new SinusoidalModifier(),
	},
	mod_multicast: {
		id: 'mod_multicast',
		kind: 'modifier',
		name: 'Мультивыстрел',
		description:
			'Разветвитель казённой части: одно нажатие — несколько снарядов с веером расхождения. Расход патронов не комментируем.',
		factory: () => new MulticastModifier(2, 0.3),
	},
	mod_explosive_end: {
		id: 'mod_explosive_end',
		kind: 'modifier',
		name: 'Разрывной финал',
		description:
			'Контактный детонатор: снаряд завершает путь вспышкой по площади. Держите дистанцию — свою, а не чужую.',
		factory: () => new ExplosiveEndModifier(),
	},
	mod_destruct: {
		id: 'mod_destruct',
		kind: 'modifier',
		name: 'Разрушение',
		description:
			'Инженерный заряд: снаряд крошит стены и перекрытия. Иногда лучший путь через руины — прямо через руины.',
		factory: () => new DestructModifier(),
	},
	dash: {
		id: 'dash',
		kind: 'chip',
		name: 'Dash',
		description:
			'Импульсный чип рывка: короткий сверхсветовой прыжок в сторону движения. Перезарядка болезненна для конденсаторов и для преследователей.',
		factory: () => new DashChip(),
	},
	teleport: {
		id: 'teleport',
		kind: 'chip',
		name: 'Quantum Leap',
		description:
			'Чип квантового скачка: меняет владельца местами с точкой прицеливания. Побочный эффект — ощущение, что точка прицеливания тоже кое-кого поменяла.',
		factory: () => new TeleportChip(),
	},
	rebirth: {
		id: 'rebirth',
		kind: 'chip',
		name: 'Rebirth',
		description:
			'Чип переноса сознания: при смерти тела сознание переезжает в ближайшего живого носителя. Юридически это всё ещё вы. Почти.',
		factory: () => new RebirthChip(),
	},
};

/**
 * Возвращает запись журнала предмета по id.
 * @param id - Идентификатор предмета
 * @returns Запись или undefined, если предмета нет в реестре
 */
export function getItemDefinition(
	id: string
): ItemJournalDefinition | undefined {
	return ITEM_DEFINITIONS[id];
}
