import Entity from './Entity';
import type { HasPosition } from '../types/EntityTraits';
import type { Interactable } from '../types/Interactable';
import type { EntityFactory } from '../services/EntityFactory';
import { getEntityDefinition } from '../content/entities/definitions';
import { eventBus } from '../events/EventBus';

/**
 * Алтарь руин: одноразовая точка призыва босса. Взаимодействие клавишей
 * действия пробуждает хранителя руин: фабрика собирает босса из декларативного
 * определения, а катсцена объявляет его титул.
 *
 * Алтари — часть генерации руин в забеге (см. DESIGN.md): каждый алтарь
 * хранит id босса из реестра, поэтому новые боссы не требуют новых алтарей.
 */
export class Altar extends Entity implements HasPosition, Interactable {
	public readonly interactLabel = 'Пробудить хранителя руин';
	/** Алтарь не удаляется очисткой мёртвых и не может быть атакован. */
	public readonly persistent: boolean = true;

	private summoned = false;

	/**
	 * @param x - Мировая координата X
	 * @param y - Мировая координата Y
	 * @param bossDefId - Идентификатор определения босса в реестре
	 * @param factory - Конвейер сущностей для сборки босса
	 */
	constructor(
		x: number,
		y: number,
		private readonly bossDefId: string,
		private readonly factory: EntityFactory
	) {
		super(x, y, 1);
		this.team = 'neutral';
		this.targetable = false;
		this.solid = true;
		this.width = 20;
		this.height = 20;
	}

	/**
	 * Призывает босса рядом с алтарём (однократно) и запускает катсцену.
	 * @param _actor - Сущность, совершившая взаимодействие
	 */
	interact(_actor: Entity): void {
		if (this.summoned) return;
		this.summoned = true;

		const definition = getEntityDefinition(this.bossDefId);
		this.factory.spawnBoss(this.bossDefId, this.x + 90, this.y);

		const lines =
			definition.boss?.summonLines ??
			[
				'Земля дрожит: печати алтаря сорваны.',
				`${definition.boss?.title ?? definition.name} пробуждён.`,
				'Древняя вражда кланов получила нового хранителя.',
			];
		eventBus.emit('cutsceneStart', { lines });
	}

	/**
	 * Отрисовка: каменная стела с руной; горящая руна гаснет после призыва.
	 * @param ctx - Контекст канваса
	 */
	render(ctx: CanvasRenderingContext2D): void {
		ctx.fillStyle = '#4b5563';
		ctx.fillRect(this.x - 10, this.y - 14, 20, 28);
		ctx.strokeStyle = '#1f2937';
		ctx.lineWidth = 2;
		ctx.strokeRect(this.x - 10, this.y - 14, 20, 28);

		ctx.beginPath();
		ctx.arc(this.x, this.y, 6, 0, Math.PI * 2);
		ctx.fillStyle = this.summoned ? '#111827' : '#dc2626';
		ctx.fill();
		if (!this.summoned) {
			ctx.strokeStyle = '#f87171';
			ctx.lineWidth = 1;
			ctx.stroke();
		}
	}
}
