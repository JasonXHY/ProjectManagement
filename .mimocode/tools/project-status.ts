import { tool } from "@mimo-ai/plugin"
import { readFile } from "fs/promises"
import { join } from "path"

export default tool({
  description: "Read MEMORY.md + checkpoint and return a concise project status summary. Use at session start or when asked about current state.",
  args: {},
  async execute(_args, ctx) {
    const memDir = ctx.directory
    const projectMemPath = join(
      process.env.HOME || process.env.USERPROFILE || "",
      ".local", "share", "mimocode", "memory", "projects"
    )

    let memContent = ""
    let checkpointContent = ""

    // Find the project memory directory
    try {
      const { readdirSync, readFileSync, existsSync } = await import("fs")
      const projectsDir = join(process.env.HOME || process.env.USERPROFILE || "", ".local", "share", "mimocode", "memory", "projects")
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

      // Find current session checkpoint
      const sessionsDir = join(process.env.HOME || process.env.USERPROFILE || "", ".local", "share", "mimocode", "memory", "sessions")
      if (existsSync(sessionsDir)) {
        const sessions = readdirSync(sessionsDir)
        for (const ses of sessions) {
          const cpFile = join(sessionsDir, ses, "checkpoint.md")
          if (existsSync(cpFile)) {
            checkpointContent = readFileSync(cpFile, "utf-8")
            break
          }
        }
      }
    } catch {
      // Fallback: try reading from working directory
    }

    // Also read docs/00-INDEX.md if exists
    let indexContent = ""
    try {
      const { readFileSync } = await import("fs")
      const indexPath = join(ctx.directory, "docs", "00-INDEX.md")
      const { existsSync } = await import("fs")
      if (existsSync(indexPath)) {
        indexContent = readFileSync(indexPath, "utf-8").slice(0, 1000)
      }
    } catch {}

    // Also read package.json for version
    let version = "unknown"
    try {
      const { readFileSync, existsSync } = await import("fs")
      const pkgPath = join(ctx.directory, "package.json")
      if (existsSync(pkgPath)) {
        const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"))
        version = pkg.version || "unknown"
      }
    } catch {}

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
