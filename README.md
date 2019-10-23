# computer-refresh

*Status: Work in progress - not ready for production. Restore functionality has not yet been implemented.* 

`computer-refresh` is a JavaScript library to automate and document backing up and restoring your files from one computer to another.

- *Decarative Configuration*: The backups are defined in a `YAML` configuration file that documents the files you are backing up.
- *Deep Copies*: The directory structure of the source files is copied so common file names do not clobber each other and context is not lost.
- *Flexible*: Succinct syntax to copy virtually anything to anywhere.

## Installation

```
$ npm i -S computer-refresh
```

## Usage

The idea is to document that which can be automated when moving from computer to computer, so my intended usage is to create a personal repository (e.g, `laptop-backup`) with this installed where the `README` is composed of sets of instructions for the backup and restore processes that this script doesn't help automate (e.g., install `nodejs` on the target computer). The hope is that between the configuration file and the instructions, my backup/restore process is documented and partially automated.

That said, here the gist of using it:
```
const backup = require('computer-refresh');
cont yaml = require('js-yaml');

const configfile = 'config.yml';

let config;
try {
  config = yaml.safeLoad(readFileSync(configfile, 'utf8'));
} catch (error) {
  console.log(`ERROR: Cannot load config file, ${configfile}`, error);
  process.exit(1);
}

backup(config);
```

## Configuration

Some example configuration will probably help

```
common:
  destination: ~/cloud-provider/computer-refresh
  mappings:
    - from: ~
      to: home
      files:
        - .git-completion.bash 
        // ...
    - from: ~/Documents/recipes
      to: recipes
secure:
  destination: ~/secure-computer-refresh
  mappings:
    - from: ~/.m2
      to: home/.m2
      pattern: '*.xml'      
    // ...
  app-config: 
    from: ~/Code
    to: app-config
    files:
      include: 
        - .env
    directories:
      exclude:
        - node_modules
      include:    
        - .idea
```

In this example, I'm backing up secure files to my desktop and non-secure (common) files to a cloud provider. The top-level labels are arbitrary. Each label has at least `destination` and `mappings` keys. 

`destination` is the root directory to back up files (will be created if it does not exist).

`mappings` works as follows:

1. If there is only a `from` and a `to` entry, it will `cp -rf $from/* $destination/$to`. Note that it does not copy the directory itself, but copies into the `to` directory. The `to` directory structure will be created if it does not exist.
2. If there is a `pattern` argument, it will be appended to the copy source in place of the asterisk `cp -rf $from/*.xml $destination/$to`, for example.
3. If there is a `files` key, it will recursively copy each entry. If there is a nested entry (e.g., `foo/bar`), the `bar` directory will be ensured to exist before copying `bar`. 

`app-config` is intended to pluck files not in source control from programming projects (e.g., `.env`, `.idea`). The keys are as follows:

1. `from` - Root of code directory
2. `to` - Where to back up the files (`$destination/$to`)
3. `files` - Only has an `include` key for files to include (e.g., `.env`)
4. `directories - Has a key for directories to include (e.g., `.idea`) and exclude, meaning not to traverse (e.g., `node_modules`)
