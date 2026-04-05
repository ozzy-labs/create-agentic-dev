/**
 * Pinned GitHub Actions versions used in generated CI/CD workflows.
 *
 * These are also used by this project's own workflows (.github/workflows/).
 * When Renovate updates the workflow files, sync the hashes here too.
 */
export const ACTIONS = {
  checkout: "actions/checkout@34e114876b0b11c390a56381ad16ebd13914f8d5", // v4
  mise: "jdx/mise-action@c37c93293d6b742fc901e1406b8f764f6fb19dac", // v2
  cache: "actions/cache@0057852bfaa89a56745cba8c7296529d2fc39830", // v4
  awsCredentials: "aws-actions/configure-aws-credentials@ececac1a45f3b08a01d2dd070d28d111c5fe6722", // v4
  azureLogin: "azure/login@a457da9ea143d694b1b9c7c869ebb04ebe844ef5", // v2
  gcpAuth: "google-github-actions/auth@ba79af03959ebeac9769e648f473a284504d9193", // v2
};
