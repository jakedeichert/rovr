import path from 'path';

export default class RovrComponents {
    pre(files, rovr, callback) {
        for (let f in files) {
            // Check if it's in the components folder.
            if (f.match(`^_components`) && f.match('.jsx?$')) {
                rovr.components[f] = {
                    name: path.basename(f).replace(/\.jsx?$/, ''),
                    fileData: files[f]
                };
                delete files[f];
            }
        }
        callback();
    }
}
