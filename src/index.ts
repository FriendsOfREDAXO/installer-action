import * as Core from '@actions/core';
import {md5_file, readPackageYml, validatePackageVersion} from "./package";
import {cacheFile, zip} from "./file";
import {uploadArchive} from "./myRedaxo";

const packageDir = Core.getInput('cwd');
const archiveFilePath = cacheFile();

// main procedure
(async function () {
    try {
        const packageYml = await readPackageYml(packageDir);
        const packageVersion = packageYml.version;
        const packageName = packageYml.package;
        const packageInstallerIgnore = packageYml.installer_ignore || [];

        const releaseVersion = Core.getInput('version');
        if (!validatePackageVersion(packageVersion, releaseVersion)) {
            Core.setFailed(`Release tag version doesn't match package.yml version. Release version: "${releaseVersion}", package.yml version: "${packageVersion}"`);
            return;
        }

        await zip(archiveFilePath, packageDir, packageName, packageInstallerIgnore);
        const archiveMd5 = await md5_file(archiveFilePath);

        Core.info(`Created zip file md5: ${archiveMd5}`);

        await uploadArchive(
            packageName,
            Core.getInput('myredaxo-username'),
            Core.getInput('myredaxo-api-key'),
            packageVersion,
            Core.getInput('description'),
            archiveMd5,
            archiveFilePath
        );

    } catch (error) {
        Core.setFailed(error as string)
        throw error;
    }
})();