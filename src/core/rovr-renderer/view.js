import merge from 'merge';

export default class View {
    constructor(content, metadata) {
        this.content = content;
        this.metadata = metadata;
    }

    /**
     * Apply a layout to this view.
     * @param {View} layout - The layout object.
     */
    applyLayout(layout) {
        this.content = layout.content.replace(/\{\{\s*content\s*\}\}/, this.content);
        this.metadata = merge.recursive(true, layout.metadata, this.metadata);
    }

    /**
     * Replaces strings with their metadata variables.
     * @param {string} scopeName - The initial object used within the string to reference this metadata.
     * @param {Object} scopeData - The data used to replace the string references.
     * @desc
     *  Example:
     *      If scopeName equals "site", then this method will search the
     *      content for instances of {{ site.* }} which is then replaced
     *      with the data from the scopeData.
     *
     * {{ site.author.first }} would be replaced with scopeData["author"]["first"]
     */
    applyMetadata(scopeName, scopeData) {
        let metadataInstances = this.content.match(new RegExp(`{{\\s*${scopeName}\\.[a-zA-Z_\\.]+\\s*}}`, 'g'));

        // Ensure match is not null.
        if (metadataInstances) {
            for (let i of metadataInstances) {
                let pieces = i.replace(/[\{\}]/g, '').trim().replace(new RegExp(`^${scopeName}\\.`), '').split('.');
                let data = scopeData;
                // Access the scope data part by part.
                for (let p of pieces) {
                    data = data[p];
                    if (!data) break;
                }
                // Replace all metadata instances of 'i' with the data.
                // If data is not defined for the metadata, then change to empty string.
                this.content = this.content.replace(i, data ? data : '');
            }
        }
    }
}
