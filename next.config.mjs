/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Standalone output is friendlier for containerized deploys (ECS/Fargate).
  // Amplify Hosting can build without it, so leaving it off by default.
  // output: "standalone",
};

export default nextConfig;
