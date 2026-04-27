import assert from 'node:assert'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'bun:test'

import {
  addProjectSetting,
  getConfiguredProjects,
  readProjectSettings,
  removeProjectSetting,
  updateProjectSetting,
} from '../projectSettings'

const tempPaths: string[] = []

afterEach(() => {
  for (const tempPath of tempPaths.splice(0, tempPaths.length)) {
    rmSync(tempPath, { recursive: true, force: true })
  }
})

function createTempRoot(): string {
  const tempDir = join(process.cwd(), '.tmp')
  mkdirSync(tempDir, { recursive: true })

  const rootPath = mkdtempSync(join(tempDir, 'project-settings-'))
  tempPaths.push(rootPath)
  return rootPath
}

function createJsonlProject(rootPath: string, projectName: string): string {
  const projectPath = join(rootPath, projectName)
  const beadsPath = join(projectPath, '.beads')

  mkdirSync(beadsPath, { recursive: true })
  writeFileSync(
    join(beadsPath, 'issues.jsonl'),
    `${JSON.stringify({
      id: `${projectName}-1`,
      title: `${projectName} issue`,
      status: 'open',
      priority: 2,
      issue_type: 'task',
      created_at: '2026-04-26T12:00:00Z',
      updated_at: '2026-04-26T12:00:00Z',
      closed_at: null,
      dependency_count: 0,
    })}\n`
  )

  return projectPath
}

describe('projectSettings', () => {
  it('reads configured projects from .projects.json and resolves relative paths', () => {
    const rootPath = createTempRoot()
    const alphaPath = createJsonlProject(rootPath, 'alpha')
    const betaPath = createJsonlProject(rootPath, 'beta')
    const settingsPath = join(rootPath, '.projects.json')

    writeFileSync(
      settingsPath,
      JSON.stringify(
        {
          projects: [{ path: './alpha' }, { path: betaPath }, { path: './missing' }],
        },
        null,
        2
      ) + '\n'
    )

    const settings = readProjectSettings(settingsPath)

    expect(settings.exists).toBe(true)
    expect(settings.projects).toEqual([
      {
        path: './alpha',
        resolvedPath: alphaPath,
        name: 'alpha',
        issueCount: 1,
        isValid: true,
        error: null,
      },
      {
        path: betaPath,
        resolvedPath: betaPath,
        name: 'beta',
        issueCount: 1,
        isValid: true,
        error: null,
      },
      {
        path: './missing',
        resolvedPath: join(rootPath, 'missing'),
        name: null,
        issueCount: undefined,
        isValid: false,
        error: 'No supported Beads project found at the configured path.',
      },
    ])
    expect(getConfiguredProjects(settingsPath).map((project) => project.name)).toEqual(['alpha', 'beta'])
  })

  it('rejects duplicate configured project names that would collide in the API', () => {
    const rootPath = createTempRoot()
    const firstPath = createJsonlProject(join(rootPath, 'workspace-one'), 'shared-name')
    const secondPath = createJsonlProject(join(rootPath, 'workspace-two'), 'shared-name')
    const settingsPath = join(rootPath, '.projects.json')

    writeFileSync(
      settingsPath,
      JSON.stringify(
        {
          projects: [{ path: firstPath }, { path: secondPath }],
        },
        null,
        2
      ) + '\n'
    )

    const settings = readProjectSettings(settingsPath)

    expect(settings.projects).toEqual([
      {
        path: firstPath,
        resolvedPath: firstPath,
        name: 'shared-name',
        issueCount: undefined,
        isValid: false,
        error: 'Configured project name collides with another entry: shared-name',
      },
      {
        path: secondPath,
        resolvedPath: secondPath,
        name: 'shared-name',
        issueCount: undefined,
        isValid: false,
        error: 'Configured project name collides with another entry: shared-name',
      },
    ])
    expect(getConfiguredProjects(settingsPath)).toEqual([])
  })

  it('adds, updates, and removes configured project paths', () => {
    const rootPath = createTempRoot()
    createJsonlProject(rootPath, 'alpha')
    createJsonlProject(rootPath, 'beta')
    const settingsPath = join(rootPath, '.projects.json')

    const addedSettings = addProjectSetting(settingsPath, './alpha')
    expect(addedSettings.projects.map((project) => project.path)).toEqual(['./alpha'])
    expect(JSON.parse(readFileSync(settingsPath, 'utf8'))).toEqual({
      projects: [{ path: './alpha' }],
    })

    const updatedSettings = updateProjectSetting(settingsPath, './alpha', './beta')
    expect(updatedSettings.projects.map((project) => project.path)).toEqual(['./beta'])
    expect(JSON.parse(readFileSync(settingsPath, 'utf8'))).toEqual({
      projects: [{ path: './beta' }],
    })

    const removedSettings = removeProjectSetting(settingsPath, './beta')
    expect(removedSettings.projects).toEqual([])
    expect(JSON.parse(readFileSync(settingsPath, 'utf8'))).toEqual({ projects: [] })

    const emptySettings = readProjectSettings(settingsPath)
    assert(emptySettings.exists)
    expect(emptySettings.projects).toEqual([])
  })
})
