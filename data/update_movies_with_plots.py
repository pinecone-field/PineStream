#!/usr/bin/env python3
import sqlite3
import csv
import os
import glob
from pathlib import Path

def add_plot_column(db_path):
    """Add plot column to movies table if it doesn't exist"""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Check if plot column exists
    cursor.execute("PRAGMA table_info(movies)")
    columns = [column[1] for column in cursor.fetchall()]
    
    if 'plot' not in columns:
        print("Adding plot column to movies table...")
        cursor.execute("ALTER TABLE movies ADD COLUMN plot TEXT")
        conn.commit()
        print("Plot column added successfully!")
    else:
        print("Plot column already exists!")
    
    conn.close()

def load_csv_data(csv_files):
    """Load all plot data from CSV files"""
    plot_data = {}
    
    for csv_file in csv_files:
        print(f"Processing {csv_file}...")
        try:
            with open(csv_file, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    title = row['title'].strip()
                    plot = row['plot'].strip()
                    if title and plot:
                        plot_data[title] = plot
        except Exception as e:
            print(f"Error processing {csv_file}: {e}")
    
    print(f"Loaded {len(plot_data)} movie plots from CSV files")
    return plot_data

def update_database(db_path, plot_data):
    """Update database with plot data"""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Get all movie titles from database
    cursor.execute("SELECT id, title FROM movies")
    movies = cursor.fetchall()
    
    updated_count = 0
    matched_count = 0
    
    for movie_id, db_title in movies:
        # Try to find exact match first
        if db_title in plot_data:
            plot = plot_data[db_title]
            cursor.execute("UPDATE movies SET plot = ? WHERE id = ?", (plot, movie_id))
            updated_count += 1
            matched_count += 1
            continue
        
        # Try case-insensitive match
        db_title_lower = db_title.lower()
        for csv_title, plot in plot_data.items():
            if csv_title.lower() == db_title_lower:
                cursor.execute("UPDATE movies SET plot = ? WHERE id = ?", (plot, movie_id))
                updated_count += 1
                matched_count += 1
                break
    
    conn.commit()
    conn.close()
    
    print(f"Updated {updated_count} movies with plot data")
    print(f"Matched {matched_count} movies out of {len(movies)} total movies")

def main():
    # Paths - target webapp database, read CSV files from data folder
    script_dir = Path(__file__).parent
    webapp_dir = script_dir.parent / "webapp"
    db_path = webapp_dir / "movies.db"
    csv_pattern = script_dir / "*.csv"
    
    # Get all CSV files from data directory
    csv_files = glob.glob(str(csv_pattern))
    csv_files = [f for f in csv_files if os.path.basename(f).endswith('.csv')]
    
    print(f"Target database: {db_path}")
    print(f"Found {len(csv_files)} CSV files: {[os.path.basename(f) for f in csv_files]}")
    
    # Check if webapp database exists
    if not db_path.exists():
        print(f"Error: Database file {db_path} not found!")
        return
    
    # Add plot column
    add_plot_column(db_path)
    
    # Load plot data from CSV files
    plot_data = load_csv_data(csv_files)
    
    # Update database
    update_database(db_path, plot_data)
    
    print("Database update completed!")

if __name__ == "__main__":
    main() 