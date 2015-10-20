import Rovr from '../core/index.js';
import fse from 'fs-extra';
import path from 'path';
import yaml from 'js-yaml';


let src = '.';
let dest = '_BUILD';
let config = {};
let siteMetadata = {};

function loadConfig() {
    try {
        let filePath = path.normalize(`${src}/_config.yml`);
        config = yaml.safeLoad(fse.readFileSync(filePath, 'utf8'));
    } catch(e) {
        console.log('INFO > no config file specified.. now using default');
        config = {};
    }
}


function loadMetadata() {
    try {
        let filePath = path.normalize(`${src}/_metadata.yml`);
        siteMetadata = yaml.safeLoad(fse.readFileSync(filePath, 'utf8'));
    } catch(e) {
        console.log('INFO > no global metadata file specified');
        siteMetadata = {};
    }
}







function run() {
    console.time('generation_time');
    loadConfig();
    loadMetadata();

    let rovr = new Rovr(src, dest, config, siteMetadata)
        // .pre(aPrePlugin())
        // .post(aPostPlugin())
        .build(function(err) {
            if (err) console.log(err);
            // build complete
            console.timeEnd('generation_time');
        });
}

run();
