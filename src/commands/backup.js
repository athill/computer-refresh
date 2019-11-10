const {Command, flags} = require('@oclif/command');


const { backup } = require('../app');
const { loadYaml } = require('../utils');

class BackupCommand extends Command {
  async run() {
    const { 
    	args: { configfile }, 
    	flags: { 'app-config':  appConfig, labels, listings, mappings, verbose } 
    } = this.parse(BackupCommand);
    
    const options = {
    	all: appConfig === mappings && appConfig === listings,
    	appConfig,
      labels,
    	listings,
    	mappings,
    	verbose,
    };
	const config = loadYaml(configfile);
	backup(config, options);
  }
}

BackupCommand.description = `Backs up files according to a configuration file

See documentation for more information
`

BackupCommand.flags = {
  'app-config': flags.boolean({ default: false, char: 'c', description: 'Run the app-config process.' }),
  mappings: flags.boolean({ default: false, char: 'm', description: 'Run the mappings process.' }),
  listings: flags.boolean({ default: false, char: 'l', description: 'Run the listings process.' }),
  verbose: flags.boolean({ default: false, char: 'v', description: 'Provide verbose output.' }),
  labels: flags.string({ description: 'Select labels to run. Comma delimited list.' })
};

BackupCommand.args = [
	{
		name: 'configfile',
		required: true,
		description: 'YAML file with refresh configuration'
	}
];

module.exports = BackupCommand
