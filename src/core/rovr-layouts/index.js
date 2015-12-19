import path from 'path';

export default class RovrLayouts {
    constructor() {
        this.layouts = [];
        Object.seal(this);
    }

    pre(files, rovr, callback) {
        for (let f of files) {
            // Check if it's in the layouts folder.
            if (f.path.match(`^_layouts`) && f.path.match('.html$')) {
                f.shouldParse = false;
                this.layouts.push({
                    name: path.basename(f.path).replace('.html', ''),
                    file: f
                });
            }
        }
        callback();
    }
}
