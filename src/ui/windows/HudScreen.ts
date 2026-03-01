import { Component } from '../Component';
import MouseInput from '../../components/MouseInput';
import Engine from '../../components/Engine';
import { PlayerProgression } from '../../systems/PlayerProgression';
import Entity from '../../entities/Entity';
import { HorizontalLayout } from '../containers/HorizontalLayout';
import { ItemSlot } from '../components/ItemSlot';
import { VerticalLayout } from '../containers/VerticalLayout';
import { Label } from '../components/Label';
import { PickupItem } from '../../entities/PickupItem';

/**
 * HUD: полоса опыта сверху, полоса здоровья и чипы справа внизу, оружие и модификаторы слева внизу.
 */
export class HudScreen extends Component {
	private engine: Engine;
	private getControlledEntity: () => Entity;
	private playerProgression: PlayerProgression | null = null;

	private weaponBar: HorizontalLayout;
	private chipsBar: VerticalLayout;
	private hpBarContainer: VerticalLayout;

	private weaponSlot: ItemSlot | null = null;
	private modifierSlots: ItemSlot[] = [];

	private readonly CHIP_SIZE = 50;
	private readonly WEAPON_SLOT_WIDTH = 80;
	private readonly WEAPON_SLOT_HEIGHT = 60;
	private readonly MODIFIER_SLOT_SIZE = 50;
	private readonly HP_BAR_WIDTH = 12;
	private readonly EXP_BAR_HEIGHT = 6;

	private lastWeaponId: string | null = null;
	private lastModifierCount = 0;

	private getPickupInRange: (() => PickupItem | null) | null = null;
	private readonly pickupHintLabel = new Label('[E] Подобрать');

	constructor(engine: Engine, getControlledEntity: () => Entity) {
		super();
		this.engine = engine;
		this.getControlledEntity = getControlledEntity;

		this.weaponBar = new HorizontalLayout();
		this.weaponBar.spacing = 8;

		this.hpBarContainer = new VerticalLayout();
		this.hpBarContainer.spacing = 10;
		this.hpBarContainer.padding = { top: 10, right: 10, bottom: 10, left: 10 };

		this.chipsBar = new VerticalLayout();
		this.chipsBar.spacing = 5;
		this.hpBarContainer.addChild(this.chipsBar);

		for (let i = 0; i < 5; i++) {
			const slot = new ItemSlot(this.CHIP_SIZE, this.CHIP_SIZE);
			this.chipsBar.addChild(slot);
		}
	}

	/**
	 * Устанавливает систему прогресса игрока (для полосы опыта).
	 * @param progression - PlayerProgression
	 */
	setPlayerProgression(progression: PlayerProgression): void {
		this.playerProgression = progression;
	}

	/**
	 * Устанавливает геттер для пикапа в радиусе (для подсказки подбора).
	 */
	setPickupInRangeGetter(getter: () => PickupItem | null): void {
		this.getPickupInRange = getter;
	}

	/**
	 * Обновляет панели оружия, модификаторов и чипов, позиции контейнеров и состояние мыши.
	 * @param mouse - Состояние мыши
	 */
	update(mouse: MouseInput): void {
		const entity = this.getControlledEntity();
		if (!entity) return;

		this.updateWeaponBar(entity);

		const chipSlots = this.chipsBar.children as ItemSlot[];
		for (let i = 0; i < Math.min(chipSlots.length, entity.inventory.chips.length); i++) {
			chipSlots[i].setItem(entity.inventory.chips[i]);
		}

		this.weaponBar.x = 10;
		this.weaponBar.y = this.engine.canvas.height - 80;
		this.weaponBar.update(mouse, this.weaponBar.x, this.weaponBar.y);
		this.hpBarContainer.x = this.engine.canvas.width - this.hpBarContainer.width - 10;
		this.hpBarContainer.y = this.engine.canvas.height - this.hpBarContainer.height - 10;
		this.hpBarContainer.update(mouse, this.hpBarContainer.x, this.hpBarContainer.y);
	}

