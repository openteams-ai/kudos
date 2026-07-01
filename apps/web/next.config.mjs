/** @type {import('next').NextConfig} */
export default {
  experimental: {
    externalDir: true,
    extensionAlias: { ".js": [".ts", ".tsx", ".js"] },
  },
};
