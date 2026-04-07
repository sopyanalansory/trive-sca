import type { NextConfig } from "next";
import { getPublicBasePath } from "./lib/public-base-path";

const basePath = getPublicBasePath() || undefined;

const nextConfig: NextConfig = {
  basePath,
};

export default nextConfig;
