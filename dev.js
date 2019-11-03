/* Deprecated */
const { readFileSync } = require('fs');
const yaml = require('js-yaml');

const { backup } = require('./src/app');
const logger = require('./src/logger');

const main = async (config) => {
  for (let label in config) {
    logger.info('***' + label + '***');    
    await backup(config[label]);
  }
};

if (process.argv.length < 3) {
  logger.error('Configuration file is a required argument.');
  process.exit(1);
}

const configfile = process.argv[2]

let config;
try {
  config = yaml.safeLoad(readFileSync(configfile, 'utf8'));
} catch (e) {
  logger.error('Cannot load config file', e);
  process.exit(1);
}
main(config);