import {readPackageYml, validatePackageVersion, validateRedaxoAddon} from "../src/package";
import fs from "fs";
import os from "os";
import path from "path";

const TEST_PACKAGE_PATH = '__tests__/data/test-addon/';

describe('package', () => {
    describe('readPackageYml', () => {
        test('should return parsed yaml', async () => {
            const yaml = await readPackageYml(TEST_PACKAGE_PATH)

            expect(yaml.package).toBe('test_addon');
            expect(yaml.version).toBe('1.0.5');
        });
    });

    test('validatePackageVersion', () => {
        expect(validatePackageVersion('1.0.0', '1.0.0')).toBe(true);
        expect(validatePackageVersion('1.0.0', '1.0.2')).toBe(false);

        expect(validatePackageVersion('1.0.0-beta1', '1.0.0-beta1')).toBe(true);
        expect(validatePackageVersion('1.0.0-beta1', '1.0.0-beta2')).toBe(false);

        expect(validatePackageVersion('1.0.0', 'v1.0.0')).toBe(false);
        expect(validatePackageVersion('1.0.0', 'v1.0.0')).toBe(false);
    });

    describe('validateRedaxoAddon', () => {
        test('should validate a proper addon fixture', async () => {
            const packageYml = await readPackageYml(TEST_PACKAGE_PATH);
            expect(() => validateRedaxoAddon(packageYml, TEST_PACKAGE_PATH)).not.toThrow();
        });

        test('should fail for invalid package key', () => {
            const packageYml = {
                package: 'Invalid-Key',
                version: '1.0.0',
                installer_ignore: null,
                requires: {
                    redaxo: '^5.0.0',
                },
            };
            expect(() => validateRedaxoAddon(packageYml, TEST_PACKAGE_PATH)).toThrow('Invalid package key');
        });

        test('should fail if requires.redaxo is missing', () => {
            const packageYml = {
                package: 'valid_addon',
                version: '1.0.0',
                installer_ignore: null,
            };
            expect(() => validateRedaxoAddon(packageYml, TEST_PACKAGE_PATH)).toThrow('Missing requires.redaxo');
        });

        test('should fail if package.yml is ignored', () => {
            const packageYml = {
                package: 'valid_addon',
                version: '1.0.0',
                installer_ignore: ['package.yml'],
                requires: {
                    redaxo: '^5.0.0',
                },
            };
            expect(() => validateRedaxoAddon(packageYml, TEST_PACKAGE_PATH)).toThrow('installer_ignore must not exclude package.yml');
        });

        test('should fail if addon has no typical REDAXO structure indicators', () => {
            const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'installer-action-empty-addon-'));
            const packageYml = {
                package: 'valid_addon',
                version: '1.0.0',
                installer_ignore: null,
                requires: {
                    redaxo: '^5.0.0',
                },
            };

            expect(() => validateRedaxoAddon(packageYml, tempDir)).toThrow('Addon directory does not contain typical REDAXO addon files/folders');
            fs.rmSync(tempDir, { recursive: true, force: true });
        });
    });
});