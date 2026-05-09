"use client";

import * as React from "react";

function storageKey(teamId: string) {
  return `forgesite:selectedProject:${teamId}`;
}

export function useSelectedProjectId(teamId: string) {
  const [selectedProjectId, setSelectedProjectId] = React.useState<string | null>(null);

  React.useEffect(() => {
    setSelectedProjectId(localStorage.getItem(storageKey(teamId)));
  }, [teamId]);

  const selectProjectId = React.useCallback((projectId: string | null) => {
    if (projectId) localStorage.setItem(storageKey(teamId), projectId);
    else localStorage.removeItem(storageKey(teamId));
    setSelectedProjectId(projectId);
  }, [teamId]);

  return { selectedProjectId, selectProjectId };
}
