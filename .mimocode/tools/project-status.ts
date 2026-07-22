import { tool } from "@mimo-ai/plugin"
import { readdirSync, readFileSync, existsSync, statSync } from "fs"
import { join } from "path"

export default tool({
  description: "Read MEMORY.md + checkpoint and return a concise project status summary. Use at session start or when asked about current state.",
  args: {},
  async execute(_args, ctx) {
    const homeDir = process.env.HOME || process.env.USERPROFILE || ""
    let memContent = ""
    let checkpointContent = ""

    // Find the project memory directory by matching PMAer in MEMORY.md
    const projectsDir = join(homeDir, ".local", "share", "mimocode", "memory", "projects")
    if (existsSync(projectsDir)) {
      const dirs = readdirSync(projectsDir)
      for (const dir of dirs) {
        const memFile = join(projectsDir, dir, "MEMORY.md")
        if (existsSync(memFile)) {
          const content = readFileSync(memFile, "utf-8")
          if (content.includes("PMAer")) {
            memContent = content
            break
          }
        }
      }
    }

    // Find the MOST RECENT session checkpoint (by file mtime)
    const sessionsDir = join(homeDir, ".local", "share", "mimocode", "memory", "sessions")
    if (existsSync(sessionsDir)) {
      const sessions = readdirSync(sessionsDir)
      let latestMtime = 0
      let latestCheckpoint = ""
      for (const ses of sessions) {
        const cpFile = join(sessionsDir, ses, "checkpoint.md")
        if (existsSync(cpFile)) {
          try {
            const mtime = statSync(cpFile).mtimeMs
            if (mtime > latestMtime) {
              latestMtime = mtime
              latestCheckpoint = readFileSync(cpFile, "utf-8")
            }
          } catch {}
        }
      }
      checkpointContent = latestCheckpoint
    }

    // Read docs/00-INDEX.md
    let indexContent = ""
    const indexPath = join(ctx.directory, "docs", "00-INDEX.md")
    if (existsSync(indexPath)) {
      indexContent = readFileSync(indexPath, "utf-8").slice(0, 1000)
    }

    // Read package.json for version
    let version = "unknown"
    const pkgPath = join(ctx.directory, "package.json")
    if (existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"))
        version = pkg.version || "unknown"
      } catch {}
    }

    return `# PMAer Project Status

## Version: ${version}

## From MEMORY.md:
${memContent.slice(0, 2000)}

## From Checkpoint:
${checkpointContent.slice(0, 2000)}

## Docs Index (first 1000 chars):
${indexContent}
`
  },
})
