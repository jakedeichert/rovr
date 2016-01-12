import path from 'path';
import fse from 'fs-extra';
import merge from 'merge';
import recursiveRead from 'recursive-readdir';
import RovrFile from './rovr-file.js';
import RovrRenderer from './rovr-renderer/index.js';
import RovrLayouts from './rovr-layouts/index.js';
import RovrComponents from './rovr-components/index.js';
import defaultConfig from './default-config.js'


export default class Rovr {
    constructor(src, dest, config = {}, siteMetadata = {}) {
        this.plugins = {};
        this.pluginPipelines = {
            pre: [],
            post: []
        };
        this.src = path.normalize(src);
        this.dest = path.normalize(dest);
        this.config = merge.recursive(true, defaultConfig, config);
        this.siteMetadata = siteMetadata;
        this.files = [];
        this.use(new RovrLayouts());
        this.use(new RovrComponents());
        // The renderer plugin starts the post-render pipeline.
        this.use(new RovrRenderer({
            highlightSyntax: this.config.highlightSyntax,
            verbose: this.config.verbose
        }));
        Object.seal(this);
    }

    /**
     * Get all files in the source directory.
     */
    _loadFiles() {
        return new Promise((resolve, reject) => {
            this.config.excludes.push(this.dest);
            fileList(this.src, this.config.excludes)
                .then((filePaths) => {
                    // TODO: force add file paths specified in this.includes
                    for (let p of filePaths) {
                        // If the src path is included in the file path, remove it.
                        // All file paths will be relative to the src directory.
                        if (this.src != '.' && this.src != './') p = p.replace(`${this.src}/`, '');
                        this.files.push(new RovrFile(p, this.src));
                    }
                    resolve();
                })
                .catch((reason) => {
                    reject(reason);
                });
        });
    }

    /**
     * Add plugins to the generation pipeline.
     * @param {Object} plugin - A plugin that will be added to the pipeline.
     * @desc
     * Take a look at rovr-components, rovr-layouts, and rovr-renderer to see
     * good examples.
     *
     * A plugin is a class with one or more hook functions:
     *
     *      pre(files, rovr, doneCallback) - This hooks into the pre-render pipeline.
     *          These plugins are ran before rovr-renderer which converts markdown
     *          to html and renders react components.
     *
     *      post(files, rovr, doneCallback) - This hooks into the post-render pipeline.
     *          These plugins are ran after the rovr-renderer is finished but before
     *          the files are written to the destination directory.
     */
    use(plugin) {
        if (!this.plugins[plugin.constructor.name]) this.plugins[plugin.constructor.name] = plugin;
        if (typeof plugin.pre === 'function') {
            this.pluginPipelines.pre.push(plugin.pre.bind(plugin));
        }
        if (typeof plugin.post === 'function') {
            this.pluginPipelines.post.push(plugin.post.bind(plugin));
        }
        return this;
    }

    /**
     * Sequentially loop through all plugins as their callbacks return.
     * @desc All plugins are transformed into promises. As each plugin's callback
     * returns, the next plugin in the list will begin.
     */
    _run() {
        let pluginList = [...this.pluginPipelines.pre, ...this.pluginPipelines.post];
        let initialPlugin = new Promise((resolve, reject) => {
                pluginList[0](this.files, this, resolve);
            });
        let otherPlugins = pluginList.slice(1);
        // Loop through all plugin functions.
        return otherPlugins.reduce((previous, current) => {
            return previous.then(() => {
                return new Promise((resolve, reject) => {
                    current(this.files, this, resolve);
                });
            });
        }, initialPlugin);
    }

    /**
     * Output all files to the destination directory.
     */
    _output() {
        // Delete the destination directory before building.
        fse.removeSync(this.dest);

        for (let file of this.files) {
            file.save(this.dest);
        }
    }

    /**
     * Begin the build process.
     */
    build() {
        return new Promise((resolve, reject) => {
            // Load the files.
            this._loadFiles()
                .then(() => {
                    // Run all of the plugins.
                    return this._run();
                })
                .then(() => {
                    // Output the final files.
                    this._output();
                    resolve();
                })
                .catch((reason) => {
                    reject(reason);
                });
        });
    }
}

/**
 * Get a list of all files in a directory.
 * @param {string} dir - The directory to find files in.
 * @param {string[]} excludes - An optional list of files and directories to ignore.
 *  Supports glob matching via minimatch.
 */
function fileList(dir, excludes = []) {
    return new Promise (function (resolve, reject) {
        // Recursively read the specified directory
        recursiveRead(dir, excludes, function (err, filePaths) {
            // Reject if there was an error
            if (err) reject(err);
            // Resolve if the files are ready
            resolve(filePaths);
        });
    });
}
