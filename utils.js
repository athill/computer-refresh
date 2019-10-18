const { execSync } = require('child_process');
const { copy, existsSync, lstatSync, mkdirSync } = require('fs-extra');
const { dirname, join } = require('path');
const mkdirp = require('mkdirp');

const homedir = require('os').homedir();

const mkdir = path => existsSync(path) || mkdirp.sync(path);

const fixPath = path => path.replace('~', homedir);

const copyFilesWithStructure = async (from, to, paths) => {
  // console.log('cfws', { paths, to });
  // return;
  await process.chdir(from);
  paths.forEach(async path => {
    const backuppath = join(to, path);
    const parent = dirname(backuppath);
    try {
      mkdir(parent);  
    } catch (error) {
      console.log(`error: could not mkdir ${parent}`, error);
      process.exit(1);
    }
    
    if (path) {
      const isLink = lstatSync(path).isSymbolicLink();
      console.log('copying file in structure', { path, backuppath, from, isLink });
      try {
        if (!isLink || !existsSync(backuppath)) {
          if (isLink) {
            execSync(`cp -Lf ${path} ${backuppath}`);              
          } else {
            execSync(`cp -rf ${path} ${backuppath}`);  
          }

        }
      } catch (error) {
        console.log(`Failed to copy ${path} to ${backuppath}`, error);
        process.exit(1);
      }
      

    }
  });   
};

module.exports = {
  fixPath,
  mkdir,
  copyFilesWithStructure
};