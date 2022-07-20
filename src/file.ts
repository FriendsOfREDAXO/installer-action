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

    ignoreList = appendDefaultRedaxoIgnoreList(ignoreList);

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

function appendDefaultRedaxoIgnoreList(ignoreList: string[]) {
    // ignore .git by default, because it's created by GitHub action
    ignoreList.push('.git/**');

    // keep in sync with rex_finder https://github.com/redaxo/redaxo/blob/992b3dbca9409935f3bb3ee22f17f1988f0932e0/redaxo/src/core/lib/util/finder.php#L243
    ignoreList.push('.DS_Store');
    ignoreList.push('Thumbs.db');
    ignoreList.push('desktop.ini');
    ignoreList.push('.svn');
    ignoreList.push('_svn');
    ignoreList.push('CVS');
    ignoreList.push('_darcs');
    ignoreList.push('.arch-params');
    ignoreList.push('.monotone');
    ignoreList.push('.bzr');
    ignoreList.push('.hg');

    // keep in sync with rex install https://github.com/redaxo/redaxo/blob/992b3dbca9409935f3bb3ee22f17f1988f0932e0/redaxo/src/addons/install/lib/api/api_package_upload.php#L33-L39
    ignoreList.push('.gitattributes');
    ignoreList.push('.github');
    ignoreList.push('.gitignore');
    ignoreList.push('.idea');
    ignoreList.push('.vscode');

    return ignoreList;
}

export function cacheFile(): string {
    const TMP_DIR = process.env['RUNNER_TEMP'] as string;
    return path.join(TMP_DIR, '/', Math.random()+'addon.zip');
}