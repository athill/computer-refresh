const { execSync } = require('child_process');
const { existsSync, readFileSync, readdirSync, writeFileSync } = require('fs-extra');
const { join } = require('path');
const yaml = require('js-yaml');
// const copy = require('recursive-copy');

const { copyFilesWithStructure, fixPath, mkdir } = require('./utils');

let configfile = 'config.yml';

const handleBackupMapping = async (mapping, destination) => {
  const from = fixPath(mapping.from);
  const to = join(destination, mapping.to);
  let copyAll = true;
  if ('files' in mapping) {
    copyAll = false;
    console.log(`copy files to ${to}`);
    try {
      await copyFilesWithStructure(from, to, mapping.files);  
    } catch (error) {
      console.log('error: failed to copy files', {from, to, files: mapping.files}, error);
      process.exit(1);
    }
    
  }
  if ('filter' in mapping) {
    copyAll = false;
    console.log(`copy filter to ${to}`);
    try {
      console.log({ from, to });
      execSync(`cp -rf ${from}/${mapping.filter} ${to}`);
      // await copy(from, to, { dot: true, filter: mapping.filter });  
    } catch (error) {
      console.log('error: filed to copy filtered files', {from, to}, error);
      process.exit(1);
    }
    
  }
  // if no pattern or file list, copy all contents
  if (copyAll) {
    console.log(`copy all to ${to}`);
    try {
      execSync(`cp -rf ${from} ${to}`); 
    } catch (error) {
      console.log('error: failed to copy all files', {from, to}, error);
      process.exit(1);
    }
    
  }
};

const backupListings = async (listings, destination) => {
  console.log({listings, destination});
  Object.keys(listings).forEach(label => {
    const listing = readdirSync(fixPath(listings[label]));
    writeFileSync(join(destination, `${label}.txt`), listing.join('\n'));
    console.log(listing);
  })
};


const backupToDestination = async config => {
  const destination = fixPath(config.destination);
  if (config.listings) {
    backupListings(config.listings, destination);
  }
  // process.exit(1);
  if (config.mappings) {
    config.mappings.forEach(async mapping => {
      handleBackupMapping(mapping, destination);
    });
  }  
};


const main = async (config) => {
  for (let label in config) {
    console.log('***' + label + '***');    
    await backupToDestination(config[label]);
  }
};


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
main(config);

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

// const paths = execSync('find . -type d -name node_modules -prune -not -name  node_modules -o -type d -name target -prune -not -name target  -o -name .idea -o -name "*.env"', { encoding: 'utf-8' }).split('\n');


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





