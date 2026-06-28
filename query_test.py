import sqlite3, json

db_path = r'C:\Users\kingdee\AppData\Roaming\pmaer\projects.db'
conn = sqlite3.connect(db_path)
cur = conn.cursor()

# Get latest project
cur.execute('SELECT id, name, metadata, current_stage FROM projects ORDER BY id DESC LIMIT 1')
p = cur.fetchone()
proj_id = p[0]
meta = json.loads(p[2]) if p[2] else {}
print(f'Project {proj_id}: {p[1]} | stage={p[3]}')

# Get all files
cur.execute('SELECT id, filename, category, subcategory, stage, ai_summary, ai_key_info FROM files WHERE project_id=? ORDER BY id', (proj_id,))
files = cur.fetchall()

print(f'\n=== Files ({len(files)}) ===')
for f in files:
    fname = f[1][:45] if f[1] else 'N/A'
    cat = f[2] or 'None'
    sub = f[3] or 'None'
    stage = f[4] or 'None'
    print(f'ID={f[0]:3d} | {fname:<45s} | cat={cat:<10s} | sub={sub:<12s} | stage={stage}')

# Stage distribution
cur.execute('SELECT stage, COUNT(*) FROM files WHERE project_id=? GROUP BY stage', (proj_id,))
print(f'\n=== Stage Distribution ===')
for s in cur.fetchall():
    print(f'  {s[0] or "None"}: {s[1]}')

# Metadata fields
print(f'\n=== Metadata ===')
for key in sorted(meta.keys()):
    val = meta[key]
    if isinstance(val, list):
        print(f'  {key}: LIST[{len(val)}]')
        # Show first 3 items
        for i, item in enumerate(val[:3]):
            print(f'    [{i}] {json.dumps(item, ensure_ascii=False)[:120]}')
        if len(val) > 3:
            print(f'    ... ({len(val)-3} more)')
    elif isinstance(val, str):
        print(f'  {key}: "{val[:80]}"')
    elif isinstance(val, (int, float)):
        print(f'  {key}: {val}')
    else:
        print(f'  {key}: {val}')

# Check project-summary.md
import os
proj_dirs = [d for d in os.listdir(r'C:\work\testproject') if d.endswith(f'_{proj_id}')]
if proj_dirs:
    summary_path = os.path.join(r'C:\work\testproject', proj_dirs[0], '.ai', 'project-summary.md')
    if os.path.exists(summary_path):
        with open(summary_path, 'r', encoding='utf-8') as fh:
            content = fh.read()
        has_brief = '---BRIEF---' in content
        print(f'\n=== project-summary.md ({len(content)} chars) ===')
        print(f'  Has BRIEF marker: {has_brief}')
        if has_brief:
            brief = content.split('---BRIEF---')[1].strip()
            print(f'  Brief ({len(brief)} chars): {brief[:200]}')

conn.close()
