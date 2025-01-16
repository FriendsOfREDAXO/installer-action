import * as Core from '@actions/core';
import FormData from "form-data";
import fs from "fs";
import axios from "axios";

// only used properties from myredaxo api
type MyRedaxoPackage = {
    package: string;
    files: {
        [fileId: string]: {
            version: string;
        }
    }
}

export async function uploadArchive(addonKey: string, redaxoLogin: string, redaxoApiKey: string, version: string, description: string, md5Sum: string, archive: string): Promise<true|string> {

    const formData = new FormData();
    formData.append('file[version]', version);
    formData.append('file[redaxo_versions][0]', '5.x');
    formData.append('file[description]', description);
    formData.append('file[status]', '1');
    formData.append('file[checksum]', md5Sum);
    formData.append('archive', fs.createReadStream(archive));

    const contentLength = await new Promise((resolve, reject) => {
        formData.getLength((err, length) => {
            if (err) {
                return reject(err);
            }
            resolve(length)
        })
    });

    Core.info('Upload archive to redaxo.org');
    const response = await axios.post(`https://www.redaxo.org/de/ws/packages/?package=${addonKey}&file_id=0&api_login=${redaxoLogin}&api_key=${redaxoApiKey}`, formData, {
        headers: formData.getHeaders({
            'Content-Length': contentLength
        }),
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
    });

    // if upload success we receive an empty response
    if (200 === response.status && null === response.data) {
        Core.info('Upload succeed');
        return true;
    }

    Core.setFailed(`Upload failed with error: ${response.data.error}`);
    // if an error occurred, return it
    return response.data.error;
}

export async function fetchAddonPackageData(addonKey: string, redaxoLogin?: string, redaxoApiKey?: string): Promise<MyRedaxoPackage|null> {
    try {
        Core.info(`Fetch package.yml from redaxo.org for addon ${addonKey}`);
        let queryString = '?rex_version=5.x';
        if (redaxoLogin && redaxoApiKey) {
            queryString += `&api_login=${redaxoLogin}&api_key=${redaxoApiKey}`;
            Core.info(`Using login: ${redaxoLogin}`);
        } else {
            Core.info(`No credentials provided, using anonymous access`);
        }

        const responsePackage = await axios.get(`https://www.redaxo.org/de/ws/packages/${addonKey}/${queryString}`);
        if (!responsePackage.data.error) {
            return responsePackage.data;
        }

        const responsePackages = await axios.get(`https://www.redaxo.org/de/ws/packages/${queryString}`);
        if (responsePackages.data.error) {
            Core.info(`Could not fetch addon ${addonKey}: ${responsePackages.data.error}`);
            return null;
        }
        return responsePackages.data[addonKey] ?? null;
    } catch(e) {
        Core.info(`Could not fetch addon ${addonKey}`);
        return null;
    }
}

export function versionExists(packageYml: MyRedaxoPackage, version: string) {
    return Object.values(packageYml.files).some(file => file.version === version);
}