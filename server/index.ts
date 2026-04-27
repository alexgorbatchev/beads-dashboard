import { startServer } from "./app";

export { app, startServer } from "./app";
export {
  scanForProjects,
  getProjectStats,
  getProjectIssues,
  getAllIssues,
  getIssue,
  updateIssueStatus,
  updateIssuePriority,
  updateIssueTitle,
  updateIssueDescription,
  updateIssueNotes,
  createIssue,
  deleteIssue,
  closeAllDbs,
  getIssueDependencies,
  getIssueBlockedBy,
  getIssueEvents,
  getIssueComments,
  getAllLabels,
  getReadyIssues,
  getBlockedIssues,
  getDetailedProjectStats,
  toggleIssuePinned,
  updateIssueDueDate,
  addIssueLabel,
  removeIssueLabel,
  supportsProjectWrites,
  type Project,
} from "./db";
export {
  addProjectSetting,
  PROJECT_SETTINGS_FILE_NAME,
  readProjectSettings,
  removeProjectSetting,
  updateProjectSetting,
} from "./projectSettings";
export { WebSocketServer, WebSocket } from "ws";

if (import.meta.main) {
  startServer();
}

