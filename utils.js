const { copy, existsSync, mkdirSync } = require('fs-extra');
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
      console.log('copying file in structure', { path, backuppath });
      await copy(path, backuppath);
      console.log(`Failed to copy ${path} to ${backuppath}`, error);
    }
  });   
};

module.exports = {
  fixPath,
  mkdir,
  copyFilesWithStructure
};