import {zip} from "../src/file";
import * as fs from "fs";
import {readPackageYml} from "../src/package";
import AdmZip, {IZipEntry} from "adm-zip";

const TEST_PACKAGE_PATH = '__tests__/data/test-addon/';

describe('file', () => {

    const cacheFileForTest = '/tmp/test.zip';
    beforeAll(() => {
        if (fs.existsSync(cacheFileForTest)) {
            fs.unlinkSync(cacheFileForTest);
        }
    });

    test('create test zip archive', async () => {
        const packageYml = await readPackageYml(TEST_PACKAGE_PATH);
        await zip(cacheFileForTest, TEST_PACKAGE_PATH, packageYml.package, packageYml.installer_ignore || []);

        expect(fs.existsSync(cacheFileForTest)).toBe(true);
    });

    test('check if zip archive is valid', async () => {
        const zipArchive = new AdmZip(cacheFileForTest);
        const zipEntries = zipArchive.getEntries();
        expect.arrayContaining<IZipEntry>(zipEntries);

    });

    test('check if zip archive contains the right files', async () => {
        const zipArchive = new AdmZip(cacheFileForTest);
        const zipEntries = zipArchive.getEntries();
        expect.arrayContaining<IZipEntry>(zipEntries);

        const filesList = Object.values(zipEntries)
            .filter(entry => entry.isDirectory === false)
            .map(entry => entry.entryName);
        expect.arrayContaining<string>(filesList);

        expect(filesList).toEqual([
            'test_addon/assets/test_addon.js',
            'test_addon/package-lock.json',
            'test_addon/package.json',
            'test_addon/package.yml',
        ]);
    });
});