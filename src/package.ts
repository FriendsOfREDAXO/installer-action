import * as Core from '@actions/core';
import path from "path";
import fs from "fs";
import YAML from "yaml";
import crypto from "crypto";

// only the properties we work with
interface PackageYml {
    package: string;
    version: string;
    installer_ignore: string[]|null;
}

export async function readPackageYml(addonDir: string): Promise<PackageYml> {
    const packageYmlPath = path.join(addonDir, '/', 'package.yml');
    Core.info(`Parsing yaml from ${packageYmlPath}`);
    const packageYmlString = fs.readFileSync(packageYmlPath, {encoding: 'utf8'});

    try {
        return YAML.parse(packageYmlString, {
            prettyErrors: true,
        });
    } catch (originalError) {
        Core.error(`Failed to parse yaml from ${packageYmlPath}. Try to fix it automatically.`);

        // try to escape "perm" value
        const fixedPackageYmlString = packageYmlString.replace(/(perm:[.\s\n\r\t]*)([a-z0-9_]+\[[a-z0-9_]+\])/ig, `$1'$2'`);

        // second try with escaped "perm" value
        try {
            const parsedYaml = YAML.parse(fixedPackageYmlString, {
                prettyErrors: true,
            });
            Core.info(`Successfully parsed yaml with fixed values.`);

            return parsedYaml;
        } catch (_) {
            // failed to parse yaml with fixed values
            Core.error(`Automatically fixed yaml failed. Please fix it manually.`);
            throw originalError;
        }
    }
}

export function md5_file(file: string): Promise<string> {
    return new Promise((resolve, reject) => {
        try {
            let md5 = crypto.createHash('md5');
            let fileStream = fs.createReadStream(file)
            fileStream.on('data', data => md5.update(data));
            fileStream.on('end', () => resolve(md5.digest('hex')))
        } catch (error) {
            reject(error);
        }
    });
}

export function validatePackageVersion(packageYmlVersion: string, releaseVersion: string): boolean {
    return packageYmlVersion === releaseVersion;
}
