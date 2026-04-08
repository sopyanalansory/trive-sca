import { afterEach, vi } from "vitest";

process.env.JWT_SECRET = "vitest-jwt-secret-please-use-32-chars-min";
process.env.NODE_ENV = "test";
process.env.LOG_LEVEL = "fatal";
process.env.MARKET_UPDATES_USERNAME = "test_market_api_user";
process.env.MARKET_UPDATES_PASSWORD = "test_market_api_secret";
delete process.env.UPSTASH_REDIS_REST_URL;
delete process.env.UPSTASH_REDIS_REST_TOKEN;

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});
