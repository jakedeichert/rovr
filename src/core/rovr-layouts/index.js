import path from 'path';

export default class RovrLayouts {
    pre(files, rovr, callback) {
        for (let f in files) {
            // Check if it's in the layouts folder.
            if (f.match(`^_layouts`) && f.match('.html$')) {
                rovr.layouts[f] = {
                    name: path.basename(f).replace('.html', ''),
                    fileData: files[f]
                };
                delete files[f];
            }
        }
        callback();
    }
}
