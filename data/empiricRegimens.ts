import { requiredCoverageFor } from "./infectionPathogenProfiles.ts";
import type { InfectionId, PatientContext } from "@/types/clinical";

export type EmpiricRegimen = {
  id: string;
  infectionId: InfectionId;
  category: "standard" | "alternative" | "severe";
  label: string;
  drugIds: string[];
  coverage: string[];
  explainWhy: string;
  requiresHighResistanceRisk?: boolean;
};

const diverticulitisRegimens: EmpiricRegimen[] = [
  {
    id: "diverticulitis-ampicillin-sulbactam",
    infectionId: "diverticulitis",
    category: "standard",
    label: "ABPC/SBT",
    drugIds: ["ampicillinSulbactam"],
    coverage: ["グラム陰性桿菌カバー", "嫌気性菌カバー"],
    explainWhy: "腸内細菌目と嫌気性菌を同時にカバーできるため。地域のE. coli感受性を確認します。",
  },
  {
    id: "diverticulitis-ceftriaxone-metronidazole",
    infectionId: "diverticulitis",
    category: "alternative",
    label: "CTRX + MNZ",
    drugIds: ["ceftriaxone", "metronidazole"],
    coverage: ["グラム陰性桿菌カバー", "嫌気性菌カバー"],
    explainWhy: "CTRXで腸内細菌目、MNZで嫌気性菌を補完します。CTRX単独では嫌気性菌を十分にカバーできません。",
  },
  {
    id: "diverticulitis-cefmetazole",
    infectionId: "diverticulitis",
    category: "alternative",
    label: "CMZ",
    drugIds: ["cefmetazole"],
    coverage: ["グラム陰性桿菌カバー", "嫌気性菌カバー"],
    explainWhy: "嫌気性菌活性を有するセファマイシン系です。",
  },
  {
    id: "diverticulitis-piperacillin-tazobactam",
    infectionId: "diverticulitis",
    category: "severe",
    label: "PIPC/TAZ",
    drugIds: ["piperacillinTazobactam"],
    coverage: ["グラム陰性桿菌カバー", "嫌気性菌カバー", "抗緑膿菌薬をリスク時に追加"],
    explainWhy: "重症例・医療関連感染で広域カバーします。軽症例では優先しません。",
  },
  {
    id: "diverticulitis-meropenem",
    infectionId: "diverticulitis",
    category: "severe",
    label: "MEPM",
    drugIds: ["meropenem"],
    coverage: ["グラム陰性桿菌カバー", "嫌気性菌カバー", "ESBL産生菌カバー"],
    explainWhy: "ESBLなど耐性菌リスクが高い場合のみ候補とし、カルバペネムを温存します。",
    requiresHighResistanceRisk: true,
  },
];

export function getCoverageDrivenRegimens(infectionId: InfectionId, context?: PatientContext): EmpiricRegimen[] {
  if (infectionId !== "diverticulitis") return [];
  const required = requiredCoverageFor(infectionId);
  return diverticulitisRegimens.filter((regimen) => {
    if (regimen.requiresHighResistanceRisk && !context?.esblHistory && !context?.ampCHistory) return false;
    return required.every((coverage) => regimen.coverage.includes(coverage));
  });
}

export const ceftriaxoneMonotherapyReason = "Bacteroides fragilisなど嫌気性菌のカバーが不十分なため、憩室炎ではCTRX単独を推奨しません。";
