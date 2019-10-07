const { execSync } = require('child_process');
const { copy, existsSync, mkdirSync } = require('fs-extra');
const { dirname, join } = require('path');
const mkdirp = require('mkdirp');

const usage='intellij-backup <code-root> <backup-dir>';

const mkdir = path => existsSync(path) || mkdirp.sync(path);

if (process.argv.length !== 4) {
  console.log(usage);
  process.exit(1);
}

const [ , , coderoot, backupdir ] = process.argv;

if (!existsSync(coderoot)) {
  console.log(`Error: Invalid path: ${coderoot}`);
  process.exit(1);
}

if (!existsSync(backupdir)) {
  mkdir(backupdir);
}

process.chdir(coderoot);

const paths = execSync('find . -not -path "*node_modules*"  -name ".idea" -or -name "*.env"', { encoding: 'utf-8' }).split('\n');

paths.forEach(path => {
  const backuppath = join(backupdir, path);
  const parent = dirname(backuppath);
  console.log(parent);
  mkdir(parent);
  if (path) {
    copy(path, backuppath);
  }
}); 





