import type { JSX } from "react";
import { GitBranch, RefreshCw } from "lucide-react";

import type { IssueGitDiff } from "../types";
import { DefinitionGrid, DefinitionItem, Icon, Panel, SectionHeading, Stack, Text } from "@/components/ui/appPrimitives";
import { Button } from "@/components/ui/button";

interface IIssueGitDiffPanelProps {
  diff: IssueGitDiff | null;
  isLoading: boolean;
  error: string | null;
  onLoad: () => void;
}

interface IDiffBlockProps {
  label: string;
  diff: string;
}

function DiffBlock({ label, diff }: IDiffBlockProps): JSX.Element | null {
  if (!diff) {
    return null;
  }

  return (
    <Stack variant="section">
      <Text as="div" variant="sectionLabel">{label}</Text>
      <Panel as="pre" variant="code">
        <code>{diff}</code>
      </Panel>
    </Stack>
  );
}

export function IssueGitDiffPanel({ diff, isLoading, error, onLoad }: IIssueGitDiffPanelProps): JSX.Element {
  const isFound = diff?.kind === "found";
  const hasDiff = isFound && (diff.branchDiff.length > 0 || diff.worktreeDiff.length > 0 || diff.status.length > 0);

  return (
    <Stack as="section" variant="spaciousSection" testId="IssueGitDiffPanel">
      <Stack variant="panelHeader">
        <SectionHeading icon={GitBranch}>
          Worktree / Branch Diff
        </SectionHeading>
        <Button
          type="button"
          variant="subtle"
          size="xs"
          onClick={onLoad}
          disabled={isLoading}
        >
          <Icon icon={RefreshCw} size="xs" animation={isLoading ? "spin" : "none"} />
          {diff ? "Refresh diff" : "Load diff"}
        </Button>
      </Stack>

      {isLoading && <Text variant="muted">Loading git diff...</Text>}

      {error && <Panel role="alert" variant="destructive">{error}</Panel>}

      {!isLoading && diff?.kind === "not_found" && (
        <Panel>{diff.message}</Panel>
      )}

      {!isLoading && diff?.kind === "unavailable" && (
        <Panel>{diff.message}</Panel>
      )}

      {!isLoading && isFound && (
        <Stack variant="spaciousSection">
          <DefinitionGrid>
            <DefinitionItem term="Branch">{diff.branchName}</DefinitionItem>
            <DefinitionItem term="Compared with">{diff.baseBranch}</DefinitionItem>
            {diff.worktreePath && (
              <DefinitionItem term="Worktree" wide>{diff.worktreePath}</DefinitionItem>
            )}
          </DefinitionGrid>

          {diff.status && (
            <Stack variant="section">
              <Text as="div" variant="sectionLabel">Working tree status</Text>
              <Panel as="pre" variant="code">
                <code>{diff.status}</code>
              </Panel>
            </Stack>
          )}

          <DiffBlock label="Committed branch diff" diff={diff.branchDiff} />
          <DiffBlock label="Uncommitted worktree diff" diff={diff.worktreeDiff} />

          {!hasDiff && (
            <Panel>
              The matching branch/worktree has no committed or uncommitted changes to show.
            </Panel>
          )}
        </Stack>
      )}
    </Stack>
  );
}
