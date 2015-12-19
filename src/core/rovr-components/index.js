import path from 'path';

export default class RovrComponents {
    pre(files, rovr, callback) {
        for (let f of files) {
            // Check if it's in the components folder.
            if (f.path.match(`^_components`) && f.path.match('.jsx?$')) {
                rovr.components[f.path] = {
                    name: path.basename(f.path).replace(/\.jsx?$/, ''),
                    fileData: f
                };
                f.shouldParse = false;
            }
        }
        callback();
    }
}
