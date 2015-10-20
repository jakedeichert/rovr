import path from 'path';
import fse from 'fs-extra';
import utf8 from 'utf8';
import frontMatter from 'front-matter';
import merge from 'merge';
import recursiveRead from 'recursive-readdir';
import rovrGenerator from './rovr-generator/index.js';
import rovrLayouts from './rovr-layouts/index.js';
import rovrComponents from './rovr-components/index.js';
import defaultConfig from './default-config.js'


export default class Rovr {
    constructor(src, dest, config = {}, siteMetadata = {}) {
        this.prePlugins = [];
        this.postPlugins = [];
        this.src = path.normalize(src);
        this.dest = path.normalize(dest);
        this.config = merge.recursive(true, defaultConfig, config);
        this.siteMetadata = siteMetadata;
        this.files = {};
        this.layouts = {};
        this.components = {};
    }

    /**
     * Get all files in the source directory.
     */
    loadFiles() {
        let _this = this;
        return new Promise(function (resolve, reject) {
            fileList(_this.src, _this.config.excludes)
                .then(function(files) {
                    // TODO: force add file paths specified in this.includes
                    for (let f of files) {
                        // If the src path is included in the file path, remove it.
                        // All file paths will be relative to the src directory.
                        if (_this.src != '.' && _this.src != './') f = f.replace(`${_this.src}/`, '');
                        _this.files[f] = _this.getFrontMatter(f);
                    }
                    resolve();
                })
                .catch(function (reason) {
                    console.log(reason);
                    reject(reason);
                });
        });
    }

    /**
     * Read the file and get its front matter if it's a utf8 encoded file.
     * @param {string} file - The file path relative to the source directory.
     */
    getFrontMatter(file) {
        let fileData = fse.readFileSync(path.normalize(`${this.src}/${file}`));
        try {
            // Parse for front matter if it's a utf8 file.
            let fileContents = utf8.decode(fileData.toString());
            // Get the front matter attributes and body from the file contents.
            let fm = frontMatter(fileContents);
            fm.rovr = {
                parse: true,
                utf8: true
            };
            // Don't parse this file if it didn't have a front matter header at all.
            if (!frontMatter.test(fileContents)) fm.rovr.parse = false;
            return fm;
        } catch(e) {
            // If not a utf8 file, it should not be parsed.
            return {
                rovr: {
                    parse: false,
                    utf8: false
                }
            };
        }
    }

    /**
     * Add plugins to the pre-generation pipeline.
     */
    pre(plugin) {
        this.prePlugins.push(plugin);
        return this;
    }

    /**
     * Add plugins to the post-generation pipeline.
     */
    post(plugin) {
        this.postPlugins.push(plugin);
        return this;
    }

    /**
     * Run all plugins on the files.
     */
    run() {
        // Load layouts and components.
        rovrLayouts()(this.files, this);
        rovrComponents()(this.files, this);

        // Run the pre-generation plugins first.
        for (let plugin of this.prePlugins) {
            plugin(this.files, this);
        }

        // Then run the static site generator plugin.
        rovrGenerator({
            highlightSyntax: this.config.highlightSyntax,
            verbose: true
        })(this.files, this);

        // Finally, run the post-generation plugins.
        for (let plugin of this.postPlugins) {
            plugin(this.files, this);
        }
    }

    /**
     * Output all files to the destination directory.
     */
    output() {
        for (let file in this.files) {
            // Don't output files/dirs that start with an underscore.
            if (/\/_/g.test(`/${file}`)) continue;

            let srcPath = path.normalize(`${this.src}/${file}`);
            let destPath = path.normalize(`${this.dest}/${file}`);
            // If the file front matter has a body, then write the new file.
            if (this.files[file].body) {
                fse.outputFile(destPath, this.files[file].body, function(err) {
                    if (err) console.log('ROVR WRITE ERROR > ' + err);
                });
            }
            // If it doesn't have a body, then just do a direct file copy.
            else {
                fse.copySync(srcPath, destPath);
            }
        }
    }

    /**
     * Begin the build process.
     */
    build(callback) {
        // Delete the destination folder before building.
        fse.removeSync(this.dest);

        let _this = this;
        // Load the files.
        this.loadFiles()
            .then(function() {
                // Run all plugins on the files.
                _this.run();
                // Output the final files.
                _this.output();
                // Return to the callback.
                callback();
            })
            .catch(function(reason) {
                callback(reason);
            });
        return this;
    }

}

/**
 * Get a list of all files in a directory.
 * @param {string} dir - The directory to find files in.
 * @param {string[]} excludes - An optional list of files and directories to ignore.
 *      Supports glob matching via minimatch.
 */
function fileList(dir, excludes = []) {
    return new Promise (function (resolve, reject) {
        // Recursively read the specified directory
        recursiveRead(dir, excludes, function (err, files) {
            // Reject if there was an error
            if (err) reject(err);
            // Resolve if the files are ready
            resolve(files);
        });
    });
}
