import * as Core from '@actions/core';
import {md5_file, readPackageYml, validatePackageVersion} from "./package";
import {cacheFile, zip} from "./file";
import {fetchAddonPackageYml, uploadArchive, versionExists} from "./myRedaxo";

const packageDir = Core.getInput('cwd');
const archiveFilePath = cacheFile();

// main procedure
(async function () {
    try {
        const myRedaxoUsername = Core.getInput('myredaxo-username');
        const myRedaxoApiKey = Core.getInput('myredaxo-api-key');

        const packageYml = await readPackageYml(packageDir);
        const packageVersion = packageYml.version;
        const packageName = packageYml.package;
        const packageInstallerIgnore = packageYml.installer_ignore || [];

        const releaseVersion = Core.getInput('version');
        if (!validatePackageVersion(packageVersion, releaseVersion)) {
            Core.setFailed(`Release tag version doesn't match package.yml version. Release version: "${releaseVersion}", package.yml version: "${packageVersion}"`);
            return;
        }

        const existingPackageYml = await fetchAddonPackageYml(packageName, myRedaxoUsername, myRedaxoApiKey);
        if (!existingPackageYml) {
            Core.setFailed(`Could not fetch addon ${packageName}. Please check your addon key and your MyRedaxo credentials.`);
            return;
        }

        if (versionExists(existingPackageYml, packageVersion)) {
            Core.setFailed(`Version ${packageVersion} already exists. Please check your package.yml and github release version.`);
            return;
        }

        await zip(archiveFilePath, packageDir, packageName, packageInstallerIgnore);
        const archiveMd5 = await md5_file(archiveFilePath);

        Core.info(`Created zip file md5: ${archiveMd5}`);

        await uploadArchive(
            packageName,
            myRedaxoUsername,
            myRedaxoApiKey,
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