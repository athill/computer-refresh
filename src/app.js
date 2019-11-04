const chalk = require('chalk');
const { execSync } = require('child_process');
const { existsSync, readdirSync, writeFileSync } = require('fs');
const { join } = require('path');

const logger = require('./logger');
const { chdir, copyFilesWithStructure, fixPath, mkdir, quotePath } = require('./utils');

const output = text => console.log(chalk.cyan(text));

const handleBackupMapping = (mapping, from, to) => {
  let copyAll = true;
  if ('files' in mapping) {
    copyAll = false;
    logger.info(`Processing mappings files from ${from} to ${to}`);
    try {
      copyFilesWithStructure(from, to, mapping.files);  
    } catch (error) {
      logger.error(`Failed to copy listed files from ${from} to ${to}`, { files: mapping.files, error });
      process.exit(1);
    }
    
  }
  if ('filter' in mapping) {
    copyAll = false;
    logger.info(`Processing mappings filter from ${from} to ${to}`);
    try {
      execSync(`cp -rf ${quotePath(join(from, mapping.filter))} "${to}"`);
    } catch (error) {
      logger.error(`Failed to copy filtered files from ${from} to ${to}`, { error });
      process.exit(1);
    }
  }
  // if no pattern or file list, copy all contents
  if (copyAll) {
    logger.info(`Processing mappings all from ${from} to ${to}`);
    try {
      execSync(`cp -rf ${quotePath(join(from, '*'))} "${to}"`); 
    } catch (error) {
      logger.error(`Failed to copy all files from ${from} to ${to}`, { error });
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
  chdir(from);
  const to = join(destination, config.to);
  const findCommand = buildFindCommand(config);
  logger.trace(`Find command is: ${findCommand}`);
  const paths = execSync(findCommand, { encoding: 'utf-8' }).split('\n');
  logger.trace(`Paths are ${paths}`);
  copyFilesWithStructure(from, to, paths);
};

const backupListings = async (listings, destination) => {
  logger.info('Write out listings', {listings, destination});
  Object.keys(listings).forEach(label => {
    const directory = listings[label];
    logger.trace(`Writing listing of ${directory} to ${label}.txt`);
    const listing = readdirSync(fixPath(directory));
    writeFileSync(join(destination, `${label}.txt`), listing.join('\n')); 
  })
};

const backupLabel = (config, options) => {
  const destination = fixPath(config.destination);
  if ('app-config' in config && (options.appConfig || options.all)) {
    output('Processing app-config');
    backupAppConfig(config['app-config'], destination);
  }
  if (config.listings && (options.listings || options.all)) {
    output('Processing listings');
    backupListings(config.listings, destination);
  }
  if (config.mappings && options.mappings || options.all) {
    output('Processing mappings');
    config.mappings.forEach(async mapping => {
      const from = fixPath(mapping.from);
      const to = join(destination, mapping.to);     
      handleBackupMapping(mapping, from, to);
    });
  }   
};


const backup = async (config, options) => {
  if (options.verbose) {
    logger.level = 'trace';
  }
  for (let label in config) {
    output(`** Backing up [${label}]`);
    backupLabel(config[label], options);
  }
};

const restore = async (config, options) => {
  if (options.verbose) {
    logger.level = 'trace';
  }  
  for (let label in config) {
    output(`** Restoring [${label}]`);
    output('Restoring mappings');
    const conf = config[label];
    const destination = fixPath(conf.destination);
    if (conf.mappings) {
      conf.mappings.forEach(async mapping => {
        const to = fixPath(mapping.from);
        const from = join(destination, mapping.to);
        handleBackupMapping(mapping, from, to);
      });
    }    
  }
};

module.exports = {
  backup,
  restore
};