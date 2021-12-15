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
    return YAML.parse(packageYmlString);
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