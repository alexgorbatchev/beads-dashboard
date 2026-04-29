import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Field, Panel, Stack } from "@/components/ui/appPrimitives";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/NativeSelect";
import { Textarea } from "@/components/ui/Textarea";
import { createIssue } from "../lib/api";

interface ICreateIssueDialogProps {
  project: string | null;
  projects: { name: string }[];
  onCreated: () => void;
}

const PRIORITY_OPTIONS = [
  { value: 0, label: "Critical" },
  { value: 1, label: "High" },
  { value: 2, label: "Medium" },
  { value: 3, label: "Low" },
  { value: 4, label: "Backlog" },
];

const TYPE_OPTIONS = [
  { value: "task", label: "Task" },
  { value: "bug", label: "Bug" },
  { value: "feature", label: "Feature" },
  { value: "epic", label: "Epic" },
  { value: "chore", label: "Chore" },
];

function generateId(): string {
  return crypto.randomUUID();
}

export function CreateIssueDialog({ project, projects, onCreated }: ICreateIssueDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedProjectOverride, setSelectedProjectOverride] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState(2);
  const [issueType, setIssueType] = useState("task");

  const selectedProject = selectedProjectOverride ?? project ?? "";

  const handleClose = (): void => {
    resetForm();
    setOpen(false);
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setPriority(2);
    setIssueType("task");
    setError(null);
    setSelectedProjectOverride(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProject) {
      setError("Please select a project");
      return;
    }

    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await createIssue(selectedProject, {
        id: generateId(),
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        issue_type: issueType,
      });

      resetForm();
      setOpen(false);
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create issue");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) resetForm();
      }}
    >
      <DialogTrigger variant="default" size="default">
        <Plus data-icon="inline-start" />
        New Issue
      </DialogTrigger>
      <DialogContent size="form" surface="deep">
        <DialogHeader>
          <DialogTitle tone="primary">Create New Issue</DialogTitle>
        </DialogHeader>

        <Stack as="form" variant="form" onSubmit={handleSubmit}>
          {/* Project Selection */}
          <Field label="Project">
            <NativeSelect
              value={selectedProject}
              onChange={(e) => setSelectedProjectOverride(e.target.value)}
            >
              <option value="">Select a project...</option>
              {projects.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name}
                </option>
              ))}
            </NativeSelect>
          </Field>

          {/* Title */}
          <Field label="Title *">
            <Input
              type="text"
              variant="surface"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              autoFocus
            />
          </Field>

          {/* Description */}
          <Field label="Description">
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more details..."
              rows={4}
            />
          </Field>

          {/* Priority & Type */}
          <Stack variant="fieldGrid">
            <Field label="Priority">
              <NativeSelect
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value))}
              >
                {PRIORITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Type">
              <NativeSelect
                value={issueType}
                onChange={(e) => setIssueType(e.target.value)}
              >
                {TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          </Stack>

          {/* Error */}
          {error && <Panel variant="destructive">{error}</Panel>}

          {/* Actions */}
          <Stack variant="actions">
            <Button
              type="button"
              onClick={handleClose}
              variant="inline"
              size="default"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create Issue"}
            </Button>
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
