import * as babel from 'babel-core';
import reactServer from 'react-dom/server';
import cheerio from 'cheerio';
import vm from 'vm';


export default class HtmlWithReact {
    /**
     * Constructor for HtmlWithReact.
     * @param {string} reactComponents - JavaScript React components in the form of a string.
     * @param {Object} context - An optional object to add more context to the VM sandbox.
     */
    constructor(reactComponents, context = {}) {
        this.reactComponents = reactComponents;

        // Load the optional context and React into a VM sandbox.
        this.vmSandbox = context;
        this.vmSandbox.React = require('react');
        vm.createContext(this.vmSandbox);

        // Transform the jsx to js and then load the classes into the sandboxed context.
        vm.runInContext(babel.transform(this.reactComponents).code, this.vmSandbox);
    }

    /**
     * Generates an HTML page based on HTML + React input.
     * @param {string} contents - The HTML + React page.
     * @param {Object} options - Extra options for the generator.
     * @returns {string} The static HTML output.
     * @desc
     *      Options:
     *          * {bool} highlightSyntax - Should 'hljs' be added to all pre>code element classes. Defaults to false.
     */
    generate(contents, options) {
        // Load the contents into the cheerio DOM.
        let $ = cheerio.load(contents, {
            lowerCaseTags: false,
            decodeEntities: false,
            recognizeSelfClosing: true // true doesn't create end tags for self-closed tags
        });

        // If the HTML tag starts with a capital letter, then let's
        // assume it's a React component and render it as such.
        let componentsInView = contents.match(/<[A-Z]+[\w\s]*[\s\/>]/g);
        // Ensure match is not null.
        if (componentsInView) {
            let sandbox = this.vmSandbox;
            let reactComponentTypes = new Set();

            // Add all individual types to a set.
            for (let i of componentsInView) {
                reactComponentTypes.add(i.substr(1, i.length-2));
            }

            // Render each React component that is found in the view.
            reactComponentTypes.forEach(function(componentType) {
                // Loop through and render all instances of this component type.
                $(componentType).each(function(i, elem) {
                    // Generate the React component object in the sandbox.
                    let reactObject = vm.runInContext(babel.transform($.html(elem)).code, sandbox);
                    // Render the React component object.
                    $(elem).replaceWith(reactServer.renderToStaticMarkup(reactObject));
                });
            });

            // Anything that has the data attribute `data-rovr-remove-wrapper="true"`, remove the outer
            // wrapper. React requires one, sometimes we don't need one.
            // Use a while loop so it catches inner children recursively.
            while ($('[data-rovr-remove-wrapper="true"]').length > 0) {
                $('[data-rovr-remove-wrapper="true"]').each(function(i, elem) {
                    $(elem).replaceWith($(elem).html());
                });
            }
        }

        // Add `hljs` class to every pre>code element.
        if (options.highlightSyntax) $('pre code').addClass('hljs');

        return $.html();
    }
}
