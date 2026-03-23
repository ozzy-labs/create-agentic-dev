import * as p from "@clack/prompts";
import pc from "picocolors";
import { t } from "./i18n/index.js";
import type { WizardAnswers } from "./types.js";

/** Build IaC options filtered by selected cloud providers. */
function buildIacOptions(clouds: Array<"aws" | "azure" | "gcp">): Array<{
  value: "cdk" | "cloudformation" | "terraform" | "bicep";
  label: string;
  hint?: string;
}> {
  const options: Array<{
    value: "cdk" | "cloudformation" | "terraform" | "bicep";
    label: string;
    hint?: string;
  }> = [];

  if (clouds.includes("aws")) {
    options.push(
      { value: "cdk", label: t("wizard.iac.cdk.label"), hint: t("wizard.iac.cdk.hint") },
      {
        value: "cloudformation",
        label: t("wizard.iac.cloudformation.label"),
        hint: t("wizard.iac.cloudformation.hint"),
      },
    );
  }
  // Terraform is available for AWS, Azure, and Google Cloud
  if (clouds.includes("aws") || clouds.includes("azure") || clouds.includes("gcp")) {
    const tfClouds = clouds.map((c) => t(`wizard.clouds.${c}.label`)).join(", ");
    options.push({ value: "terraform", label: t("wizard.iac.terraform.label"), hint: tfClouds });
  }
  if (clouds.includes("azure")) {
    options.push({
      value: "bicep",
      label: t("wizard.iac.bicep.label"),
      hint: t("wizard.iac.bicep.hint"),
    });
  }

  return options;
}

/** Determine which languages are already forced by frontend/backend selections. */
function resolvedLanguages(
  frontend: WizardAnswers["frontend"],
  backend: WizardAnswers["backend"],
  iac: WizardAnswers["iac"],
): Set<"typescript" | "python"> {
  const resolved = new Set<"typescript" | "python">();
  // Frontend frameworks force TypeScript
  if (frontend === "react" || frontend === "nextjs") resolved.add("typescript");
  // Backend frameworks force their language
  if (backend === "fastapi") resolved.add("python");
  if (backend === "express") resolved.add("typescript");
  // CDK forces TypeScript
  if (iac.includes("cdk")) resolved.add("typescript");
  return resolved;
}

export async function runWizard(defaultName?: string): Promise<WizardAnswers> {
  p.intro(pc.bold(t("intro")));

  const answers = await p.group(
    {
      projectName: () =>
        p.text({
          message: t("wizard.projectName.message"),
          placeholder: t("wizard.projectName.placeholder"),
          initialValue: defaultName ?? "",
          validate(value) {
            if (!value.trim()) return t("wizard.projectName.required");
            if (!/^[a-z0-9][a-z0-9._-]*$/i.test(value.trim())) {
              return t("wizard.projectName.invalid");
            }
          },
        }),
      frontend: () =>
        p.select({
          message: `${t("wizard.frontend.message")} ${pc.dim(t("wizard.frontend.hint"))}`,
          options: [
            { value: "none" as const, label: t("wizard.frontend.none.label") },
            {
              value: "react" as const,
              label: t("wizard.frontend.react.label"),
              hint: t("wizard.frontend.react.hint"),
            },
            {
              value: "nextjs" as const,
              label: t("wizard.frontend.nextjs.label"),
              hint: t("wizard.frontend.nextjs.hint"),
            },
          ],
        }),
      backend: () =>
        p.select({
          message: `${t("wizard.backend.message")} ${pc.dim(t("wizard.backend.hint"))}`,
          options: [
            { value: "none" as const, label: t("wizard.backend.none.label") },
            {
              value: "fastapi" as const,
              label: t("wizard.backend.fastapi.label"),
              hint: t("wizard.backend.fastapi.hint"),
            },
            {
              value: "express" as const,
              label: t("wizard.backend.express.label"),
              hint: t("wizard.backend.express.hint"),
            },
          ],
        }),
      clouds: () =>
        p.multiselect({
          message: `${t("wizard.clouds.message")} ${pc.dim(t("wizard.clouds.hint"))}`,
          options: [
            { value: "aws" as const, label: t("wizard.clouds.aws.label") },
            { value: "azure" as const, label: t("wizard.clouds.azure.label") },
            { value: "gcp" as const, label: t("wizard.clouds.gcp.label") },
          ],
          required: false,
        }),
      iac: ({ results }) => {
        const clouds = (results.clouds ?? []) as WizardAnswers["clouds"];
        if (clouds.length === 0) return undefined;

        const options = buildIacOptions(clouds);
        if (options.length === 0) return undefined;

        return p.multiselect({
          message: `${t("wizard.iac.message")} ${pc.dim(t("wizard.iac.hint"))}`,
          options,
          required: false,
        });
      },
      languages: ({ results }) => {
        const frontend = (results.frontend ?? "none") as WizardAnswers["frontend"];
        const backend = (results.backend ?? "none") as WizardAnswers["backend"];
        const iac = (results.iac ?? []) as WizardAnswers["iac"];
        const resolved = resolvedLanguages(frontend, backend, iac);

        // All languages already resolved by FW/IaC selections — skip
        if (resolved.has("typescript") && resolved.has("python")) return undefined;

        const options: Array<{ value: "typescript" | "python"; label: string }> = [];
        if (!resolved.has("typescript")) {
          options.push({
            value: "typescript" as const,
            label: t("wizard.languages.typescript.label"),
          });
        }
        if (!resolved.has("python")) {
          options.push({ value: "python" as const, label: t("wizard.languages.python.label") });
        }

        return p.multiselect({
          message: `${t("wizard.languages.message")} ${pc.dim(t("wizard.languages.hint"))}`,
          options,
          required: false,
        });
      },
      agents: () =>
        p.multiselect({
          message: `${t("wizard.agents.message")} ${pc.dim(t("wizard.agents.hint"))}`,
          options: [
            {
              value: "claude-code" as const,
              label: t("wizard.agents.claude-code.label"),
              hint: t("wizard.agents.claude-code.hint"),
            },
            {
              value: "codex" as const,
              label: t("wizard.agents.codex.label"),
              hint: t("wizard.agents.codex.hint"),
            },
            {
              value: "gemini" as const,
              label: t("wizard.agents.gemini.label"),
              hint: t("wizard.agents.gemini.hint"),
            },
          ],
          required: false,
        }),
    },
    {
      onCancel: () => {
        p.cancel(t("cancel"));
        process.exit(0);
      },
    },
  );

  return {
    projectName: (answers.projectName as string).trim(),
    frontend: (answers.frontend ?? "none") as WizardAnswers["frontend"],
    backend: (answers.backend ?? "none") as WizardAnswers["backend"],
    clouds: (answers.clouds ?? []) as WizardAnswers["clouds"],
    iac: (answers.iac ?? []) as WizardAnswers["iac"],
    languages: (answers.languages ?? []) as WizardAnswers["languages"],
    agents: (answers.agents ?? []) as WizardAnswers["agents"],
  };
}
