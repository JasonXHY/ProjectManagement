import { existsSync, readFileSync, writeFileSync } from "fs"
import { join } from "path"

export default {
  "tool.execute.after": async (input: any, output: any) => {
    // Only trigger on file write/edit operations in docs/
    if (input.tool !== "write" && input.tool !== "edit") return

    const filePath = input.args?.file_path || input.args?.path || ""
    if (!filePath.includes("docs/") || filePath.includes("00-INDEX.md")) return

    // Check if this is a new file creation (write) or edit in docs/
    const docsDir = join(process.cwd(), "docs")
    const indexPath = join(docsDir, "00-INDEX.md")

    if (!existsSync(indexPath)) return

    // Read current index
    const indexContent = readFileSync(indexPath, "utf-8")

    // Extract filename from path
    const fileName = filePath.split("/").pop() || filePath.split("\\").pop() || ""
    if (!fileName) return

    // Determine which directory it's in
    const dirMatch = filePath.match(/docs\/(\d{2}-\w+)\//)
    if (!dirMatch) return

    const dirName = dirMatch[1]

    // Check if file already in index
    if (indexContent.includes(fileName)) return

    // Add entry to appropriate section
    const sectionHeader = `## ${dirName}/`
    const sectionIndex = indexContent.indexOf(sectionHeader)
    if (sectionIndex === -1) return

    // Find the next section or end of file
    const nextSectionIndex = indexContent.indexOf("\n## ", sectionIndex + sectionHeader.length)
    const insertPos = nextSectionIndex === -1 ? indexContent.length : nextSectionIndex

    // Insert new entry before next section
    const newEntry = `| — | ${fileName.replace(".md", "")} | (auto-added) |\n`
    const updatedContent = indexContent.slice(0, insertPos) + newEntry + indexContent.slice(insertPos)

    // Update "Last Updated" date
    const today = new Date().toISOString().split("T")[0]
    const updatedContent2 = updatedContent.replace(
      /> 最后更新：\d{4}-\d{2}-\d{2}/,
      `> 最后更新：${today}`
    )

    writeFileSync(indexPath, updatedContent2, "utf-8")
  },
}
