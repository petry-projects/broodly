import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const repoRoot = resolve(__dirname, '..', '..', '..');
const moduleDir = resolve(repoRoot, 'infra', 'terraform', 'modules', 'firebase');

describe('Terraform Firebase module', () => {
  it('main.tf exists', () => {
    expect(existsSync(resolve(moduleDir, 'main.tf'))).toBe(true);
  });

  it('variables.tf exists', () => {
    expect(existsSync(resolve(moduleDir, 'variables.tf'))).toBe(true);
  });

  it('outputs.tf exists', () => {
    expect(existsSync(resolve(moduleDir, 'outputs.tf'))).toBe(true);
  });

  describe('outputs.tf', () => {
    let outputsContent: string;

    beforeAll(() => {
      outputsContent = readFileSync(resolve(moduleDir, 'outputs.tf'), 'utf-8');
    });

    it.each([
      'web_app_id',
      'api_key',
      'auth_domain',
      'storage_bucket',
      'messaging_sender_id',
      'app_id',
      'project_id',
    ])('exports output "%s"', (outputName) => {
      expect(outputsContent).toContain(`output "${outputName}"`);
    });

    it('marks api_key as sensitive', () => {
      // api_key output block should contain sensitive = true
      const apiKeyBlock = outputsContent.slice(
        outputsContent.indexOf('output "api_key"'),
        outputsContent.indexOf('}', outputsContent.indexOf('output "api_key"')) + 1,
      );
      expect(apiKeyBlock).toContain('sensitive');
      expect(apiKeyBlock).toContain('true');
    });

    it('includes env var mapping in descriptions', () => {
      // Outputs should reference the EXPO_PUBLIC_ env vars they map to
      expect(outputsContent).toContain('EXPO_PUBLIC_FIREBASE_API_KEY');
      expect(outputsContent).toContain('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN');
      expect(outputsContent).toContain('EXPO_PUBLIC_FIREBASE_PROJECT_ID');
    });
  });

  describe('variables.tf', () => {
    let varsContent: string;

    beforeAll(() => {
      varsContent = readFileSync(resolve(moduleDir, 'variables.tf'), 'utf-8');
    });

    it.each(['project_id', 'environment', 'display_name'])(
      'declares variable "%s"',
      (varName) => {
        expect(varsContent).toContain(`variable "${varName}"`);
      },
    );
  });
});
