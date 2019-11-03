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


const chdir = directory => {
  try {
    process.chdir(directory);
    logger.trace(`New directory: ${process.cwd()}`);
  } catch (err) {
    logger.error(`chdir: ${err}`);
    exit(1);
  }
};

/**
 * Copies a list of paths from one directory to another, retaining relevant the directory structure
 */
const copyFilesWithStructure = (from, to, paths) => {
  logger.trace(`Starting directory: ${process.cwd()}`);

  paths.forEach(async path => {
    const backuppath = join(to, path);
    const parent = dirname(backuppath);
    try {
      mkdir(parent);  
    } catch (error) {
      logger.error(`Could not create directory ${parent}`, error);
      process.exit(1);
    }
    
    if (path) {
      logger.info(`Copying from ${path} to ${backuppath}`, process.cwd(), { from });
      const stats = lstatSync(path);
      const isLink = stats.isSymbolicLink();
      
      try {
        // If it's a link, only copy if it doesn't already exist in the destination due to issues overwriting an existing link
        // Otherwise, copy it.
        // TODO: Handle case where link has updated

        if (!isLink || !existsSync(backuppath)) {
          if (isLink) {
            execSync(`cp -Lf "${path}" "${backuppath}"`);     
          } else if (stats.isDirectory()) {
            execSync(`cp -rf "${path}" "${backuppath}"`);
          } else {
            execSync(`cp -f ${quotePath(path)} "${backuppath}"`);
          }
        }
      } catch (error) {
        logger.error(`Failed to copy ${path} to ${backuppath}`, error);
        process.exit(1);
      }
    }
  });   
};

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
  fixPath,
  loadYaml,
  mkdir,
  quotePath,
  copyFilesWithStructure
};
