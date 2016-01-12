import path from 'path';

export default class RovrComponents {
    constructor() {
        this.components = [];
        Object.seal(this);
    }

    pre(files, rovr, callback) {
        for (let f of files) {
            // Check if it's in the components folder.
            if (f.path.match(`^_components`) && f.path.match('.jsx?$')) {
                f.shouldParse = false;
                this.components.push({
                    name: path.basename(f.path).replace(/\.jsx?$/, ''),
                    file: f
                });
            }
        }
        callback();
    }
}
