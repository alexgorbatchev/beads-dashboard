export function formatIssueAssignee(assignee: string | null): string {
  const normalizedAssignee = assignee?.trim();

  if (!normalizedAssignee || normalizedAssignee.toLowerCase() === "none") {
    return "Unassigned";
  }

  return normalizedAssignee;
}
