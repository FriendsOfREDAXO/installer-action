import {readPackageYml, validatePackageVersion} from "../src/package";

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
    })
});