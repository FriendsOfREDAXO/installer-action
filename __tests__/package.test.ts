import {readPackageYml} from "../src/package";

const TEST_PACKAGE_PATH = '__tests__/data/test-addon/';

describe('package', () => {
    describe('readPackageYml', () => {
        test('should return parsed yaml', async () => {
            const yaml = await readPackageYml(TEST_PACKAGE_PATH)

            expect(yaml.package).toBe('test_addon');
            expect(yaml.version).toBe('1.0.5');
        });
    });
});