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

# Get all files with full details
cur.execute('SELECT id, filename, category, subcategory, stage, ai_summary, ai_key_info FROM files WHERE project_id=? ORDER BY id', (proj_id,))
files = cur.fetchall()

print(f'\n=== Files ({len(files)}) ===')
for f in files:
    fname = f[1][:45] if f[1] else 'N/A'
    cat = f[2] or 'None'
    sub = f[3] or 'None'
    stage = f[4] or 'None'
    summary = f[5][:80] if f[5] else 'None'
    keyinfo = f[6][:80] if f[6] else 'None'
    print(f'ID={f[0]:3d} | {fname:<45s} | cat={cat:<8s} | sub={sub:<10s} | stage={stage}')
    if f[5]:
        print(f'       summary: {summary}')
    if f[6]:
        ki = json.loads(f[6])
        non_empty = {k: v for k, v in ki.items() if v and v != '' and v != 0}
        if non_empty:
            print(f'       key_info: {json.dumps(non_empty, ensure_ascii=False)[:120]}')

# Check metadata
print(f'\n=== Metadata ===')
for key in sorted(meta.keys()):
    val = meta[key]
    if isinstance(val, list):
        print(f'  {key}: LIST[{len(val)}]')
        for i, item in enumerate(val[:3]):
            print(f'    [{i}] {json.dumps(item, ensure_ascii=False)[:120]}')
    elif isinstance(val, str):
        print(f'  {key}: "{val[:100]}"')
    elif isinstance(val, (int, float)):
        print(f'  {key}: {val}')
    else:
        print(f'  {key}: {val}')

# Check requirements, key_issues, opportunities in detail
for field in ['requirements', 'key_issues', 'opportunities']:
    if field in meta and isinstance(meta[field], list):
        items = meta[field]
        print(f'\n=== {field} ({len(items)} items) ===')
        for i, item in enumerate(items[:5]):
            print(f'  [{i}] {json.dumps(item, ensure_ascii=False)[:150]}')

# Check project_summary.md
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
