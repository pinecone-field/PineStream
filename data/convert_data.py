import pandas as pd
import sqlite3
import os

# Read the parquet file
df = pd.read_parquet('train-00000-of-00001.parquet')

# Filter out rows with null titles
df = df.dropna(subset=['Title'])

# Create SQLite database
conn = sqlite3.connect('movies.db')
cursor = conn.cursor()

# Create movies table
cursor.execute('''
CREATE TABLE IF NOT EXISTS movies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    overview TEXT,
    release_date TEXT,
    popularity REAL,
    vote_count INTEGER,
    vote_average REAL,
    original_language TEXT,
    genre TEXT,
    poster_url TEXT
)
''')

# Insert data from parquet to SQLite
for index, row in df.iterrows():
    cursor.execute('''
    INSERT INTO movies (title, overview, release_date, popularity, vote_count, vote_average, original_language, genre, poster_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        row['Title'],
        row['Overview'] if pd.notna(row['Overview']) else None,
        row['Release_Date'] if pd.notna(row['Release_Date']) else None,
        row['Popularity'] if pd.notna(row['Popularity']) else None,
        row['Vote_Count'] if pd.notna(row['Vote_Count']) else None,
        row['Vote_Average'] if pd.notna(row['Vote_Average']) else None,
        row['Original_Language'] if pd.notna(row['Original_Language']) else None,
        row['Genre'] if pd.notna(row['Genre']) else None,
        row['Poster_Url'] if pd.notna(row['Poster_Url']) else None
    ))

conn.commit()
conn.close()

print(f"Successfully converted {len(df)} movies to SQLite database")
print("Database file: movies.db") 