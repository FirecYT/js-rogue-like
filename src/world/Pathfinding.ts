// world/Pathfinding.ts
import { WorldManager } from "./WorldManager";

interface Node {
	x: number;
	y: number;
	g: number;
	h: number;
	f: number;
	parent?: Node;
}

export class Pathfinder {
	static findPath(
		startWorldX: number,
		startWorldY: number,
		targetWorldX: number,
		targetWorldY: number,
		worldManager: WorldManager
	): { x: number, y: number }[] {
		const start = worldManager.worldToGrid(startWorldX, startWorldY);
		const target = worldManager.worldToGrid(targetWorldX, targetWorldY);

		if (!start || !target) {
			console.log('No start or target grid position');
			return [];
		}

		const openSet: Node[] = [];
		const closedSet = new Set<string>();

		const startNode: Node = {
			x: start.globalTileX,
			y: start.globalTileY,
			g: 0,
			h: this.heuristic(start.globalTileX, start.globalTileY, target.globalTileX, target.globalTileY),
			f: 0
		};
		startNode.f = startNode.g + startNode.h;

		openSet.push(startNode);

		while (openSet.length > 0) {
			let currentNode = openSet[0];
			let currentIndex = 0;

			for (let i = 1; i < openSet.length; i++) {
				if (openSet[i].f < currentNode.f) {
					currentNode = openSet[i];
					currentIndex = i;
				}
			}

			if (currentNode.x === target.globalTileX && currentNode.y === target.globalTileY) {
				return this.buildPath(currentNode, worldManager);
			}

			openSet.splice(currentIndex, 1);
			closedSet.add(`${currentNode.x},${currentNode.y}`);

			const neighbors = worldManager.getPassableNeighbors(currentNode.x, currentNode.y);

			for (const neighborPos of neighbors) {
				if (closedSet.has(`${neighborPos.x},${neighborPos.y}`)) continue;

				const gScore = currentNode.g + 1;

				let neighborNode = openSet.find(n => n.x === neighborPos.x && n.y === neighborPos.y);

				if (!neighborNode) {
					neighborNode = {
						x: neighborPos.x,
						y: neighborPos.y,
						g: gScore,
						h: this.heuristic(neighborPos.x, neighborPos.y, target.globalTileX, target.globalTileY),
						f: 0
					};
					neighborNode.f = neighborNode.g + neighborNode.h;
					neighborNode.parent = currentNode;
					openSet.push(neighborNode);
				} else if (gScore < neighborNode.g) {
					neighborNode.g = gScore;
					neighborNode.f = neighborNode.g + neighborNode.h;
					neighborNode.parent = currentNode;
				}
			}
		}

		return [];
	}

	private static heuristic(x1: number, y1: number, x2: number, y2: number): number {
		return Math.abs(x1 - x2) + Math.abs(y1 - y2);
	}

	private static buildPath(endNode: Node, worldManager: WorldManager): { x: number, y: number }[] {
		const path: { x: number, y: number }[] = [];
		let currentNode: Node | undefined = endNode;

		while (currentNode) {
			const worldPos = worldManager.gridToWorld(currentNode.x, currentNode.y);
			path.unshift({
				x: worldPos.x + 25,
				y: worldPos.y + 25
			});
			currentNode = currentNode.parent;
		}

		return path;
	}
}
