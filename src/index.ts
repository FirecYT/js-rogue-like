import { GameFactory } from './core/GameFactory';
import { parseBootOptions } from './core/BootOptions';

const game = await GameFactory.create(parseBootOptions());
game.start();

window.addEventListener('beforeunload', () => game.dispose());
