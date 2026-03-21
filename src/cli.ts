import * as p from "@clack/prompts";
import pc from "picocolors";
import { t } from "./i18n/index.js";
import type { WizardAnswers } from "./types.js";

function handleCancel(value: unknown): void {
  if (p.isCancel(value)) {
    p.cancel(t("cancel"));
    process.exit(0);
  }
}

export async function runWizard(defaultName?: string): Promise<WizardAnswers> {
  p.intro(pc.bold(t("intro")));

  const projectName = await p.text({
    message: t("wizard.projectName.message"),
    placeholder: t("wizard.projectName.placeholder"),
    initialValue: defaultName ?? "",
    validate(value) {
      if (!value.trim()) return t("wizard.projectName.required");
      if (!/^[a-z0-9][a-z0-9._-]*$/i.test(value.trim())) {
        return t("wizard.projectName.invalid");
      }
    },
  });
  handleCancel(projectName);

  const languages = await p.multiselect({
    message: `${t("wizard.languages.message")} ${pc.dim(t("wizard.languages.hint"))}`,
    options: [
      { value: "typescript" as const, label: t("wizard.languages.typescript.label") },
      { value: "python" as const, label: t("wizard.languages.python.label") },
    ],
    required: false,
  });
  handleCancel(languages);

  const frontend = await p.select({
    message: `${t("wizard.frontend.message")} ${pc.dim(t("wizard.frontend.hint"))}`,
    options: [
      { value: "none" as const, label: t("wizard.frontend.none.label") },
      {
        value: "react" as const,
        label: t("wizard.frontend.react.label"),
        hint: t("wizard.frontend.react.hint"),
      },
    ],
  });
  handleCancel(frontend);

  const iac = await p.select({
    message: `${t("wizard.iac.message")} ${pc.dim(t("wizard.iac.hint"))}`,
    options: [
      { value: "none" as const, label: t("wizard.iac.none.label") },
      {
        value: "cdk" as const,
        label: t("wizard.iac.cdk.label"),
        hint: t("wizard.iac.cdk.hint"),
      },
      { value: "cloudformation" as const, label: t("wizard.iac.cloudformation.label") },
      { value: "terraform" as const, label: t("wizard.iac.terraform.label") },
      { value: "bicep" as const, label: t("wizard.iac.bicep.label") },
    ],
  });
  handleCancel(iac);

  return {
    projectName: (projectName as string).trim(),
    languages: languages as WizardAnswers["languages"],
    frontend: frontend as WizardAnswers["frontend"],
    iac: iac as WizardAnswers["iac"],
  };
}
