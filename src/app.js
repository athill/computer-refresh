const chalk = require('chalk');
const { execSync } = require('child_process');
const { readdirSync, writeFileSync, existsSync, unlinkSync } = require('fs');
const { join } = require('path');

const logger = require('./logger');
const { chdir, copyFilesWithStructure, fixPath, linkFile, mkdir, quotePath, setDestination } = require('./utils');

const output = text => console.log(chalk.cyan(text));

const handleBackupMapping = async (mapping, from, to) => {
  let copyAll = true;
  if ('files' in mapping) {
    copyAll = false;
    logger.info(`Processing mappings files from ${from} to ${to}`);
    try {
      await copyFilesWithStructure(from, to, mapping.files);
    } catch (error) {
      logger.error(`Failed to copy listed files from ${from} to ${to}`, { files: mapping.files, error });
      process.exit(1);
    }

  }
  if ('filter' in mapping) {
    copyAll = false;
    const filterFrom = quotePath(join(from, mapping.filter));
    logger.info(`Processing mappings filter from ${filterFrom} to ${to}`);
    try {
      mkdir(to);
      execSync(`cp -rf ${filterFrom} "${to}"`);
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
  logger.trace(`Backing up app config from ${from}`);
  chdir(from);
  const to = join(destination, config.to);
  if (existsSync('.git')) {
    const remotes = execSync('git remote -v');
    writeFileSync(`${to}/remotes.txt`, remotes.join('\n'));
  }
  const findCommand = buildFindCommand(config);
  logger.trace(`Find command is: ${findCommand}`);
  const paths = execSync(findCommand, { encoding: 'utf-8' }).split('\n');
  logger.trace(`Paths are ${paths}`);
  copyFilesWithStructure(from, to, paths);
  const gitPaths = execSync('find . -name .git', { encoding: 'utf-8' }).split('\n').map(path => path.replace('.git', ''));
  gitPaths.forEach(path => {
    if (path) {
      logger.trace('Adding remotes: ', path);
      const remotes = execSync(`git -C ${path} remote -v`, { encoding: 'utf-8' });
      if (remotes) {
        mkdir(`${to}/${path}`);
        writeFileSync(`${to}/${path}/remotes.txt`, remotes);
      }
    }
  });


};

const backupListings = async (listings, destination) => {
  logger.info('Write out listings');
  Object.keys(listings).forEach(label => {
    const directory = listings[label];
    logger.trace(`Writing listing of ${directory} to ${label}.txt`);
    const listing = readdirSync(fixPath(directory));
    writeFileSync(join(destination, `${label}.txt`), listing.join('\n'));
  })
};

const backupLabel = async (config, options) => {
  const destination = fixPath(config.destination);
  setDestination(destination);
  mkdir(destination);
  if (existsSync(join(destination, linkFile))) {
    unlinkSync(join(destination, linkFile));
  }
  if ('app-config' in config && (options.appConfig || options.all)) {
    output('Processing app-config');
    backupAppConfig(config['app-config'], destination);
  }
  if (config.listings && (options.listings || options.all)) {
    output('Processing listings');
    backupListings(config.listings, destination);
  }
  if (config.mappings && (options.mappings || options.all)) {
    output('Processing mappings');
    config.mappings.forEach(async mapping => {
      const from = fixPath(mapping.from);
      const to = join(destination, mapping.to);
      if (!existsSync(to)) {
        mkdir(to);
      }
      await handleBackupMapping(mapping, from, to);
    });
  }
};

const getLabels = (config, options) => {
  let labels = Object.keys(config);
  if (options.labels) {
    labels = options.labels.split(',');
    labels.forEach(label => {
      if (!(label in config)) {
        logger.error(`Invalid label, "${label}". Valid labels are ${Object.keys(config).join(',')}`);
        process.exit(1);
      }
    });
  }
  return labels;
};

const backup = async (config, options) => {
  const labels = getLabels(config, options);
  if (options.verbose) {
    logger.level = 'trace';
  }
  labels.forEach(async label => {
    output(`** Backing up [${label}]`);
    await backupLabel(config[label], options);
  });
};

const restore = async (config, options) => {
  const labels = getLabels(config, options);
  if (options.verbose) {
    logger.level = 'trace';
  }
  labels.forEach(label => {
    output(`** Restoring [${label}]`);
    output('Restoring mappings');
    const conf = config[label];
    const destination = fixPath(conf.destination);
    if (conf.mappings) {
      conf.mappings.forEach(async mapping => {
        const to = fixPath(mapping.from);
        const from = join(destination, mapping.to);
        await handleBackupMapping(mapping, from, to);
      });
    }
  });
};

module.exports = {
  backup,
  restore
};
