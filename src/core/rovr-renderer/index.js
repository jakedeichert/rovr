import path from 'path';
import fm from 'front-matter';
import ViewBuilder from './view-builder.js';
import HtmlWithReact from './html-with-react.js';

let viewBuilder;
let htmlWithReact;

function init(files, rovr, options) {
    let componentsString = '';
    viewBuilder = new ViewBuilder(rovr.siteMetadata, {highlightSyntax: options.highlightSyntax});

    // Get layouts and components.
    for (let l in rovr.layouts) {
        viewBuilder.addLayout(rovr.layouts[l].name, rovr.layouts[l].fileData);
    }
    for (let c in rovr.components) {
        componentsString += rovr.components[c].fileData.body;
    }

    htmlWithReact = new HtmlWithReact(componentsString, {site: rovr.siteMetadata});
}


/**
 * Generate markdown and html files using a custom React templating engine.
 * @param {Object} options - Configure this plugin.
 * @desc
 *  Options:
 *      * {bool} highlightSyntax - Should syntax be highlighted. Defaults to false.
 *      * {bool} verbose - Should logs be sent to the console. Defaults to false.
 */
export default function plugin(options) {
    let logger = function(msg) {
        if (options.verbose === true) console.log(msg);
    };

    return {
        pre: function(files, rovr, callback) {
            init(files, rovr, options);
            for (let f in files) {
                let ext = path.extname(f);
                let isMarkdown = false;
                let view;
                // Make sure the file should be parsed before doing so.
                if (files[f].rovr.parse) {
                    switch (ext) {
                        case '.md':
                        case '.markdown':
                            isMarkdown = true;
                            // Replace markdown file extensions with html.
                            let oldFilePath = f;
                            f = f.replace(ext, '.html');
                            files[f] = files[oldFilePath];
                            delete files[oldFilePath];
                        case '.html':
                            view = viewBuilder.generate(files[f], isMarkdown);
                            // Save back to the file's front matter body.
                            files[f].body = htmlWithReact.generate(view.content, {highlightSyntax: options.highlightSyntax});
                            logger(`GENERATED > ${f}`);
                            break;
                        default:
                            // Other files are still parsed. String replacement is done for
                            // site/content metadata and layouts are applied too.
                            logger(`PARSED > ${f}`);
                            view = viewBuilder.generate(files[f], false);
                            files[f].body = view.content;
                    }
                } else {
                    // logger(`IGNORED > ${f}`);
                }
            }
            callback();
        }
    };
}
