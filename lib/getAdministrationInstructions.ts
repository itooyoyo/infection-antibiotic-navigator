import { administrationFallback, ivAdministration } from "../data/antibioticAdministration.ts";

export function getAdministrationInstructions(drugId: string, genericName: string) {
  return ivAdministration.find((item) => item.drugId === drugId) ?? administrationFallback(drugId, genericName);
}
