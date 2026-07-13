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
    requires?: {
        redaxo?: string;
    };
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

export function validateRedaxoAddon(packageYml: PackageYml, addonDir: string): void {
    if (!packageYml || 'object' !== typeof packageYml) {
        throw new Error('Invalid package.yml content.');
    }

    if (!packageYml.package || !/^[a-z][a-z0-9_]*$/.test(packageYml.package)) {
        throw new Error('Invalid package key in package.yml. Expected format: lowercase letters, digits and underscores, starting with a letter.');
    }

    if (!packageYml.version || 'string' !== typeof packageYml.version) {
        throw new Error('Invalid or missing version in package.yml.');
    }

    const redaxoConstraint = packageYml.requires?.redaxo;
    if (!redaxoConstraint || 'string' !== typeof redaxoConstraint) {
        throw new Error('Missing requires.redaxo in package.yml. This does not look like a valid REDAXO addon package definition.');
    }

    const ignoreList = packageYml.installer_ignore || [];
    if (ignoreList.some((pattern) => /(^|\/)package\.yml$/.test(pattern))) {
        throw new Error('installer_ignore must not exclude package.yml.');
    }

    const indicators = ['boot.php', 'install.php', 'update.php', 'uninstall.php', 'lib', 'pages', 'lang', 'fragments', 'assets'];
    const hasIndicator = indicators.some((fileOrDir) => fs.existsSync(path.join(addonDir, fileOrDir)));
    const rootEntries = fs.readdirSync(addonDir, { withFileTypes: true })
        .map((entry) => entry.name)
        .filter((name) => !name.startsWith('.'));
    const relevantEntries = rootEntries.filter((name) => !['package.yml', 'README.md'].includes(name));

    if (!hasIndicator && 0 === relevantEntries.length) {
        throw new Error('Addon directory does not contain typical REDAXO addon files/folders (e.g. boot.php, install.php, lib, pages, lang).');
    }

    if (!hasIndicator) {
        Core.warning('Addon structure looks unusual (no typical REDAXO addon indicators found). Upload continues because package.yml validation passed.');
    }
}
