const { execSync } = require('child_process');
const { existsSync } = require('fs-extra');

const { copyFilesWithStructure, mkdir } = require('./utils');

const usage='intellij-backup <code-root> <backup-dir>';

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


copyFilesWithStructure(paths, backupdir);
// paths.forEach(path => {
//   const backuppath = join(backupdir, path);
//   const parent = dirname(backuppath);
//   console.log(parent);
//   mkdir(parent);
//   if (path) {
//     copy(path, backuppath);
//   }
// }); 





