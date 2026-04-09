import { afterEach, vi } from "vitest";

vi.stubEnv("JWT_SECRET", "vitest-jwt-secret-please-use-32-chars-min");
vi.stubEnv("NODE_ENV", "test");
vi.stubEnv("LOG_LEVEL", "fatal");
vi.stubEnv("MARKET_UPDATES_USERNAME", "test_market_api_user");
vi.stubEnv("MARKET_UPDATES_PASSWORD", "test_market_api_secret");
vi.stubEnv("SALESFORCE_PLATFORM_SYNC_USER", "test_platform_sync_user");
vi.stubEnv("SALESFORCE_PLATFORM_SYNC_PASSWORD", "test_platform_sync_secret");
delete process.env.UPSTASH_REDIS_REST_URL;
delete process.env.UPSTASH_REDIS_REST_TOKEN;

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});
