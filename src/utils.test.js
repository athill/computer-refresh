const { existsSync, mkdirSync, readdirSync, writeFileSync } = require('fs');
const mkdirp = require('mkdirp');
const { basename, dirname, join, parse } = require('path');
const rimraf = require('rimraf');


const { copyFilesWithStructure, fixPath, mkdir, quotePath } = require('./utils');

const fileroot = parse(process.cwd()).root

describe('utils', () => {
	let testDir;

	beforeEach(() => {
	  const date = new Date();
	  testDir = join(fileroot, 'tmp', `computer-refresh-test-${date.toISOString()}`);
	  mkdirp.sync(testDir);
	});

	afterEach(() => {
		rimraf.sync(testDir);
	});

	describe('mkdir', () => {
		it('should make a directory', () => {
			const dir = join(testDir, 'test');
			mkdir(dir);
			expect(existsSync(dir)).toBe(true);

		});

		it('should make a nested directory', () => {
			const dir = join(testDir, 'test', 'foo');
			mkdir(dir);
			expect(existsSync(dir)).toBe(true);

		});		
	});

	describe('quotePath', () => {

		const dirname = join('foo', 'bar', 'baz');
		
		it('should quote the entire path if the basename is not a glob', () => {	
			const basename = 'test.js';
			const path = join(dirname, basename);
			expect(quotePath(path)).toBe(`"${path}"`);
		});

		it('should quote the dirname if the basename is a glob', () => {	
			const basename = '*.js';
			const path = join(dirname, basename);
			expect(quotePath(path)).toBe(join(`"${dirname}"`, basename));
		});		
	});

	describe('fixPath', () => {
		const homedir = require('os').homedir();
		it('should convert a ~ to the user\'s home directory', () => {
			const relativePath = join('foo', 'bar', 'baz');
			expect(fixPath(join('~', relativePath))).toBe(join(homedir, relativePath));
		});
	});

	describe('copyFilesWithStructure', () => {
		let fromDir;
		let toDir;

		const directories = ['a', 'b', 'c', 'd', 'e'];
		const files = ['.config', 'bar.js', 'foo.js'];
		const defaultPaths = [
			'.config',
			'./a/b/c',
			'./c/foo.js'
		];
		beforeEach(() => {
			fromDir = join(testDir, 'from');
			toDir = join(testDir, 'to');
			mkdirp.sync(fromDir);
			const addDirectory = directory => {
				mkdirp.sync(directory);
				files.forEach(file => writeFileSync(join(directory, file)));
			}
			addDirectory(fromDir);
			directories.forEach(first => {
				addDirectory(join(fromDir, first));
				directories.forEach(second => {
					addDirectory(join(fromDir, first, second));
					directories.forEach(third => addDirectory(join(fromDir, first, second, third)));
				})
			});
		});

		afterEach(() => {
			rimraf.sync(fromDir);
			rimraf.sync(toDir);
		});

		it('should copy files', () => {
			const expectListing = (directory, listing) => {
				expect(readdirSync(directory)).toEqual(listing);	
			}
			copyFilesWithStructure(fromDir, toDir, defaultPaths);
			expectListing(toDir, ['.config', 'a', 'c']);
			expectListing(join(toDir, 'a'), ['b']);
			expectListing(join(toDir, 'a', 'b'), ['c']);
			expectListing(join(toDir, 'a', 'b', 'c'), files);
			expectListing(join(toDir, 'c'), ['foo.js']);
		});

		it('should be idempotent', () => {
			copyFilesWithStructure(fromDir, toDir, defaultPaths);
			copyFilesWithStructure(fromDir, toDir, defaultPaths);
		});

		// TODO: test links		
	});

	// TODO: test loadYaml and chdir error handling


});