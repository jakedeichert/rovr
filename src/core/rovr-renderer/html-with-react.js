import * as babel from 'babel-core';
import babelPresetES2015 from 'babel-preset-es2015';
import babelPresetReact from 'babel-preset-react';
import reactServer from 'react-dom/server';
import cheerio from 'cheerio';
import vm from 'vm';


export default class HtmlWithReact {
    /**
     * Constructor for HtmlWithReact.
     * @param {Object[]} reactComponentData - List of objects containing component names and files.
     * @param {Object} context - An optional object to add more context to the VM sandbox.
     * @desc
     * The reactComponentData list should contain objects in this format:
     * {
     *      name: 'ComponentName',
     *      file: RovrFile
     * }
     */
    constructor(reactComponentData, context = {}) {
        // Compile react component files into one string.
        this.reactComponents = '';
        for (let component of reactComponentData) {
            this.reactComponents += component.file.body;
        }

        // Load the optional context and React into a VM sandbox.
        this.vmSandbox = context;
        this.vmSandbox.React = require('react');
        vm.createContext(this.vmSandbox);
        this.babelOptions = {
            presets: [
                babelPresetES2015,
                babelPresetReact
            ],
            ast: false
        };

        // Transform the jsx to js and then load the classes into the sandboxed context.
        vm.runInContext(babel.transform(this.reactComponents, this.babelOptions).code, this.vmSandbox);
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
            let reactComponentTypes = new Set();

            // Add all individual types to a set.
            for (let i of componentsInView) {
                reactComponentTypes.add(i.substr(1, i.length-2));
            }

            // Render each React component that is found in the view.
            reactComponentTypes.forEach((componentType) => {
                // Loop through and render all instances of this component type.
                $(componentType).each((i, elem) => {
                    // Generate the React component object in the sandbox.
                    let reactObject = vm.runInContext(babel.transform($.html(elem), this.babelOptions).code, this.vmSandbox);
                    // Render the React component object.
                    $(elem).replaceWith(reactServer.renderToStaticMarkup(reactObject));
                });
            });

            // Anything that has the data attribute `data-rovr-remove-wrapper="true"`, remove the outer
            // wrapper. React requires one, sometimes we don't need one.
            // Use a while loop so it catches inner children recursively.
            while ($('[data-rovr-remove-wrapper="true"]').length > 0) {
                $('[data-rovr-remove-wrapper="true"]').each((i, elem) => {
                    $(elem).replaceWith($(elem).html());
                });
            }
        }

        // Add `hljs` class to every pre>code element.
        if (options.highlightSyntax === true) $('pre code').addClass('hljs');

        // Remove all empty paragraph tags that cheerio generates. Cheerio
        // generates these to fix broken <p> tag output that marked
        // generates under certain circumstances.
        return $.html().replace(/<p><\/p>/g, '');
    }
}
