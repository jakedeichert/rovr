import marked from 'marked';
import hljs from 'highlight.js';
import View from './view.js';


export default class ViewBuilder {

    constructor(siteMetadata, options) {
        this.siteMetadata = siteMetadata;
        this.layouts = {};
        this.options = options;
    }

    /**
     * Add a layout to the list of available layouts.
     * @param {string} layoutName - The name of the layout.
     * @param {Object} frontMatter - The front matter of the layout containing
     *      the body and attributes.
     */
    addLayout(layoutName, frontMatter) {
        this.layouts[layoutName] = frontMatter;
    }

    /**
     * Converts markdown to html.
     * @param {string} markdown - The markdown to convert to html.
     * @return {string} The converted html.
     */
    getHTML(markdown) {
        let html = '';
        if (this.options.highlightSyntax) {
            html = marked(markdown, {
                highlight: function (code, lang) {
                    // If the lang is undefined, it's not a code block so I
                    // prepend and append a special string which helps me remove
                    // the generated <pre><code> tags that marked adds.
                    if (lang == undefined) return `rovr_not_code${code}rovr_not_code`;
                    return hljs.highlight(lang, code).value;
                }
            });
            // Remove <pre><code> tags that were wrongly added.
            html = html.replace(/<pre><code>rovr_not_code|rovr_not_code[\n]*<\/code><\/pre>/g, '');
        } else {
            html = marked(markdown);
        }
        return html;
    }

    /**
     * Generates a page based on front matter data.
     * @param {Object} frontMatter - The front matter of the page containing
     *      the body and attributes.
     * @param {bool} convertMarkdown - Whether to convert markdown to HTML or not.
     * @return {string} The final view.
     */
    generate(frontMatter, convertMarkdown) {
        let body = convertMarkdown ? this.getHTML(frontMatter.body) : frontMatter.body;
        let view = new View(body, frontMatter.attributes);

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
        let lfm = this.layouts[layoutName];
        let layout = new View(lfm.body, lfm.attributes);
        // Check if this layout has a parent layout...
        // This will recursively load layouts into other layouts.
        if (layout.metadata.layout) {
            let parentLayout = this.getLayout(layout.metadata.layout);
            layout.applyLayout(parentLayout);
        }
        return layout;
    }
}
