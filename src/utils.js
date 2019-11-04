const { execSync } = require('child_process');
const { existsSync, lstatSync, mkdirSync } = require('fs');
const { basename, dirname, join } = require('path');
const mkdirp = require('mkdirp');
const isGlob = require('is-glob');
const { readFileSync } = require('fs');
const yaml = require('js-yaml');

const logger = require('./logger');

const homedir = require('os').homedir();

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
    logger.trace(`New directory: ${process.cwd()}`);
  } catch (err) {
    logger.error(`chdir: ${err}`);
    process.exit(1);
  }
};

/**
 * Copies a list of paths from one directory to another, retaining relevant the directory structure
 */
const copyFilesWithStructure = (from, to, paths) => {
  logger.trace(`Starting directory: ${process.cwd()}`);

  paths.forEach(async path => {
    let toPath = join(to, path);
    const parent = dirname(toPath);
    
    if (path) {
      const fromPath = join(from, path);
      logger.info(`Copying from ${fromPath} to ${toPath}`, process.cwd(), { from });
      const stats = lstatSync(fromPath);
      const isLink = stats.isSymbolicLink();
      try {
        // If it's a link, only copy if it doesn't already exist in the destination due to issues overwriting an existing link
        // Otherwise, copy it.
        // TODO: Handle case where link has updated
        if (!isLink || !existsSync(toPath)) {
          if (isLink) {
            execSync(`cp -Lf "${fromPath}" "${toPath}"`);     
          } else  {
            mkdirp.sync(dirname(toPath));
            execSync(`cp -rf ${quotePath(fromPath)} "${toPath}"`);
          }
        }
      } catch (error) {
        logger.error(`Failed to copy ${fromPath} to ${toPath}`, error);
        process.exit(1);
      }
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
  loadYaml,
  mkdir,
  quotePath,
  copyFilesWithStructure
};
