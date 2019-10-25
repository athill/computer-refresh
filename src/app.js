const { execSync } = require('child_process');
const { existsSync, readdirSync, writeFileSync } = require('fs');
const { join } = require('path');

const logger = require('./logger');
const { copyFilesWithStructure, fixPath, mkdir, quotePath } = require('./utils');

const handleBackupMapping = (mapping, destination) => {
  const from = fixPath(mapping.from);
  const to = join(destination, mapping.to);
  let copyAll = true;
  if ('files' in mapping) {
    copyAll = false;
    logger.info(`copy files`, { from , to });
    try {
      copyFilesWithStructure(from, to, mapping.files);  
    } catch (error) {
      logger.error('Failed to copy files', {from, to, files: mapping.files}, error);
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

const backupAppConfig = (config, destination) => {
  const from = fixPath(config.from);
  try {
    process.chdir(from);  
  } catch (error) {
    logger.error(`Could not change directory`);
  }
  const to = join(destination, config.to);
  const findCommand = buildFindCommand(config);
  logger.trace(`Find command is: ${findCommand}`);
  const paths = execSync(findCommand, { encoding: 'utf-8' }).split('\n');
  copyFilesWithStructure(from, to, paths);
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

module.exports = {
  backupToDestination
};