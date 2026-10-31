import { GameFactory } from './core/GameFactory';

const game = await GameFactory.create();
game.start();

window.addEventListener('beforeunload', () => game.dispose());
