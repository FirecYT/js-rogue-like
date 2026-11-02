import {
	ENTITY_DEFINITIONS,
	type EntityDefinition,
} from '../content/entities/definitions';
import {
	ITEM_DEFINITIONS,
	type ItemJournalDefinition,
} from '../content/items/definitions';
import {
	REGION_DEFINITIONS,
	REGION_ORDER,
} from '../content/regions/definitions';
import { loadMeta, saveMeta, type MetaState } from './MetaStorage';

/** Статическая запись журнала о торговце (не сущность конвейера). */
export const TRADER_JOURNAL = {
	id: 'n:trader',
	name: 'Руинный торговец',
	description:
		'Молчаливый меновщик из домов восстановителей: раскладывает прилавок из трёх предметов и меняет их строго «предмет на предмет». Денег не признаёт: после падения пустоты валютой снова стали вещи.',
};

/** Запись списка журнала с категорией. */
export interface JournalEntry {
	id: string;
	name: string;
	description: string;
	category: 'enemy' | 'boss' | 'npc' | 'item' | 'region';
}

/**
 * Журнал мира (в духе Risk of Rain 2): записи о врагах, боссах, NPC и
 * предметах открываются по встрече/подбору и хранятся между забегами.
 */
export class JournalService {
	private readonly meta: MetaState;
	private readonly unlocked: Set<string>;
	private readonly fresh: Set<string>;

	constructor() {
		this.meta = loadMeta();
		this.unlocked = new Set(this.meta.journal);
		this.fresh = new Set(this.meta.journalNew);
	}

	/**
	 * Открывает запись журнала (идемпотентно).
	 * @param id - Id записи с префиксом категории (e:/i:/n:)
	 */
	unlock(id: string): void {
		if (this.unlocked.has(id)) return;
		this.unlocked.add(id);
		this.fresh.add(id);
		this.meta.journal = [...this.unlocked];
		this.meta.journalNew = [...this.fresh];
		saveMeta(this.meta);
	}

	/**
	 * Помечает запись прочитанной (снимает метку «Новое»).
	 * @param id - Id записи
	 */
	markRead(id: string): void {
		if (!this.fresh.has(id)) return;
		this.fresh.delete(id);
		this.meta.journalNew = [...this.fresh];
		saveMeta(this.meta);
	}

	/**
	 * Не прочитана ли запись в журнале (метка «Новое»).
	 * @param id - Id записи
	 * @returns true, если запись открыта, но ещё не прочитана
	 */
	isNew(id: string): boolean {
		return this.fresh.has(id);
	}

	/**
	 * Открыта ли запись.
	 * @param id - Id записи
	 * @returns true, если запись открыта
	 */
	isUnlocked(id: string): boolean {
		return this.unlocked.has(id);
	}

	/** Открывает запись врага/босса/NPC из определений конвейера. */
	unlockEntity(defId: string): void {
		const def = ENTITY_DEFINITIONS[defId];
		if (def?.journal) this.unlock(`${def.journal === 'npc' ? 'n' : 'e'}:${defId}`);
	}

	/** Открывает запись предмета. */
	unlockItem(itemId: string): void {
		if (ITEM_DEFINITIONS[itemId]) this.unlock(`i:${itemId}`);
	}

	/** Открывает запись региона (при первом посещении). */
	unlockRegion(regionId: string): void {
		if (REGION_DEFINITIONS[regionId]) this.unlock(`r:${regionId}`);
	}

	/**
	 * Открытые id записей (для смоук-тестов и отладки).
	 * @returns Массив открытых id
	 */
	getUnlocked(): string[] {
		return [...this.unlocked];
	}

	/**
	 * Список записей категории (открытые и закрытые).
	 * @param category - Категория журнала
	 * @returns Записи с флагом открытия
	 */
	entries(
		category: 'enemy' | 'boss' | 'npc' | 'item' | 'region'
	): (JournalEntry & { unlocked: boolean })[] {
		const result: (JournalEntry & { unlocked: boolean })[] = [];
		if (category === 'region') {
			for (const id of REGION_ORDER) {
				const def = REGION_DEFINITIONS[id];
				result.push({
					id: `r:${def.id}`,
					name: def.name,
					description: def.description,
					category: 'region',
					unlocked: this.isUnlocked(`r:${def.id}`),
				});
			}
			return result;
		}
		if (category === 'item') {
			for (const def of Object.values(ITEM_DEFINITIONS) as ItemJournalDefinition[]) {
				result.push({
					id: `i:${def.id}`,
					name: def.name,
					description: def.description,
					category: 'item',
					unlocked: this.isUnlocked(`i:${def.id}`),
				});
			}
			return result;
		}
		for (const def of Object.values(ENTITY_DEFINITIONS) as EntityDefinition[]) {
			if (def.journal !== category) continue;
			result.push({
				id: `${category === 'npc' ? 'n' : 'e'}:${def.id}`,
				name: def.name,
				description: def.description ?? '',
				category,
				unlocked: this.isUnlocked(`${category === 'npc' ? 'n' : 'e'}:${def.id}`),
			});
		}
		if (category === 'npc') {
			result.push({
				...TRADER_JOURNAL,
				category: 'npc',
				unlocked: this.isUnlocked(TRADER_JOURNAL.id),
			});
		}
		return result;
	}
}
