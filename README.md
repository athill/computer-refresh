# computer-refresh

Backs up files and directories based on configuration.

Reads a configuration file and backs up files and directories to specified locations. By default it looks for a `config.yml` file in the current directory, but can take a config file location as an argument.

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
    - from: /Library/Java/JavaVirtualMachines
      to: jdk
secure:
  destination: ~/secure-code-refresh
  coderoot: ~/Code
  mappings:
    - from: ~/.m2
      to: home/.m2
      pattern: '*.xml'
    // ...
```

In this example, I'm backing up secure files to my desktop and non-secure (common) files to a cloud provider. The top-level labels are arbitrary. Each label has at least `destination` and `mappings` keys. 

`destination` is the root directory to back up files (will be created if it does not exist).

`mappings` works as follows:

1. If there is only a `from` and a `to` entry, it will `cp -rf $from/* $destination/$to`. Not that it does not copy the directory itself, but copies into the `to` directory. The `to` directory structure will be created if it does not exist.
2. If there is a `pattern` argument, it will be appended to the copy source in place of the asterisk `cp -rf $from/*.xml $destination/$to`, for example.
3. If there is a `files` key, it will recursively copy each entry. If there is a nested entry (e.g., `foo/bar`), the `bar` directory will be ensured to exist before copying `bar`. 


TODO: coderoot (app config)