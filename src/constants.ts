export const PRIORITY_LABELS: Record<number, string> = {
  0: "Critical",
  1: "High",
  2: "Medium",
  3: "Low",
  4: "Backlog",
};

export const PRIORITY_COLORS: Record<number, string> = {
  0: "var(--color-priority-urgent)",
  1: "var(--color-priority-high)",
  2: "var(--color-priority-medium)",
  3: "var(--color-priority-low)",
  4: "var(--color-muted)",
};

// Issue type labels
export const ISSUE_TYPE_LABELS: Record<string, string> = {
  bug: "Bug",
  feature: "Feature",
  task: "Task",
  epic: "Epic",
  chore: "Chore",
};
