const { execSync } = require('child_process');
const { existsSync, readFileSync, readdirSync, writeFileSync } = require('fs-extra');
const { join } = require('path');
const yaml = require('js-yaml');

const { copyFilesWithStructure, fixPath, mkdir, quotePath } = require('./utils');

const log4js = require('log4js');
const logger = log4js.getLogger();
logger.level = process.env.LOG_LEVEL || 'error';


let configfile = 'config.yml';


const handleBackupMapping = async (mapping, destination) => {
  const from = fixPath(mapping.from);
  const to = join(destination, mapping.to);
  let copyAll = true;
  if ('files' in mapping) {
    copyAll = false;
    logger.info(`copy files`, { from , to });
    try {
      await copyFilesWithStructure(from, to, mapping.files);  
    } catch (error) {
      logger.error('failed to copy files', {from, to, files: mapping.files}, error);
      process.exit(1);
    }
    
  }
  if ('filter' in mapping) {
    copyAll = false;
    try {
      execSync(`cp -rf ${quotePath(join(from, mapping.filter))} "${to}"`);
    } catch (error) {
      logger.error('Failed to copy filtered files', {from, to}, error);
      process.exit(1);
    }
    
  }
  // if no pattern or file list, copy all contents
  if (copyAll) {
    try {
      execSync(`cp -rf ${quotePath(join(from, '*'))} "${to}"`); 
    } catch (error) {
      logger.error('Failed to copy all files', {from, to}, error);
      process.exit(1);
    }
     
  }
};

const buildFindCommand = config => {
  let findCommand = 'find .';
  let excludeDirectories = [];
  let includeDirectories = [];
  if (config.directories) {
    if (config.directories.exclude) {
      excludeDirectories = config.directories.exclude.map(exclude => ` -type d -name ${exclude} -prune -not -name  ${exclude}`);
      findCommand += excludeDirectories.join(' -o');
    }
    if (config.directories.include) {
      if (excludeDirectories.length) {
        findCommand += ' -o';
      }
      includeDirectories = config.directories.include.map(include => ` -type d -name ${include}`);
      findCommand += includeDirectories.join(' -o');
    }
  }
  if (config.files.include) {
    if (excludeDirectories.length || includeDirectories.length) {
      findCommand += ' -o';
    }
      const includeFiles = config.files.include.map(include => ` -type f -name ${include}`);
      findCommand += includeFiles.join(' -o');    
  }
  return findCommand;
};

const backupAppConfig = async (config, destination) => {
  const from = fixPath(config.from);
  await process.chdir(from);
  const to = join(destination, config.to);
  const findCommand = buildFindCommand(config);
  const paths = execSync(findCommand, { encoding: 'utf-8' }).split('\n');
  await copyFilesWithStructure(from, to, paths);
};

const backupListings = async (listings, destination) => {
  logger.debug('back up listing', {listings, destination});
  Object.keys(listings).forEach(label => {
    const listing = readdirSync(fixPath(listings[label]));
    writeFileSync(join(destination, `${label}.txt`), listing.join('\n')); 
  })
};


const backupToDestination = async config => {
  const destination = fixPath(config.destination);
  if ('app-config' in config) {
    backupAppConfig(config['app-config'], destination);
  }
  if (config.listings) {
    backupListings(config.listings, destination);
  }
  if (config.mappings) {
    config.mappings.forEach(async mapping => {
      handleBackupMapping(mapping, destination);
    });
  }  
};

const main = async (config) => {
  for (let label in config) {
    logger.info('***' + label + '***');    
    await backupToDestination(config[label]);
  }
};

if (process.argv.length === 3) {
  configfile = process.argv[2]
}

try {
  var config = yaml.safeLoad(readFileSync(configfile, 'utf8'));
} catch (e) {
  logger.error('Cannot load config file', e);
  process.exit(1);
}
main(config);


/**
 * start of app-config
 */

// ** get git remote origin?
// const paths = execSync('find . -type d -name node_modules -prune -not -name  node_modules -o -type d -name target -prune -not -name target  -o -name .idea -o -name "*.env"', { encoding: 'utf-8' }).split('\n');
// 
