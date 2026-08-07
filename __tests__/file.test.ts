import {zip} from "../src/file";
import * as fs from "fs";
import {readPackageYml} from "../src/package";
import AdmZip, {IZipEntry} from "adm-zip";
import path from "path";
import os from "os";

const TEST_PACKAGE_PATH = '__tests__/data/test-addon/';

describe('file', () => {

    const cacheFileForTest = '/tmp/test.zip';
    let tempAddonRoot = '';
    let tempAddonPath = '';

    beforeAll(() => {
        if (fs.existsSync(cacheFileForTest)) {
            fs.unlinkSync(cacheFileForTest);
        }

        tempAddonRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'installer-action-test-addon-'));
        tempAddonPath = path.join(tempAddonRoot, 'test-addon');
        fs.cpSync(TEST_PACKAGE_PATH, tempAddonPath, {recursive: true});

        fs.mkdirSync(path.join(tempAddonPath, '.git'), {recursive: true});
        fs.writeFileSync(path.join(tempAddonPath, '.git', 'HEAD'), 'ref: refs/heads/master\n');
        fs.mkdirSync(path.join(tempAddonPath, '.github'), {recursive: true});
        fs.writeFileSync(path.join(tempAddonPath, '.github', 'workflow.yml'), 'name: test\n');
    });

    afterAll(() => {
        if (tempAddonRoot) {
            fs.rmSync(tempAddonRoot, {recursive: true, force: true});
        }
    });

    test('create test zip archive', async () => {
        const packageYml = await readPackageYml(tempAddonPath);
        await zip(cacheFileForTest, tempAddonPath, packageYml.package, packageYml.installer_ignore || []);

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

        const hasGitMetadata = filesList.some((entryName) => entryName.includes('/.git/') || entryName.includes('/.github/'));
        expect(hasGitMetadata).toBe(false);
    });
});