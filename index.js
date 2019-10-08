const { execSync } = require('child_process');
const { existsSync, readFileSync } = require('fs-extra');
const yaml = require('js-yaml');

const { copyFilesWithStructure, mkdir } = require('./utils');

let configfile = 'config.yml';

if (process.argv.length === 3) {
  configfile = process.argv[2]
}

try {
  var config = yaml.safeLoad(readFileSync(configfile, 'utf8'));
  console.log(config);
} catch (e) {
  console.log('Cannot load config file', e);
  process.exit(1);
}

// console.log(buildFind(config.secure.mappings['~/Code^app-config']));


// const usage='intellij-backup <code-root> <backup-dir>';







// const [ , , coderoot, backupdir ] = process.argv;

// if (!existsSync(coderoot)) {
//   console.log(`Error: Invalid path: ${coderoot}`);
//   process.exit(1);
// }

// if (!existsSync(backupdir)) {
//   mkdir(backupdir);
// }

// process.chdir(coderoot);

// const paths = execSync('find . -type d -name node_modules -prune -o -name ".idea" -o -type f -name "*\.env""', { encoding: 'utf-8' }).split('\n');


// copyFilesWithStructure(paths, backupdir);
// paths.forEach(path => {
//   const backuppath = join(backupdir, path);
//   const parent = dirname(backuppath);
//   console.log(parent);
//   mkdir(parent);
//   if (path) {
//     copy(path, backuppath);
//   }
// }); 





