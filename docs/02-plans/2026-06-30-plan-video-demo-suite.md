# PMAer 演示视频套件实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use compose:subagent (recommended) or compose:execute to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create 8 HTML animation files and record them into 720p MP4 demo videos for PMAer product showcase.

**Architecture:** Each video is a self-contained HTML file with CSS animations simulating the product UI. A shared Playwright recording script converts each HTML to MP4 via headless browser recording + ffmpeg encoding.

**Tech Stack:** HTML/CSS/JS animations, Playwright (headless Chromium recording), ffmpeg (H.264 encoding)

## Global Constraints

- Resolution: 1280×720 (720p)
- Frame rate: 30fps
- Encoding: H.264 (libx264), movflags +faststart
- Design language: Ant Design style, blue theme #1677ff
- All HTML files are self-contained (inline CSS/JS, no external dependencies)
- Font: system font stack (-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif)
- Recording follows html-to-video-pipeline skill (freeze→goto→fonts→unfreeze→record→encode)

---

## File Structure

```
docs/videos/
├── html/                    # 8 HTML animation files
│   ├── 00-overview.html
│   ├── 01-card-system.html
│   ├── 02-ai-classification.html
│   ├── 03-profit-calculator.html
│   ├── 04-project-handover.html
│   ├── 05-ai-chat-summary.html
│   ├── 06-signature-tracking.html
│   └── 07-settings.html
├── scripts/
│   └── record.js            # Playwright recording script
└── (8 MP4 files after recording)
```

---

### Task 1: Setup infrastructure (复用侧耳倾听)

**Covers:** [S3, S6]

**前提：** 侧耳倾听项目已安装 Playwright 1.61.1 + ffmpeg 8.1.1 + Edge 浏览器，record.js 脚本可直接复用。

**Files:**
- Create: `docs/videos/html/` directory
- Create: `docs/videos/scripts/` directory
- Create: `docs/videos/scripts/record.js` (adapted from 侧耳倾听)
- Create: `docs/videos/package.json`

**Interfaces:**
- Consumes: Playwright, ffmpeg, Edge (already installed)
- Produces: `record.js` that accepts scenes config and records all videos

- [ ] **Step 1: Create directory structure**

```powershell
New-Item -ItemType Directory -Force -Path "docs\videos\html","docs\videos\scripts"
```

- [ ] **Step 2: Create package.json**

```json
{
  "name": "pmaer-demo-videos",
  "version": "1.0.0",
  "description": "PMAer demo video recording",
  "main": "scripts/record.js",
  "type": "commonjs",
  "dependencies": {
    "playwright": "^1.61.1"
  }
}
```

- [ ] **Step 3: Install dependencies (reuse existing Playwright)**

```powershell
cd docs\videos; npm install
```

- [ ] **Step 4: Create record.js (adapted from 侧耳倾听)**

基于 `C:\侧耳倾听\demo\record.js`，修改场景配置为 PMAer 的 8 个视频。核心逻辑不变：freeze→goto→fonts→unfreeze→record→encode→concat。

- [ ] **Step 5: Test with a minimal HTML**

Create `docs/videos/html/test.html` — simple blue box with fadeIn animation. Run record.js, verify MP4 output.

- [ ] **Step 6: Commit**

```bash
git add docs/videos/
git commit -m "feat: add video recording infrastructure (reused from 侧耳倾听)"
```

---

### Task 2: Create 00-overview.html (总览 60s)

**Covers:** [S5 00-overview]

**Files:**
- Create: `docs/videos/html/00-overview.html`

**Interfaces:**
- Consumes: Task 1 infrastructure (record.js)
- Produces: Standalone HTML, self-contained, 1280×720

- [ ] **Step 1: Create the HTML animation**

The overview video has 7 scenes (0-5s opening, 5-15s pain point, 15-25s product reveal, 25-35s AI classification, 35-45s card visualization, 45-55s handover, 55-60s ending). Use CSS `@keyframes` with `animation-delay` for scene sequencing. Total animation duration should be ~60s.

Key elements:
- Scene 1: PMAer logo fade in + tagline
- Scene 2: Scattered file icons → chaos visualization
- Scene 3: Clean project list UI mockup
- Scene 4: File → AI brain → categorized files animation
- Scene 5: Cards appearing one by one with data
- Scene 6: Export zip → Import → data restored
- Scene 7: Version + GitHub link fade out

- [ ] **Step 2: Record the video**

```bash
node docs/videos/scripts/record.js docs/videos/html/00-overview.html docs/videos/00-overview.mp4 60
```

- [ ] **Step 3: Verify with ffprobe**

```bash
ffprobe -v error -show_entries format=duration -of csv=p=0 docs/videos/00-overview.mp4
```
Expected: ~60s (±5s)

- [ ] **Step 4: Commit**

```bash
git add docs/videos/html/00-overview.html docs/videos/00-overview.mp4
git commit -m "feat: add overview demo video"
```

---

### Task 3: Create 01-card-system.html (卡片系统 30s)

**Covers:** [S5 01-card-system]

**Files:**
- Create: `docs/videos/html/01-card-system.html`

**Interfaces:**
- Consumes: Task 1 infrastructure
- Produces: Standalone HTML, 1280×720

- [ ] **Step 1: Create the HTML animation**

3 scenes showing card groups:
- Scene 1 (0-3s): Title "项目卡片系统" fade in
- Scene 2 (3-12s): Presale cards (ProjectInfo, Contract, Evaluation) slide up staggered
- Scene 3 (12-21s): In-progress cards (Requirement, Issue, Signature, Opportunity, Deliverable) replace
- Scene 4 (21-27s): Closed cards (Summary, Profit summary) appear
- Scene 5 (27-30s): "10个卡片，按阶段智能切换" text

