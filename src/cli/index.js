import Rovr from '../core/index.js';
import fse from 'fs-extra';
import path from 'path';
import yaml from 'js-yaml';


function attemptLoadObjectData(pathAttempts) {
    let i = 0;
    while (i < pathAttempts.length) {
        try {
            return yaml.safeLoad(fse.readFileSync(pathAttempts[i], 'utf8'));
        } catch(e) {
            console.log(`INFO > couldn't find ${pathAttempts[i]}`);
        }
        i++;
    }
    return {};
}








function run() {
    console.time('generation_time');
    let src = '.';
    let dest = '_BUILD';
    let config = attemptLoadObjectData([
        path.normalize(`${src}/_config.yml`),
        path.normalize(`${src}/_config.json`)
    ]);
    let siteMetadata = attemptLoadObjectData([
        path.normalize(`${src}/_metadata.yml`),
        path.normalize(`${src}/_metadata.json`)
    ]);

    let rovr = new Rovr(src, dest, config, siteMetadata)
        // .use(new SomePlugin())
        .build()
        .then(() => {
            console.log('rovr generation complete');
            console.timeEnd('generation_time');
        })
        .catch((reason) => {
            console.log(`rovr generation failed: ${reason}`);
        });
}

run();
