import * as dotenv from 'dotenv';

dotenv.config();

type SupportedEnv = 'local' | 'pipeline';

interface EnvConfig {
  env: SupportedEnv;
  baseUrl: string;
  apiBaseUrl: string;
  credentials: {
    standard: { username: string; password: string };
    lockedOut: { username: string; password: string };
    problem: { username: string; password: string };
    invalid: { username: string; password: string };
  };
}

const ENV = process.env.ENV as SupportedEnv | undefined;

/**
 * Fail-fast: the ENV variable must be explicitly set.
 * This prevents tests from silently running against the wrong environment.
 */
if (!ENV) {
  throw new Error(
    '[environment.ts] ENV is not set. ' +
    'Copy .env.example to .env and set ENV=local, or pass ENV=pipeline in CI.'
  );
}

const supportedEnvs: SupportedEnv[] = ['local', 'pipeline'];
if (!supportedEnvs.includes(ENV)) {
  throw new Error(
    `[environment.ts] ENV="${ENV}" is not supported. Valid values: ${supportedEnvs.join(', ')}`
  );
}

const envConfigs: Record<SupportedEnv, EnvConfig> = {
  local: {
    env: 'local',
    baseUrl: process.env.BASE_URL ?? 'https://www.saucedemo.com',
    apiBaseUrl: process.env.API_BASE_URL ?? 'https://fakestoreapi.com',
    credentials: {
      standard: { username: 'standard_user', password: 'secret_sauce' },
      lockedOut: { username: 'locked_out_user', password: 'secret_sauce' },
      problem: { username: 'problem_user', password: 'secret_sauce' },
      invalid: { username: 'invalid_user', password: 'wrong_password' },
    },
  },
  pipeline: {
    env: 'pipeline',
    baseUrl: process.env.BASE_URL ?? 'https://www.saucedemo.com',
    apiBaseUrl: process.env.API_BASE_URL ?? 'https://fakestoreapi.com',
    credentials: {
      standard: { username: 'standard_user', password: 'secret_sauce' },
      lockedOut: { username: 'locked_out_user', password: 'secret_sauce' },
      problem: { username: 'problem_user', password: 'secret_sauce' },
      invalid: { username: 'invalid_user', password: 'wrong_password' },
    },
  },
};

export const config: EnvConfig = envConfigs[ENV];
