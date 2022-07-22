import fs from "fs";
import archiver from "archiver";
import path from "path";
import * as Core from "@actions/core";

export async function zip(cacheFile: string, addonDir: string, addonName: string, ignoreList: string[]): Promise<void> {
    const output = fs.createWriteStream(cacheFile);
    const archive = archiver('zip', {});

    archive.on('warning', function(err) {
        if (err.code === 'ENOENT') {
            Core.warning(err);
        } else {
            Core.setFailed(err);
            throw err;
        }
    });

    archive.on('error', function(err) {
        Core.setFailed(err);
        throw err;
    });

    archive.pipe(output);

    Core.info(`Creating archive in ${cacheFile}`);
    Core.info(`Using installer_ignore ${JSON.stringify(ignoreList)}`);

    // ignore .git by default, because it's created by GitHub action
    ignoreList.push('.git/**');

    archive.on('entry', entry => {
        Core.info(`Adding to zip: ${entry.name}`);
    });

    // @ts-ignore
    archive.glob('**', {cwd: addonDir, skip: ignoreList, ignore: ignoreList, dot: true}, {prefix: addonName})

    // we need to manually check if the zip archive is finalized
    // see https://github.com/archiverjs/node-archiver/blob/b5cc14cc97cc64bdca32c0cbe9d660b5b979be7c/lib/core.js#L760-L769
    return await new Promise(async (resolve, reject) => {
        await archive.finalize();
        output.on('close', function() {
            Core.info(`Archive created with ${archive.pointer()} total bytes`);
            resolve();
        });
    });
}

export function cacheFile(): string {
    const TMP_DIR = process.env['RUNNER_TEMP'] as string;
    return path.join(TMP_DIR, '/', Math.random()+'addon.zip');
}