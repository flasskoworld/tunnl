import { recommendedSprintContext } from "./projectBrief.js";
import { suggestedResultFor } from "./interventions.js";
import { MODULES } from "./engine.js";

export function track(name, metadata = {}) {
  fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, metadata }),
    keepalive: true,
  }).catch(() => {});
}

export async function loadAccountWorkspace() {
  const response = await fetch("/api/workspace");
  if (!response.ok) return null;
  return response.json();
}

export function readingForWorkspace(accountData, fallback = null) {
  const readingId = accountData?.workspace?.setup?.readingId;
  if (!readingId) return accountData?.readings?.[0]?.result || fallback;
  return accountData.readings?.find((reading) =>
    reading.result?.id === readingId || reading.source_id === readingId
  )?.result || fallback;
}

export function sprintSetupForReading(result = null) {
  if (!result?.profile) return null;
  const profile = result.profile;
  const primaryModule = result.memo?.priorities?.[0]?.module
    || profile.three_weakest_modules?.[0]
    || "focus";
  const sprint = recommendedSprintContext(profile.projectBrief || profile.focusProject || "", {
    model: profile.business_model,
    primaryModule,
  });
  const outcome = suggestedResultFor(profile.business_model || "creator", primaryModule);
  const constraint = MODULES.find((module) => module.key === primaryModule)?.label || primaryModule;

  return {
    projectBrief: profile.projectBrief || "",
    projectIntent: profile.projectIntent || sprint.category,
    focusProject: sprint.focus,
    targetMetric: outcome?.metric || "Observable evidence of movement",
    baselinePrompt: outcome?.baselinePrompt || `What is true in ${constraint} today?`,
    targetValue: outcome?.target || "A clear result is recorded by Day 14.",
    weeklyCapacity: profile.weeklyCapacity || "4 hours",
    businessModel: profile.business_model || "creator",
    constraint,
  };
}

export function previewWorkspaceForReading(workspace = {}, result = null) {
  if (!result?.id) return workspace;
  const profile = result.profile || {};
  const rawBrief = profile.projectBrief || (
    workspace?.setup?.readingId === result.id
      ? workspace.setup?.projectBrief || workspace.setup?.focusProject || profile.focusProject
      : profile.focusProject
  ) || "";
  const sprint = recommendedSprintContext(rawBrief, {
    model: profile.business_model,
    primaryModule: result.memo?.priorities?.[0]?.module || profile.three_weakest_modules?.[0],
  });
  const normalizedSetup = {
    ...(workspace.setup || {}),
    readingId: result.id,
    projectBrief: rawBrief,
    projectIntent: profile.projectIntent || sprint.category,
    focusProject: sprint.focus,
  };
  if (
    workspace?.setup?.readingId === result.id &&
    workspace.setup?.projectBrief === normalizedSetup.projectBrief &&
    workspace.setup?.projectIntent === normalizedSetup.projectIntent &&
    workspace.setup?.focusProject === normalizedSetup.focusProject
  ) return workspace;
  if (workspace?.setup?.readingId === result.id) return { ...workspace, setup: normalizedSetup };
  return {
    setup: normalizedSetup,
    protocol_start_date: null,
    protocol_checked: {},
    protocol_notes: {},
    protocol_evidence: {},
    course_correction: {},
    vault_values: {},
    completion_review: {},
  };
}

export async function syncReading(result) {
  const response = await fetch("/api/workspace", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ result }),
  });
  return response.ok;
}

export async function saveWorkspace(updates) {
  try {
    if (
      process.env.NODE_ENV === "development" &&
      localStorage.getItem("tunnl-dev-starter-preview") === "true"
    ) {
      const current = JSON.parse(localStorage.getItem("tunnl-dev-workspace") || "{}");
      localStorage.setItem("tunnl-dev-workspace", JSON.stringify({ ...current, ...updates }));
      return true;
    }
    const response = await fetch("/api/workspace", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}
