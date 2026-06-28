import sqlite3

db_path = r'C:\Users\kingdee\AppData\Roaming\pmaer\projects.db'
conn = sqlite3.connect(db_path)
cur = conn.cursor()

# Check ALL projects' custom_stages
cur.execute('SELECT id, name, custom_stages FROM projects')
for row in cur.fetchall():
    cs = row[2]
    cs_type = type(cs).__name__
    cs_repr = repr(cs)[:80] if cs else 'None'
    print(f'Project {row[0]} ({row[1][:20]}): custom_stages={cs_type} = {cs_repr}')

conn.close()
