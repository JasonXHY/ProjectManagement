import sqlite3, json, os

db_path = r'C:\Users\kingdee\AppData\Roaming\pmaer\projects.db'
conn = sqlite3.connect(db_path)
cur = conn.cursor()

# Check project 10 storage
cur.execute('SELECT id, name, current_stage FROM projects WHERE id=10')
p = cur.fetchone()
print(f'Project 10: {p[1]}, stage={p[2]}')

# Search for the project directory
base = r'C:\Users\kingdee\AppData\Roaming\pmaer\projects'
for d in os.listdir(base):
    full = os.path.join(base, d)
    if os.path.isdir(full):
        # Check if this dir has the files we uploaded
        ai_dir = os.path.join(full, '.ai')
        files_dir = os.path.join(full, '售前')
        if os.path.exists(ai_dir) or os.path.exists(files_dir):
            file_count = sum(len(files) for _, _, files in os.walk(full))
            print(f'  {d}: {file_count} files')

# Also check settings for project_storage_path
cur.execute("SELECT value FROM settings WHERE key='project_storage_path'")
row = cur.fetchone()
if row:
    print(f'\nproject_storage_path setting: {row[0]}')

# Check if there's a different storage location
cur.execute('SELECT name FROM sqlite_master WHERE type="table"')
print(f'\nTables: {[r[0] for r in cur.fetchall()]}')

conn.close()
