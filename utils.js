const { copy, existsSync, mkdirSync } = require('fs-extra');
const { dirname, join } = require('path');
const mkdirp = require('mkdirp');


const mkdir = path => existsSync(path) || mkdirp.sync(path);

const copyFilesWithStructure = (paths, backupdir) => {
  paths.forEach(path => {
    const backuppath = join(backupdir, path);
    const parent = dirname(backuppath);
    console.log(parent);
    mkdir(parent);
    if (path) {
      copy(path, backuppath);
    }
  });   
};

module.exports = {
  mkdir,
  copyFilesWithStructure
};