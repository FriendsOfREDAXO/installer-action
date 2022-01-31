import * as Core from '@actions/core';
import FormData from "form-data";
import fs from "fs";
import axios from "axios";

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