import type { EntityWorld } from '../core/EntityWorld';
import type { Pathfinder } from './Pathfinder';
import type { JournalService } from './JournalService';
import type { EffectSystem } from '../systems/EffectSystem';
import type Entity from '../entities/Entity';
import { DeclarativeEntity } from '../entities/DeclarativeEntity';
import { EnemyFsmController } from '../controllers/EnemyFsmController';
import { WormController } from '../controllers/WormController';
import { TurretController } from '../controllers/TurretController';
import { SettlerController } from '../controllers/SettlerController';
import { FollowerController } from '../controllers/FollowerController';
import {
	getEntityDefinition,
	type EntityDefinition,
} from '../content/entities/definitions';

/**
 * Конвейер сущностей: собирает Entity из декларативного определения.
 * Единая точка создания врагов и боссов: характеристики, внешность, ИИ,
 * снаряжение и тело босса описаны данными в реестре определений.
 */
export class EntityFactory {
	/**
	 * @param entityWorld - Контейнер сущностей: созданные сущности спавнятся в него
	 * @param pathfinder - Поиск пути для контроллеров-преследователей
	 * @param getTarget - Функция получения текущей цели (управляемая сущность)
	 */
	constructor(
		private readonly entityWorld: EntityWorld,
		private readonly pathfinder: Pathfinder,
		private readonly getTarget: () => Entity,
		private readonly journal?: JournalService,
		private readonly effectSystem?: EffectSystem
	) {}

	/**
	 * Создаёт и спавнит сущность из определения.
	 * @param defId - Идентификатор определения в реестре
	 * @param x - Мировая координата X
	 * @param y - Мировая координата Y
	 * @returns Созданная сущность
	 */
	spawn(defId: string, x: number, y: number): DeclarativeEntity {
		const definition = getEntityDefinition(defId);
		const entity = new DeclarativeEntity(definition, x, y);

		this.applyLoadout(entity, definition);
		entity.controller = this.createController(definition, entity);

		// Журнал: встреча с сущностью рядом с игроком открывает запись
		if (this.journal && definition.journal) {
			const target = this.getTarget();
			if (Math.hypot(target.x - x, target.y - y) < 900) {
				this.journal.unlockEntity(definition.id);
			}
		}

		this.entityWorld.spawn(entity);
		return entity;
	}

	/**
	 * Создаёт босса целиком: голова плюс цепочка сегментов тела.
	 * Сегменты следуют за предыдущим звеном и гибнут вместе с головой.
	 * @param defId - Идентификатор определения босса
	 * @param x - Мировая координата головы
	 * @param y - Мировая координата головы
	 * @returns Голова босса
	 */
	spawnBoss(defId: string, x: number, y: number): DeclarativeEntity {
		const definition = getEntityDefinition(defId);
		const head = this.spawn(defId, x, y);

		const boss = definition.boss;
		if (!boss || boss.segments <= 0) return head;

		const segmentDefId = boss.segmentDef ?? `${defId}_segment`;
		const gap = boss.segmentGap ?? 24;

		const chain: Entity[] = [head];
		for (let i = 0; i < boss.segments; i++) {
			const leaderIndex = chain.length - 1;
			const segment = this.spawn(
				segmentDefId,
				x - gap * (i + 1),
				y
			);
			segment.controller = new FollowerController(
				() => chain[leaderIndex] ?? null,
				gap
			);
			chain.push(segment);
		}

		return head;
	}

	/**
	 * Применяет снаряжение определения: оружие, замещающие заклинания очереди, чипы.
	 * @param entity - Целевая сущность
	 * @param definition - Определение сущности
	 */
	private applyLoadout(
		entity: DeclarativeEntity,
		definition: EntityDefinition
	): void {
		const loadout = definition.loadout;
		if (!loadout) return;

		if (loadout.weapon) {
			entity.inventory.setWeapon(loadout.weapon());
		}
		if (loadout.modifiers) {
			const slots = entity.inventory.weapon?.modifierSlots;
			if (slots) {
				loadout.modifiers().forEach((modifier, i) => {
					if (i < slots.length) slots[i] = modifier;
				});
			}
		}
		for (const chipFactory of loadout.chips ?? []) {
			entity.inventory.addChip(chipFactory());
		}
	}

	/**
	 * Создаёт контроллер по профилю поведения определения.
	 * @param definition - Определение сущности
	 * @param entity - Создаваемая сущность (для контекста контроллера)
	 * @returns Контроллер или null (статичные и следующие сущности)
	 */
	private createController(definition: EntityDefinition, entity: DeclarativeEntity) {
		const ai = definition.ai;
		if (!ai) return null;

		switch (ai.kind) {
			case 'enemy':
				return new EnemyFsmController(
					this.getTarget,
					this.pathfinder,
					ai,
					this.effectSystem
				);
			case 'worm':
				return new WormController(this.getTarget, ai);
			case 'turret':
				return new TurretController(this.getTarget, ai);
			case 'settler':
				return new SettlerController((entity.x | 0) ^ (entity.y | 0));
			case 'follower':
			case 'stationary':
				// Сегменты связываются фабрикой, статичные сущности без поведения
				return null;
		}
	}
}
