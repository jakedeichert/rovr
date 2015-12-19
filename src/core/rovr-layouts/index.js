import path from 'path';

export default class RovrLayouts {
    pre(files, rovr, callback) {
        for (let f of files) {
            // Check if it's in the layouts folder.
            if (f.path.match(`^_layouts`) && f.path.match('.html$')) {
                rovr.layouts[f.path] = {
                    name: path.basename(f.path).replace('.html', ''),
                    fileData: f
                };
                f.shouldParse = false;
            }
        }
        callback();
    }
}
