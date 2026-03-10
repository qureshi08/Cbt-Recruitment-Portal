import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    experimental: {
        serverActions: {
            bodySizeLimit: "10mb",
        },
    },
    // Prevent bundling of packages that rely on native Node/C++) addons
    // or browser-only APIs (DOMMatrix, canvas) when running on the server
    serverExternalPackages: ["pdf-parse", "canvas"],
};

export default nextConfig;
