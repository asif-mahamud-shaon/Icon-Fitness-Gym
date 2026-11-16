import * as crypto from 'crypto';

const EPHEMERAL_TEST_SECRETS = new Map<string, string>();

const WEAK_PLACEHOLDERS = new Set([
  'ifg_ashkona_dhaka_jwt_access_secret_key_2026_production_grade_9f8e7d6c5b4a',
  'ifg_ashkona_dhaka_jwt_refresh_secret_key_2026_production_grade_1a2b3c4d5e6f',
  'icon-fitness-gym-ashkona-biometric-aes256-key-2026',
  'icon-fitness-ashkona-biometric-salt',
  'change-me',
  'secret',
  'changeme',
]);

function isTestRuntime(): boolean {
  return process.env.NODE_ENV === 'test' || Boolean(process.env.JEST_WORKER_ID);
}

/**
 * Resolves a required cryptographic secret from environment configuration.
 * - Never falls back to a static hardcoded secret string.
 * - In Jest / test mode, generates an ephemeral per-process CSPRNG secret if unset.
 * - Outside test mode, fails closed when missing, shorter than 32 chars, or weak.
 */
export function resolveRequiredSecret(
  envKey: string,
  configuredValue?: string | null,
): string {
  const candidate = (configuredValue ?? process.env[envKey] ?? '').trim();

  if (candidate && candidate.length >= 32 && !WEAK_PLACEHOLDERS.has(candidate)) {
    return candidate;
  }

  if (isTestRuntime()) {
    let testSecret = EPHEMERAL_TEST_SECRETS.get(envKey);
    if (!testSecret) {
      testSecret = crypto.randomBytes(32).toString('hex');
      EPHEMERAL_TEST_SECRETS.set(envKey, testSecret);
    }
    return testSecret;
  }

  if (!candidate) {
    throw new Error(
      `Security configuration error: required secret "${envKey}" is missing.`,
    );
  }

  throw new Error(
    `Security configuration error: "${envKey}" is weak or uses an insecure placeholder (minimum 32 random characters required).`,
  );
}

/**
 * Validates critical application secrets at bootstrap before serving traffic.
 */
export function validateSecurityEnvironment(
  getEnv: (key: string) => string | undefined,
): void {
  const accessSecret = resolveRequiredSecret(
    'JWT_ACCESS_SECRET',
    getEnv('JWT_ACCESS_SECRET'),
  );
  const refreshSecret = resolveRequiredSecret(
    'JWT_REFRESH_SECRET',
    getEnv('JWT_REFRESH_SECRET'),
  );
  if (accessSecret === refreshSecret && !isTestRuntime()) {
    throw new Error(
      'Security configuration error: JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be distinct.',
    );
  }

  resolveRequiredSecret(
    'BIOMETRIC_ENCRYPTION_KEY',
    getEnv('BIOMETRIC_ENCRYPTION_KEY'),
  );
  resolveRequiredSecret('BIOMETRIC_HASH_SALT', getEnv('BIOMETRIC_HASH_SALT'));
}

