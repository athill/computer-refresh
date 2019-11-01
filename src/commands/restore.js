const {Command, flags} = require('@oclif/command')

class RestoreCommand extends Command {
  async run() {
    const {args, flags} = this.parse(RestoreCommand);
    this.log({ args });
    // const name = flags.name || 'world'
    // this.log(`hello ${name} from ./src/commands/restore.js`)
  }
}

RestoreCommand.description = `Restores files to a fresh install

Only restores files from the mappings configuration key
`

// RestoreCommand.flags = {
//   name: flags.string({char: 'n', description: 'name to print'}),
// };

RestoreCommand.args = [
	{
		name: 'configfile',
		required: true,
		description: 'Yaml file with refresh configuration'
	}
];

module.exports = RestoreCommand
