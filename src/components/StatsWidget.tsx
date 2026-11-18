import type { JSX } from "react";
import { useState, useEffect } from "react";
import { Circle, Clock, CheckCircle2, Ban, TrendingUp, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import type { IAggregatedStats } from "../types";
import { fetchAggregatedStats } from "../lib/api";
import { Icon, Panel, ProjectStatRow, Stack, StatCallout, StatCard, StatRow, Text } from "@/components/ui/appPrimitives";
import { Button } from "@/components/ui/button";

interface IStatsWidgetProps {
  expanded?: boolean;
}

export function StatsWidget({ expanded = false }: IStatsWidgetProps): JSX.Element | null {
  const [stats, setStats] = useState<IAggregatedStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(expanded);

  useEffect(() => {
    let isCancelled = false;

    async function loadInitialStats(): Promise<void> {
      try {
        const data = await fetchAggregatedStats();
        if (!isCancelled) {
          setStats(data);
        }
      } catch (error) {
        console.error("Failed to load stats:", error);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadInitialStats();

    return () => {
      isCancelled = true;
    };
  }, []);

  if (isLoading) {
    return (
      <Panel variant="statsLoading" testId="StatsWidget">
        <Text as="div" variant="muted" align="center">Loading stats...</Text>
      </Panel>
    );
  }

  if (!stats) {
    return null;
  }

  const activeIssues = stats.open + stats.in_progress + stats.blocked;

  return (
    <Panel variant="statsFrame" testId="StatsWidget">
      {/* Header */}
      <Button
        onClick={() => setIsExpanded(!isExpanded)}
        variant="panel"
        size="panel"
      >
        <Stack variant="row">
          <Icon icon={TrendingUp} tone="accent" />
          <Text variant="statHeader">Statistics</Text>
        </Stack>
        <Icon icon={isExpanded ? ChevronUp : ChevronDown} tone="muted" />
      </Button>

      {isExpanded && (
        <Stack variant="statsBody">
          {/* Quick Stats */}
          <Stack variant="statsGrid">
            <StatCard value={activeIssues} label="Active" />
            <StatCard value={stats.closed} label="Closed" tone="success" />
          </Stack>

          {/* Status Breakdown */}
          <Stack variant="section">
            <Text as="div" variant="statLabel">By Status</Text>
            <StatRow icon={Circle} tone="open" label="Open" value={stats.open} />
            <StatRow icon={Clock} tone="in_progress" label="In Progress" value={stats.in_progress} />
            <StatRow icon={Ban} tone="blocked" label="Blocked" value={stats.blocked} />
            <StatRow icon={CheckCircle2} tone="closed" label="Closed" value={stats.closed} />
          </Stack>

          {/* Ready Issues */}
          {stats.ready > 0 && (
            <StatCallout icon={CheckCircle2} tone="success" title={`${stats.ready} Ready`} description="No blockers" />
          )}

          {/* Overdue Issues */}
          {stats.overdue > 0 && (
            <StatCallout icon={AlertTriangle} tone="danger" title={`${stats.overdue} Overdue`} description="Past due date" />
          )}

          {/* Per-Project Stats */}
          {Object.keys(stats.byProject).length > 0 && (
            <Stack variant="section">
              <Text as="div" variant="statLabel">By Project</Text>
              {Object.entries(stats.byProject).map(([project, projectStats]) => (
                <ProjectStatRow key={project} project={project} open={projectStats.open} total={projectStats.total} />
              ))}
            </Stack>
          )}
        </Stack>
      )}
    </Panel>
  );
}
