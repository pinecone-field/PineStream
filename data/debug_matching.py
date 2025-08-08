#!/usr/bin/env python3
import sqlite3
import csv
import os
import glob
from pathlib import Path

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
    
    return plot_data

def analyze_matching():
    # Paths
    script_dir = Path(__file__).parent
    webapp_dir = script_dir.parent / "webapp"
    db_path = webapp_dir / "movies.db"
    csv_pattern = script_dir / "*.csv"
    
    # Get CSV files
    csv_files = glob.glob(str(csv_pattern))
    csv_files = [f for f in csv_files if os.path.basename(f).endswith('.csv')]
    
    # Load CSV data
    plot_data = load_csv_data(csv_files)
    csv_titles = set(plot_data.keys())
    csv_titles_lower = {title.lower() for title in csv_titles}
    
    print(f"CSV titles loaded: {len(csv_titles)}")
    
    # Get database titles
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT id, title FROM movies")
    db_movies = cursor.fetchall()
    conn.close()
    
    db_titles = {title for _, title in db_movies}
    db_titles_lower = {title.lower() for title in db_titles}
    
    print(f"Database titles: {len(db_titles)}")
    
    # Analyze exact matches
    exact_matches = csv_titles.intersection(db_titles)
    print(f"Exact matches: {len(exact_matches)}")
    
    # Analyze case-insensitive matches
    case_insensitive_matches = csv_titles_lower.intersection(db_titles_lower)
    print(f"Case-insensitive matches: {len(case_insensitive_matches)}")
    
    # Show some examples of titles that don't match
    print("\n=== SAMPLE ANALYSIS ===")
    
    # Show some CSV titles that aren't in DB
    csv_only = csv_titles - db_titles
    print(f"\nCSV titles not in DB (first 10):")
    for title in list(csv_only)[:10]:
        print(f"  '{title}'")
    
    # Show some DB titles that aren't in CSV
    db_only = db_titles - csv_titles
    print(f"\nDB titles not in CSV (first 10):")
    for title in list(db_only)[:10]:
        print(f"  '{title}'")
    
    # Show some exact matches
    print(f"\nExact matches (first 10):")
    for title in list(exact_matches)[:10]:
        print(f"  '{title}'")
    
    # Check for common patterns
    print(f"\n=== PATTERN ANALYSIS ===")
    
    # Check for year differences
    csv_with_years = {title for title in csv_titles if '(' in title and ')' in title}
    db_with_years = {title for title in db_titles if '(' in title and ')' in title}
    
    print(f"CSV titles with years: {len(csv_with_years)}")
    print(f"DB titles with years: {len(db_with_years)}")
    
    # Show some examples
    print(f"\nCSV titles with years (first 5):")
    for title in list(csv_with_years)[:5]:
        print(f"  '{title}'")
    
    print(f"\nDB titles with years (first 5):")
    for title in list(db_with_years)[:5]:
        print(f"  '{title}'")

if __name__ == "__main__":
    analyze_matching() 