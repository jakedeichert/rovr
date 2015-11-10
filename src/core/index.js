import path from 'path';
import fse from 'fs-extra';
import utf8 from 'utf8';
import frontMatter from 'front-matter';
import merge from 'merge';
import recursiveRead from 'recursive-readdir';
import rovrRenderer from './rovr-renderer/index.js';
import rovrLayouts from './rovr-layouts/index.js';
import rovrComponents from './rovr-components/index.js';
import defaultConfig from './default-config.js'


export default class Rovr {
    constructor(src, dest, config = {}, siteMetadata = {}) {
        this.plugins = {
            pre: [],
            post: []
        };
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
     * Add plugins to the generation pipeline.
     * @param {Object} plugin - A plugin that will be added to the pipeline.
     * @desc
     * TODO: create better plugin documentation!
     * Plugins with 'pre' and/or 'post' functions will be added to the
     * respective pipelines.
     *
     * Example plugin:
     * {
     *      pre: function(files, rovr) {...},
     *      post: function(files, rovr) {...}
     * }
     */
    use(plugin) {
        if (plugin.hasOwnProperty('pre')) {
            this.plugins.pre.push(plugin);
        }
        if (plugin.hasOwnProperty('post')) {
            this.plugins.post.push(plugin);
        }
        return this;
    }

    /**
     * Run all plugins on the files.
     */
    run() {
        // Load layouts and components.
        rovrLayouts().pre(this.files, this);
        rovrComponents().pre(this.files, this);

        // Run the pre-generation plugins first.
        for (let plugin of this.plugins.pre) {
            plugin.pre(this.files, this);
        }

        // Then render React components and markdown code.
        rovrRenderer({
            highlightSyntax: this.config.highlightSyntax,
            verbose: true
        }).pre(this.files, this);

        // Finally, run the post-generation plugins.
        for (let plugin of this.plugins.post) {
            plugin.post(this.files, this);
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
