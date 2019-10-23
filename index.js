const { readFileSync } = require('fs');
const yaml = require('js-yaml');

const app = require('./src/app');
const logger = require('./src/logger');

const main = async (config) => {
  for (let label in config) {
    logger.info('***' + label + '***');    
    await app.backupToDestination(config[label]);
  }
};

module.exports = main;
