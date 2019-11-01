const {Command, flags} = require('@oclif/command')

class BackupCommand extends Command {
  async run() {
    const {flags} = this.parse(BackupCommand)
    const name = flags.name || 'world'
    this.log(`hello ${name} from ./src/commands/backup.js`)
  }
}

BackupCommand.description = `Back up files based on configuration
...
Extra documentation goes here
`

BackupCommand.flags = {
  name: flags.string({char: 'n', description: 'name to print'}),
}

module.exports = BackupCommand
