import type { EntityWorld } from '../core/EntityWorld';
import type { Pathfinder } from './Pathfinder';
import type Entity from '../entities/Entity';
import { DeclarativeEntity } from '../entities/DeclarativeEntity';
import { AiController } from '../controllers/AiController';
import { WormController } from '../controllers/WormController';
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
		private readonly getTarget: () => Entity
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
		entity.controller = this.createController(definition);

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
		if (loadout.spells) {
			const queue = entity.inventory.weapon?.queue;
			if (queue) {
				loadout.spells().forEach((spell, i) => {
					if (i < queue.length) queue[i] = spell;
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
	 * @returns Контроллер или null (статичные и следующие сущности)
	 */
	private createController(definition: EntityDefinition) {
		const ai = definition.ai;
		if (!ai) return null;

		switch (ai.kind) {
			case 'chaser':
				return new AiController(this.getTarget(), this.pathfinder);
			case 'worm':
				return new WormController(this.getTarget, ai);
			case 'follower':
			case 'stationary':
				// Сегменты связываются фабрикой, статичные сущности без поведения
				return null;
		}
	}
}
