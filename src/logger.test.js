
// TODO: Figure out why env variable is not respected
// describe.skip('logger', () => {
// 	it('should default to "error"', () => {
// 		const logger = require('./logger');
// 		expect(logger.level.levelStr).toBe('ERROR');
// 	});

// 	it('should be overridable by environment variable', () => {
// 		process.env.LOG_LEVEL = 'info';
// 		const logger = require('./logger');
// 		expect(logger.level.levelStr).toBe('ERROR');
// 	});
// });