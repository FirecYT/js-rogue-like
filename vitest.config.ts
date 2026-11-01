import { defineConfig } from 'vitest/config';

/**
 * Конфигурация vitest: юнит-тесты чистых сервисов в node-окружении
 * с in-memory-заглушкой localStorage (tests/setup.ts).
 */
export default defineConfig({
	test: {
		environment: 'node',
		include: ['tests/**/*.test.ts'],
		setupFiles: ['tests/setup.ts'],
	},
});
