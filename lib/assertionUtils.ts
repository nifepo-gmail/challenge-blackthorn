import { executeStep } from './allureHelper';

interface Assertion<T> {
  description: string;
  actual: T;
  expected: T;
  matcher: 'toEqual' | 'toBe' | 'toContain' | 'toBeCloseTo';
  precision?: number;
}

interface AssertionBuilder {
  expect<T>(
    description: string,
    actual: T,
    expected: T,
    matcher?: Assertion<T>['matcher'],
    precision?: number
  ): AssertionBuilder;
  finalize(): Promise<void>;
}

/**
 * Fluent assertion utility with Allure step integration.
 * Mirrors the AssertionUtils pattern from conserv-automation and the WDIO boilerplate.
 *
 * Usage:
 *   const assertions = assertionUtils.initialize('Login page assertions');
 *   assertions.expect('Page title', title, 'Swag Labs');
 *   assertions.expect('Error visible', errorVisible, true);
 *   await assertions.finalize();
 */
function initialize(suiteName: string): AssertionBuilder {
  const queue: Assertion<unknown>[] = [];

  const builder: AssertionBuilder = {
    expect<T>(
      description: string,
      actual: T,
      expected: T,
      matcher: Assertion<T>['matcher'] = 'toEqual',
      precision?: number
    ): AssertionBuilder {
      queue.push({ description, actual, expected, matcher, precision } as Assertion<unknown>);
      return builder;
    },

    async finalize(): Promise<void> {
      for (const assertion of queue) {
        const actualStr   = JSON.stringify(assertion.actual);
        const expectedStr = JSON.stringify(assertion.expected);
        const matcherMap: Record<string, string> = {
          toBe:        '===',
          toEqual:     'deep===',
          toContain:   'contains',
          toBeCloseTo: '≈',
        };
        const op = matcherMap[assertion.matcher] ?? assertion.matcher;
        const label = `Assert: ${assertion.description}  →  actual: ${actualStr}  ${op}  expected: ${expectedStr}`;
        await executeStep(label, async () => {
          const a = assertion.actual;
          const e = assertion.expected;
          switch (assertion.matcher) {
            case 'toBe':
              if (a !== e) throw new Error(`actual ${actualStr} !== expected ${expectedStr}`);
              break;
            case 'toContain':
              if (typeof a === 'string' && typeof e === 'string') {
                if (!a.includes(e)) throw new Error(`actual ${actualStr} does not contain ${expectedStr}`);
              } else if (Array.isArray(a)) {
                if (!a.includes(e)) throw new Error(`array does not contain ${expectedStr}`);
              }
              break;
            case 'toBeCloseTo': {
              const factor = Math.pow(10, assertion.precision ?? 2);
              if (Math.round((a as number) * factor) !== Math.round((e as number) * factor))
                throw new Error(`actual ${actualStr} not close to ${expectedStr} (precision ${assertion.precision ?? 2})`);
              break;
            }
            case 'toEqual':
            default:
              if (JSON.stringify(a) !== JSON.stringify(e))
                throw new Error(`actual ${actualStr} does not deep equal ${expectedStr}`);
          }
        });
      }
    },
  };

  return builder;
}

export const assertionUtils = { initialize };
