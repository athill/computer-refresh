const { readFileSync } = require('fs');
const yaml = require('js-yaml');

const { backup } = require('./src/app');
const logger = require('./src/logger');

const main = async (config) => {
  for (let label in config) {
    logger.info('***' + label + '***');    
    await app.backup(config[label]);
  }
};

module.exports = main;