	/**
	 * Пересоздаёт или обновляет слоты оружия и модификаторов в зависимости от инвентаря.
	 * @param entity - Управляемая сущность
	 */
	private updateWeaponBar(entity: Entity): void {
		const currentWeapon = entity.inventory.weapon;
		const currentModifiers = entity.inventory.modifiers;

		const weaponChanged = currentWeapon?.id !== this.lastWeaponId;
		const modifiersCountChanged = currentModifiers.length !== this.lastModifierCount;

		if (weaponChanged || modifiersCountChanged) {
			this.weaponBar.children = [];
			this.modifierSlots = [];

			if (currentWeapon) {
				this.weaponSlot = new ItemSlot(
					this.WEAPON_SLOT_WIDTH,
					this.WEAPON_SLOT_HEIGHT,
					currentWeapon
				);
				this.weaponBar.addChild(this.weaponSlot);
				this.lastWeaponId = currentWeapon.id;
			} else {
				this.weaponSlot = null;
				this.lastWeaponId = null;
			}

			for (const modifier of currentModifiers) {
				const modSlot = new ItemSlot(
					this.MODIFIER_SLOT_SIZE,
					this.MODIFIER_SLOT_SIZE,
					modifier
				);
				this.weaponBar.addChild(modSlot);
				this.modifierSlots.push(modSlot);
			}

			this.lastModifierCount = currentModifiers.length;
		} else {
			if (this.weaponSlot && currentWeapon) {
				this.weaponSlot.setItem(currentWeapon);
			}

			for (let i = 0; i < this.modifierSlots.length; i++) {
				this.modifierSlots[i].setItem(currentModifiers[i]);
			}
		}
	}

	/**
	 * Отрисовывает полосу опыта, полосу здоровья с чипами и панель оружия/модификаторов.
	 * @param ctx - Контекст канваса
	 */
	render(ctx: CanvasRenderingContext2D): void {
		const entity = this.getControlledEntity();
		if (!entity) return;

		this.renderExperienceBar(ctx);
		this.renderHealthBar(ctx, entity);
		this.weaponBar.render(ctx, 0, 0);

		const pickup = this.getPickupInRange?.();
		if (pickup && !pickup.isDead()) {
			this.pickupHintLabel.x = Math.floor(this.engine.canvas.width / 2 - this.pickupHintLabel.width / 2);
			this.pickupHintLabel.y = this.engine.canvas.height - 90;
			this.pickupHintLabel.render(ctx, 0, 0);
		}
	}

	/**
	 * Рисует полосу опыта вверху экрана.
	 * @param ctx - Контекст канваса
	 */
	private renderExperienceBar(ctx: CanvasRenderingContext2D): void {
		if (!this.playerProgression) return;

		const width = this.engine.canvas.width;
		const height = this.EXP_BAR_HEIGHT;
		const y = 0;

		const gradientBg = ctx.createLinearGradient(0, y, width, y);
		gradientBg.addColorStop(0, '#1a3a1a');
		gradientBg.addColorStop(1, '#0a2a0a');
		ctx.fillStyle = gradientBg;
		ctx.fillRect(0, y, width, height);

		const progress = this.playerProgression.experience / this.playerProgression.experienceToNext;
		const progressWidth = width * progress;

		const gradientProgress = ctx.createLinearGradient(0, y, progressWidth, y);
		gradientProgress.addColorStop(0, '#4caf50');
		gradientProgress.addColorStop(1, '#8bc34a');
		ctx.fillStyle = gradientProgress;
		ctx.fillRect(0, y, progressWidth, height);
	}

	/**
	 * Рисует вертикальную полосу здоровья и контейнер чипов справа внизу.
	 * @param ctx - Контекст канваса
	 * @param entity - Сущность (HP)
	 */
	private renderHealthBar(ctx: CanvasRenderingContext2D, entity: Entity): void {
		const hp = entity.getHP();
		const maxHp = entity.maxHP;
		const hpPercent = hp / maxHp;

		const barWidth = this.HP_BAR_WIDTH;
		const barHeight = this.chipsBar.height + this.hpBarContainer.padding.top + this.hpBarContainer.padding.bottom;
		const x = this.hpBarContainer.x;
		const y = this.hpBarContainer.y;

		ctx.fillStyle = '#1a0a0a';
		ctx.fillRect(x - barWidth - 15, y, barWidth, barHeight);

		const progressHeight = barHeight * hpPercent;

		const gradientHp = ctx.createLinearGradient(
			x - barWidth - 15,
			y + barHeight - progressHeight,
			x - 15,
			y + barHeight
		);

		if (hpPercent > 0.6) {
			gradientHp.addColorStop(0, '#4caf50');
			gradientHp.addColorStop(1, '#8bc34a');
		} else if (hpPercent > 0.3) {
			gradientHp.addColorStop(0, '#ff9800');
			gradientHp.addColorStop(1, '#ffc107');
		} else {
			gradientHp.addColorStop(0, '#f44336');
			gradientHp.addColorStop(1, '#e91e63');
		}

		ctx.fillStyle = gradientHp;
		ctx.fillRect(
			x - barWidth - 15,
			y + barHeight - progressHeight,
			barWidth,
			progressHeight
		);

		this.chipsBar.render(ctx, x, y);
	}
}
