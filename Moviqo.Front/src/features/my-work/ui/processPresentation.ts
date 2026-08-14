import { useLanguage } from "../../../shared/localization";
import type { MyWorkProcess } from "../model/myWork";

type Translate = ReturnType<typeof useLanguage>["t"];
type ContributionSummary = MyWorkProcess["contributionSummary"];

export const processInvolvementLabelFor = (involvement: string, t: Translate) => {
  if (involvement === "Initiator") {
    return t("myWork.myProcesses.involvement.initiator");
  }
  if (involvement === "Previous participant") {
    return t("myWork.myProcesses.involvement.previousParticipant");
  }
  return t("myWork.myProcesses.involvement.participant");
};

export const processContributionLabelFor = (
  summary: ContributionSummary,
  t: Translate
) => {
  if (summary.kind === "initiated") {
    return t("myWork.myProcesses.contribution.initiated");
  }
  if (summary.kind === "completedTask") {
    return t("myWork.myProcesses.contribution.completedTask");
  }
  if (summary.kind === "submittedValue") {
    return summary.label;
  }
  return t("myWork.myProcesses.contribution.participated");
};

export const processPositionLabelFor = (
  position: string,
  kind: string,
  t: Translate
) => {
  if (kind === "start") return t("processDetail.position.start");
  if (kind === "end") return t("processDetail.position.end");
  if (kind === "completed") return t("status.completed");
  if (kind === "taskFallback") return t("processDetail.position.task");
  return position;
};

export const processActorLabelFor = (
  actorDisplay: string,
  actorDisplayKind: string,
  t: Translate
) => actorDisplayKind === "authorizedMember"
  ? t("processDetail.actor.authorizedMember")
  : actorDisplay;
