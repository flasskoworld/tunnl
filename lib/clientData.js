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
