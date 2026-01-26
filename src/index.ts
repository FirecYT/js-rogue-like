import { Game } from './core/Game';

async function main() {
  try {
    const game = new Game('#canvas');
    await game.initialize();
    game.run();
  } catch (error) {
    console.error('Failed to initialize game:', error);
  }
}

window.addEventListener('load', main);
