const isGlob = require('is-glob');
const { appendFileSync, copyFileSync, existsSync, lstatSync, readdirSync, readFileSync, readlinkSync } = require('fs');
const yaml = require('js-yaml');
const mkdirp = require('mkdirp');
const homedir = require('os').homedir();
const { basename, dirname, join } = require('path');

const logger = require('./logger');

const linkFile = 'links.sh';

let destination;

const setDestination = (dest) => destination = dest;

const getDestination = () => destination;

/**
 * Synchronously creates a nested directory
 * TODO: error handling
 */
const mkdir = path => existsSync(path) || mkdirp.sync(path);

/**
 * Quotes a path correctly, based on whether it ends with a glob
 */
const quotePath = path => isGlob(basename(path)) ? join(`"${dirname(path)}"`, basename(path)) : `"${path}"`;

/**
 * Ostensibly for various tweaks to a path, but currently only replaces '~' with the user's home directory path.
 */
const fixPath = path => path.replace('~', homedir);

/**
 * Wrapper arount process.chdir to handle errors and logging
 */
const chdir = directory => {
  try {
    process.chdir(directory);
    logger.trace(`Changing directory: ${process.cwd()}`);
  } catch (err) {
    logger.error(`chdir: ${err}`);
    process.exit(1);
  }
};

const handleSymbolicLink = (fromPath, toPath) => {
  const linkDest = readlinkSync(fromPath);
  logger.info(`${fromPath} is a symbolic link to ${linkDest}`);
  appendFileSync(join(getDestination(), linkFile), `cd ${dirname(fromPath)}; ln -s ${linkDest} ${fromPath}\n`);
}

const handleCopyFile = (fromPath, toPath) => {
  try {
    if (!existsSync(dirname(toPath))) {
      mkdir(dirname(toPath));
    }
    copyFileSync(fromPath, toPath);
  } catch (error) {
    logger.error(error);
  }
};

const copyRecursive = async (from, to) => {
  logger.trace(`copying reecursively from ${from} to ${to}`);
  mkdir(to);
  const files = readdirSync(from);
  files.forEach(async file => {
    const fromPath = join(from, file);
    const toPath = join(to, file);
    const stats = lstatSync(fromPath);
    if (stats.isSymbolicLink()) {
      handleSymbolicLink(fromPath, toPath);
    } else if (stats.isDirectory()) {
      if (!existsSync(toPath)) {
        mkdir(toPath);
      }
      await copyRecursive(fromPath, toPath);
    } else {
      handleCopyFile(fromPath, toPath);
    }
  });
};

/**
 * Copies a list of paths from one directory to another, retaining relevant the directory structure
 */
const copyFilesWithStructure = async (from, to, paths) => {
  logger.trace(`Starting directory: ${process.cwd()}`, paths);
  paths.forEach(async path => {
    if (!path) {
      return;
    }
    const fromPath = join(from, path);
    const toPath = join(to, path);
    const stats = lstatSync(fromPath);
    if (stats.isSymbolicLink()) {
      handleSymbolicLink(fromPath, toPath);
    } else if (stats.isDirectory()) {
      await copyRecursive(fromPath, toPath);
    } else {
      handleCopyFile(fromPath, toPath);
    }
  });
};

/**
 * Wrapper around yaml.safeLoad to handle logging and errors and reading the file
 */
const loadYaml = yamlFile => {
  let object;
  try {
    object = yaml.safeLoad(readFileSync(yamlFile, 'utf8'));
  } catch (e) {
    logger.error('Cannot load config file', e);
    process.exit(1);
  }
  return object;
}

module.exports = {
  chdir,
  fixPath,
  linkFile,
  loadYaml,
  mkdir,
  quotePath,
  setDestination,
  copyFilesWithStructure
};
