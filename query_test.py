import sqlite3, json

db_path = r'C:\Users\kingdee\AppData\Roaming\pmaer\projects.db'
conn = sqlite3.connect(db_path)
cur = conn.cursor()

# Find latest project
cur.execute('SELECT id, name, metadata, current_stage FROM projects ORDER BY id DESC LIMIT 1')
p = cur.fetchone()
proj_id = p[0]
print(f'Project {proj_id}: {p[1]} | stage={p[3]}')

# Get all files
cur.execute('SELECT id, filename, category, subcategory, stage, content_extracted, ai_summary, ai_key_info FROM files WHERE project_id=? ORDER BY id', (proj_id,))
files = cur.fetchall()

print(f'\n=== Files ({len(files)}) ===')
print(f'{"ID":<4s} | {"Filename":<50s} | {"Cat":<8s} | {"Sub":<12s} | {"Stage":<6s} | {"Content":<8s} | {"Summary":<8s} | {"KeyInfo":<8s}')
print('-' * 130)
for f in files:
    fname = f[1][:48] if f[1] else 'N/A'
    cat = f[2] or 'None'
    sub = f[3] or 'None'
    stage = f[4] or 'None'
    content = 'Y' if f[5] else 'N'
    summary = 'Y' if f[6] else 'N'
    keyinfo = 'Y' if f[7] else 'N'
    print(f'{f[0]:<4d} | {fname:<50s} | {cat:<8s} | {sub:<12s} | {stage:<6s} | {content:<8s} | {summary:<8s} | {keyinfo:<8s}')

# Get metadata
cur.execute('SELECT metadata FROM projects WHERE id=?', (proj_id,))
row = cur.fetchone()
meta = json.loads(row[0]) if row and row[0] else {}

print(f'\n=== Metadata Keys ===')
for key in sorted(meta.keys()):
    val = meta[key]
    if isinstance(val, list):
        print(f'  {key}: LIST[{len(val)}] {json.dumps(val, ensure_ascii=False)[:150]}')
    elif isinstance(val, str):
        print(f'  {key}: "{val[:80]}"')
    elif isinstance(val, (int, float)):
        print(f'  {key}: {val}')
    else:
        print(f'  {key}: {val}')

# Check card field coverage
print(f'\n=== Card Field Coverage ===')
cards = {
    '项目信息': ['project_code', 'customer_name', 'contact_person', 'contact_phone', 'customer_address'],
    '合同概览': ['contract_amount', 'contract_items'],
    '需求跟踪': ['requirements'],
    '关键问题': ['key_issues'],
    '拓展商机': ['opportunities'],
    '项目总结': ['project_overview'],
}
for card, fields in cards.items():
    found = [f for f in fields if f in meta and meta[f]]
    missing = [f for f in fields if f not in meta or not meta[f]]
    status = 'OK' if len(found) == len(fields) else f'MISSING: {missing}'
    print(f'  {card}: {status}')

# Check files without category
cur.execute('SELECT filename FROM files WHERE project_id=? AND category IS NULL', (proj_id,))
no_cat = cur.fetchall()
print(f'\n=== Files WITHOUT category ({len(no_cat)}) ===')
for f in no_cat:
    print(f'  {f[0]}')

# Check BRIEF marker in summary
import os
proj_dirs = [d for d in os.listdir(r'C:\work\testproject') if d.endswith(f'_{proj_id}')]
if proj_dirs:
    summary_path = os.path.join(r'C:\work\testproject', proj_dirs[0], '.ai', 'project-summary.md')
    if os.path.exists(summary_path):
        with open(summary_path, 'r', encoding='utf-8') as fh:
            content = fh.read()
        has_brief = '---BRIEF---' in content
        print(f'\n=== project-summary.md ===')
        print(f'  Size: {len(content)} chars')
        print(f'  Has BRIEF marker: {has_brief}')
        if has_brief:
            parts = content.split('---BRIEF---')
            print(f'  Brief length: {len(parts[1].strip())} chars')
        else:
            print(f'  First 300 chars: {content[:300]}')

conn.close()
