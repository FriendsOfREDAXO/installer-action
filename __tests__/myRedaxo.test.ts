import {fetchAddonPackageYml, versionExists} from "../src/myRedaxo";

const testMyRedaxoPackage = require('./data/myRedaxoPackage.json');

describe('myRedaxo', () => {
    describe('fetchAddon',  () => {
        test('should error with 404', async () => {
            const packageYml = await fetchAddonPackageYml('non_existing_addon');

            expect(packageYml).toBe(null);
        });
        test('should return addon data', async () => {
            const packageYml = await fetchAddonPackageYml('yform');

            expect(packageYml).toHaveProperty('name');
        });
    });
    describe('versionExists', () => {
        test('should return true if version exists', () => {
            expect(versionExists(testMyRedaxoPackage, '3.1.1')).toBe(true);
        });
        test('should return false if version does not exist', () => {
            expect(versionExists(testMyRedaxoPackage, '1.1.1')).toBe(false);
        });
    });
});