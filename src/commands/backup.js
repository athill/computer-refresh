const {Command, flags} = require('@oclif/command');


const { backup } = require('../app');
const { loadYaml } = require('../utils');

class BackupCommand extends Command {
  async run() {
    const { 
    	args: { configfile }, 
    	flags: { 'app-config':  appConfig, listings, mappings, verbose } 
    } = this.parse(BackupCommand);
    
    const options = {
    	all: appConfig === mappings && appConfig === listings,
    	appConfig,
    	listings,
    	mappings,
    	verbose
    };
	const config = loadYaml(configfile);
	backup(config, options);
  }
}

BackupCommand.description = `Backs up files according to a configuration file

See documentation for more information
`

BackupCommand.flags = {
  'app-config': flags.boolean({ default: false, char: 'c' }),
  mappings: flags.boolean({ default: false, char: 'm' }),
  listings: flags.boolean({ default: false, char: 'l' }),
  verbose: flags.boolean({ default: false, char: 'v' })
};

BackupCommand.args = [
	{
		name: 'configfile',
		required: true,
		description: 'YAML file with refresh configuration'
	}
];

module.exports = BackupCommand
