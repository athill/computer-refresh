const { execSync } = require('child_process');
const { existsSync, lstatSync, mkdirSync } = require('fs-extra');
const { basename, dirname, join } = require('path');
const mkdirp = require('mkdirp');
const isGlob = require('is-glob');

const log4js = require('log4js');
const logger = log4js.getLogger();
logger.level = process.env.LOG_LEVEL || 'error';

const homedir = require('os').homedir();

const mkdir = path => existsSync(path) || mkdirp.sync(path);

const quotePath = path => isGlob(basename(path)) ? join(`"${dirname(path)}"`, basename(path)) : `"${path}"`;

// const copy = (flags, from to) => {
//   execSync(`cp -f ${from} "${toDir}"`);
// }

const fixPath = path => path.replace('~', homedir);

const copyFilesWithStructure = async (from, to, paths) => {
  await process.chdir(from);
  paths.forEach(async path => {
    const backuppath = join(to, path);
    const parent = dirname(backuppath);
    logger.info(parent);
    try {
      mkdir(parent);  
    } catch (error) {
      logger.error(`could not mkdir ${parent}`, error);
      process.exit(1);
    }
    
    if (path) {
      const stats = lstatSync(path);
      const isLink = stats.isSymbolicLink();
      logger.debug('copying file in structure', { path, backuppath, from, isLink });
      try {
        if (!isLink || !existsSync(backuppath)) {
          if (isLink) {
            logger.debug('link', path);
            execSync(`cp -Lf "${path}" "${backuppath}"`);     
          } else if (stats.isDirectory()) {
            logger.debug('directory', path);
            execSync(`cp -rf "${path}" "${backuppath}"`);
          } else {
            logger.debug('file', { path, backuppath, dirname: dirname(path) });
            // if (dirname(path) !== '.') {
            //   mkdir(dirname(path));
            // }

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
