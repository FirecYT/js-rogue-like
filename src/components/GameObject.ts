export default abstract class GameObject {
    constructor(public x: number, public y: number) {}

    abstract update(): void;
    abstract render(ctx: CanvasRenderingContext2D): void;
}
