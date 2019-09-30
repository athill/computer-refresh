# intellij-backup

Simple command line tool to back up IntelliJ configs

## Usage
```
node . <code-root> <backup-dir>
```

Where `code-root` is the root of where your IntelliJ projects are stored and `backup-dir` is the directory you would like to back them up to (will be created if it does not exist).

For example, `node . ~/Code ~/intellij-backup` will recursively find all `.idea` directories in `~/Code` and copy them with their parent directory structure to `~/intellij-backup`.

For example, if `~/Code` looks like:
```
├── project-a
│   ├── .idea
│   └── foo.js
├── project-b
│   ├── .idea
│   └── foo.js
└── subdir
    └── project-c
        ├── .idea
        └── foo.js
```

`~/intellij-backup` will look like:
```
├── project-a
│   └── .idea
├── project-b
│   └── .idea
└── subdir
    └── project-c
        └── .idea
```        
