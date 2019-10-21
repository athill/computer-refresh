const { execSync } = require('child_process');
const { existsSync, lstatSync, mkdirSync } = require('fs-extra');
const { basename, dirname, join } = require('path');
const mkdirp = require('mkdirp');
const isGlob = require('is-glob');

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
 * Copies a list of paths from one directory to another, retaining relevant the directory structure
 */
const copyFilesWithStructure = async (from, to, paths) => {
  await process.chdir(from);
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

module.exports = {
  fixPath,
  mkdir,
  quotePath,
  copyFilesWithStructure
};
