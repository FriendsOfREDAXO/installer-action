import fs from "fs";
import archiver from "archiver";
import path from "path";
import * as Core from "@actions/core";

export async function zip(cacheFile: string, addonDir: string, addonName: string, ignoreList: string[]): Promise<void> {
    const output = fs.createWriteStream(cacheFile);
    const archive = archiver('zip', {});

    output.on('close', function() {
        Core.info(`Archive created with ${archive.pointer()} total bytes`);
    });
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

    archive.on('entry', entry => {
        Core.info(`Adding to zip: ${entry.name}`);
    });

    // @ts-ignore
    archive.glob('**', {cwd: addonDir, skip: ignoreList, ignore: ignoreList, dot: true}, {prefix: addonName})

    await archive.finalize();
}

export function cacheFile(): string {
    const TMP_DIR = process.env['RUNNER_TEMP'] as string;
    return path.join(TMP_DIR, '/', Math.random()+'addon.zip');
}