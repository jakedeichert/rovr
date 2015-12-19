import pathUtil from 'path';
import fse from 'fs-extra';
import utf8 from 'utf8';
import frontMatter from 'front-matter';

export default class RovrFile {
    constructor(path, srcDir) {
        this.path = path;
        this.srcDir = srcDir;
        this.shouldParse = true;
        this.isUTF8 = true;
        this.body = '';
        this.metadata = {};
        this._loadData();
        Object.seal(this);
    }

    /**
     * Save this file to a destination directory.
     * @param {string} destDir - The destination directory.
     */
    save(destDir) {
        // Skip if it shouldn't be saved.
        if (!this._shouldSave()) return;

        let srcPath = pathUtil.normalize(`${this.srcDir}/${this.path}`);
        let destPath = pathUtil.normalize(`${destDir}/${this.path}`);

        if (this.body !== '') {
            fse.outputFileSync(destPath, this.body);
        } else {
            // If there's no body, then just do a direct file copy.
            fse.copySync(srcPath, destPath);
        }
    }

    /**
     * Determine if the file should be saved to the destination.
     * @returns {bool} Whether it should be saved or not.
     * @desc Files and directories that start with an underscore
     * will not be saved.
     */
    _shouldSave() {
        return !/\/_/g.test(`/${this.path}`);
    }

    /**
     * Read the file if it's utf8 encoded and parse for front matter.
     */
    _loadData() {
        let fileData = fse.readFileSync(pathUtil.normalize(`${this.srcDir}/${this.path}`));
        try {
            // Parse for front matter if it's a utf8 file.
            let fileContents = utf8.decode(fileData.toString());
            // Get the front matter attributes and body from the file contents.
            let fm = frontMatter(fileContents);
            this.body = fm.body;
            this.metadata = fm.attributes;
            // Don't parse this file if it didn't have a front matter header at all.
            if (!frontMatter.test(fileContents)) this.shouldParse = false;
        } catch(e) {
            // If not utf8 encoded, it should not be parsed.
            this.shouldParse = false;
            this.isUTF8 = false;
        }
    }
}
