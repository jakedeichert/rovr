import path from 'path';
import fm from 'front-matter';
import ViewBuilder from './view-builder.js';
import HtmlWithReact from './html-with-react.js';

/**
 * Generate markdown and html files using a custom React templating engine.
 */
 export default class RovrRenderer {
    /**
     * Constructor.
     * @param {Object} options - Configure this plugin.
     * @desc
     *  Options:
     *      * {bool} highlightSyntax - Should syntax be highlighted. Defaults to false.
     *      * {bool} verbose - Should logs be sent to the console. Defaults to false.
     */
    constructor(options) {
        this.viewBuilder = null;
        this.htmlWithReact = null;
        this.options = options;
    }

    logger(msg) {
        if (this.options.verbose === true) console.log(msg);
    }

    post(files, rovr, callback) {
        let componentsString = '';
        this.viewBuilder = new ViewBuilder(rovr.siteMetadata, {highlightSyntax: this.options.highlightSyntax});
        // Get layouts and components.
        for (let l in rovr.layouts) {
            this.viewBuilder.addLayout(rovr.layouts[l].name, rovr.layouts[l].fileData);
        }
        for (let c in rovr.components) {
            componentsString += rovr.components[c].fileData.body;
        }
        this.htmlWithReact = new HtmlWithReact(componentsString, {site: rovr.siteMetadata});

        for (let f of files) {
            let ext = path.extname(f.path);
            let isMarkdown = false;
            let view;
            // Make sure the file should be parsed before doing so.
            if (f.shouldParse) {
                switch (ext) {
                    case '.md':
                    case '.markdown':
                        // Replace markdown file extensions with html.
                        isMarkdown = true;
                        f.path = f.path.replace(ext, '.html');
                    case '.html':
                        view = this.viewBuilder.generate(f, isMarkdown);
                        // Save back to the file's body.
                        f.body = this.htmlWithReact.generate(view.content, {highlightSyntax: this.options.highlightSyntax});
                        this.logger(`GENERATED > ${f.path}`);
                        break;
                    default:
                        // Other files are still parsed. String replacement is done for
                        // site/content metadata and layouts are applied too.
                        this.logger(`PARSED > ${f.path}`);
                        view = this.viewBuilder.generate(f, false);
                        f.body = view.content;
                }
            } else {
                // this.logger(`IGNORED > ${f.path}`);
            }
        }
        callback();
    }
}
