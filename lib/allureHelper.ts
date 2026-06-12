import {
  step,
  feature,
  story,
  severity,
  issue,
  attachment,
  parentSuite as allureParentSuite,
  suite as allureSuite,
} from 'allure-js-commons';

/**
 * Wraps a test step with an Allure step label.
 * Mirrors the `executeStep` pattern used in conserv-automation and the WDIO boilerplate.
 */
export async function executeStep<T>(name: string, fn: () => Promise<T>): Promise<T> {
  return step(name, fn);
}

export async function addFeature(featureName: string): Promise<void> {
  await feature(featureName);
}

export async function addStory(storyName: string): Promise<void> {
  await story(storyName);
}

export async function setSeverity(
  sev: 'blocker' | 'critical' | 'normal' | 'minor' | 'trivial'
): Promise<void> {
  await severity(sev);
}

export async function addIssue(issueId: string, url?: string): Promise<void> {
  await issue(issueId, url ?? issueId);
}

export async function attachText(name: string, content: string): Promise<void> {
  await attachment(name, content, { contentType: 'text/plain' });
}

export async function attachJson(name: string, content: unknown): Promise<void> {
  await attachment(name, JSON.stringify(content, null, 2), {
    contentType: 'application/json',
  });
}

/**
 * Labels the current test in Allure based on the test file path.
 * Path:  tests/web/login.spec.ts  →  parentSuite: WEB, suite: login
 *        tests/api/products.spec.ts → parentSuite: API, suite: products
 */
export async function applyAllureLabels(filePath: string): Promise<void> {
  const parts = filePath.replace(/\\/g, '/').split('/');
  const testsIdx = parts.lastIndexOf('tests');
  const parent = testsIdx >= 0 ? (parts[testsIdx + 1] ?? 'unknown').toUpperCase() : 'UNKNOWN';
  const fileName = parts[parts.length - 1] ?? '';
  const suiteName = fileName.replace(/\.spec\.ts$/, '').replace(/[_-]/g, ' ');
  await allureParentSuite(parent);
  await allureSuite(suiteName);
}

/** @deprecated use applyAllureLabels instead */
export function labelFromPath(filePath: string): { parentSuite: string; suite: string } {
  const parts = filePath.replace(/\\/g, '/').split('/');
  const testsIdx = parts.lastIndexOf('tests');
  const parentSuite = testsIdx >= 0 ? (parts[testsIdx + 1] ?? 'unknown').toUpperCase() : 'UNKNOWN';
  const fileName = parts[parts.length - 1] ?? '';
  const suiteName = fileName.replace(/\.spec\.ts$/, '').replace(/[_-]/g, ' ');
  return { parentSuite, suite: suiteName };
}
