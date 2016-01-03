import marked from 'marked';
import hljs from 'highlight.js';
import View from './view.js';


export default class ViewBuilder {

    constructor(siteMetadata, layouts, options) {
        this.siteMetadata = siteMetadata;
        this.layouts = {};
        this.options = options;
        for (let layout of layouts) {
            this.addLayout(layout.name, layout.file);
        }
    }

    /**
     * Add a layout to the list of available layouts.
     * @param {string} layoutName - The name of the layout.
     * @param {Object} file - The RovrFile data object.
     */
    addLayout(layoutName, file) {
        this.layouts[layoutName] = file;
    }

    /**
     * Converts markdown to html.
     * @param {string} markdown - The markdown to convert to html.
     * @return {string} The converted html.
     */
    _getHTML(markdown) {
        let html = '';
        if (this.options.highlightSyntax === true) {
            html = marked(markdown, {
                highlight: function (code, lang) {
                    // If the lang is undefined, don't highlight this code block.
                    if (lang == undefined) return code;
                    return hljs.highlight(lang, code).value;
                }
            });
        } else {
            html = marked(markdown);
        }
        return html;
    }

    /**
     * Generates a page based on the file's metadata.
     * @param {Object} file - The RovrFile data object.
     * @param {bool} convertMarkdown - Whether to convert markdown to HTML or not.
     * @return {string} The final view.
     */
    generate(file, convertMarkdown) {
        let body = convertMarkdown ? this._getHTML(file.body) : file.body;
        let view = new View(body, file.metadata);

        // If it has a layout, apply the layout.
        if (view.metadata.layout) {
            let layout = this.getLayout(view.metadata.layout);
            view.applyLayout(layout);
        }
        view.applyMetadata("site", this.siteMetadata);
        view.applyMetadata("content", view.metadata);

        return view;
    }

    /**
     * Gets the layout for a view.
     * @param {string} layoutName - The name of the layout.
     * @return {string} The final layout.
     */
    getLayout(layoutName) {
        let layoutFile = this.layouts[layoutName];
        let layout = new View(layoutFile.body, layoutFile.metadata);
        // Check if this layout has a parent layout...
        // This will recursively load layouts into other layouts.
        if (layout.metadata.layout) {
            let parentLayout = this.getLayout(layout.metadata.layout);
            layout.applyLayout(parentLayout);
        }
        return layout;
    }
}
