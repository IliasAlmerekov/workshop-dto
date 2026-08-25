import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // The local browser harness and Windows/WSL access the dev server through
  // 127.0.0.1. Without this, Next blocks HMR and dynamic chunks even though
  // the initial HTML still loads, leaving the browser on a stale hero render.
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
