/**
 * Pinned GitHub Actions versions used in generated CI/CD workflows.
 *
 * These are also used by this project's own workflows (.github/workflows/).
 * When Renovate updates the workflow files, sync the hashes here too.
 */
export const ACTIONS = {
  checkout: "actions/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd", // v6
  mise: "jdx/mise-action@1648a7812b9aeae629881980618f079932869151", // v4
  cache: "actions/cache@668228422ae6a00e4ad889ee87cd7109ec5666a7", // v5
  awsCredentials: "aws-actions/configure-aws-credentials@ececac1a45f3b08a01d2dd070d28d111c5fe6722", // v4
  azureLogin: "azure/login@a457da9ea143d694b1b9c7c869ebb04ebe844ef5", // v2
  gcpAuth: "google-github-actions/auth@ba79af03959ebeac9769e648f473a284504d9193", // v2
  releasePlease: "googleapis/release-please-action@8b8fd2cc23b2e18957157a9d923d75aa0c6f6ad5", // v4
};
