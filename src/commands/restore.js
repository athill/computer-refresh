const {Command, flags} = require('@oclif/command');

const { restore } = require('../app');
const { loadYaml } = require('../utils');

class RestoreCommand extends Command {
  async run() {
    const { 
    	args: { configfile }, 
    	flags: { verbose } 
    } = this.parse(RestoreCommand);
    
    const options = {
    	verbose
    };
	const config = loadYaml(configfile);
	restore(config, options);
  }
}

RestoreCommand.description = `Restores files to a fresh install

Only restores files from the mappings configuration key
`

RestoreCommand.flags = {
  verbose: flags.boolean({ default: false, char: 'v', description: 'Provide verbose output.' }),
  labels: flags.string({ description: 'Select labels to run. Comma delimited list.' })
};

RestoreCommand.args = [
	{
		name: 'configfile',
		required: true,
		description: 'Yaml file with refresh configuration'
	}
];

module.exports = RestoreCommand