Use card component style: white bg, rounded corners, shadow, icon + title + content.

- [ ] **Step 2: Record**

```bash
node docs/videos/scripts/record.js docs/videos/html/01-card-system.html docs/videos/01-card-system.mp4 30
```

- [ ] **Step 3: Verify**

```bash
ffprobe -v error -show_entries format=duration -of csv=p=0 docs/videos/01-card-system.mp4
```

- [ ] **Step 4: Commit**

```bash
git add docs/videos/html/01-card-system.html docs/videos/01-card-system.mp4
git commit -m "feat: add card system demo video"
```

---

### Task 4: Create 02-ai-classification.html (AI分类 30s)

**Covers:** [S5 02-ai-classification]

**Files:**
- Create: `docs/videos/html/02-ai-classification.html`

- [ ] **Step 1: Create the HTML animation**

- Title → Upload area with file icons dropping in → AI brain icon spinning → files sorting into category folders → stage progression popup

- [ ] **Step 2: Record**

```bash
node docs/videos/scripts/record.js docs/videos/html/02-ai-classification.html docs/videos/02-ai-classification.mp4 30
```

- [ ] **Step 3: Verify + Commit**

---

### Task 5: Create 03-profit-calculator.html (利润测算 30s)

**Covers:** [S5 03-profit-calculator]

**Files:**
- Create: `docs/videos/html/03-profit-calculator.html`

- [ ] **Step 1: Create the HTML animation**

- Title → Input fields filling in (金额, 人天, 单价) → Numbers rolling/calculating → Result cards (利润率, 成本明细) → Red line warning flash

- [ ] **Step 2: Record**

```bash
node docs/videos/scripts/record.js docs/videos/html/03-profit-calculator.html docs/videos/03-profit-calculator.mp4 30
```

- [ ] **Step 3: Verify + Commit**

---

### Task 6: Create 04-project-handover.html (项目转交 30s)

**Covers:** [S5 04-project-handover]

**Files:**
- Create: `docs/videos/html/04-project-handover.html`

- [ ] **Step 1: Create the HTML animation**

- Title → File list with checkboxes checking → Export zip animation → Import dialog → Preview → "数据完整恢复" success

- [ ] **Step 2: Record**

```bash
node docs/videos/scripts/record.js docs/videos/html/04-project-handover.html docs/videos/04-project-handover.mp4 30
```

- [ ] **Step 3: Verify + Commit**

---

### Task 7: Create 05-ai-chat-summary.html (AI对话+摘要 30s)

**Covers:** [S5 05-ai-chat-summary]

**Files:**
- Create: `docs/videos/html/05-ai-chat-summary.html`

- [ ] **Step 1: Create the HTML animation**

- Title → Chat interface with user message → AI typing indicator → AI reply with Markdown → File panel selecting files → Summary modal with project overview

- [ ] **Step 2: Record**

```bash
node docs/videos/scripts/record.js docs/videos/html/05-ai-chat-summary.html docs/videos/05-ai-chat-summary.mp4 30
```

- [ ] **Step 3: Verify + Commit**

---

### Task 8: Create 06-signature-tracking.html (签字追踪 30s)

**Covers:** [S5 06-signature-tracking]

**Files:**
- Create: `docs/videos/html/06-signature-tracking.html`

- [ ] **Step 1: Create the HTML animation**

- Title → Contract amount display → Checklist generating items → Files matching to items → Status badges (待签/已签)

- [ ] **Step 2: Record**

```bash
node docs/videos/scripts/record.js docs/videos/html/06-signature-tracking.html docs/videos/06-signature-tracking.mp4 30
```

- [ ] **Step 3: Verify + Commit**

---

### Task 9: Create 07-settings.html (系统设置 30s)

**Covers:** [S5 07-settings]

**Files:**
- Create: `docs/videos/html/07-settings.html`

- [ ] **Step 1: Create the HTML animation**

- Title → Settings page with tabs → AI model selector dropdown → API Key input → Storage path with browse button → Prompt editor → "你的AI，你做主"

- [ ] **Step 2: Record**

```bash
node docs/videos/scripts/record.js docs/videos/html/07-settings.html docs/videos/07-settings.mp4 30
```

- [ ] **Step 3: Verify + Commit**

---

### Task 10: Final verification and cleanup

**Covers:** [S7]

**Files:**
- Delete: `docs/videos/html/test.html` (if exists)
- Delete: `docs/videos/test-output.mp4` (if exists)

- [ ] **Step 1: Verify all 8 videos exist and have correct duration**

```bash
for f in docs/videos/0*.mp4; do
  dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$f")
  echo "$f: ${dur}s"
done
```

Expected: 8 files, each within ±5s of target duration.

- [ ] **Step 2: Spot-check frame quality**

```bash
ffmpeg -ss 1 -i docs/videos/00-overview.mp4 -frames:v 1 -y docs/videos/.tmp-frame.png
# Visually check the frame renders correctly
rm docs/videos/.tmp-frame.png
```

- [ ] **Step 3: Clean up test files**

```bash
rm -f docs/videos/html/test.html docs/videos/test-output.mp4
```

- [ ] **Step 4: Update docs/00-INDEX.md**

Add `docs/videos/` section to the index.

- [ ] **Step 5: Final commit**

```bash
git add docs/videos/ docs/00-INDEX.md
git commit -m "feat: complete PMAer demo video suite (8 videos, ~4 min total)"
```
