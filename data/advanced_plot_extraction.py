#!/usr/bin/env python3
import sqlite3
import csv
import os
import glob
import re
from pathlib import Path

def load_csv_data(csv_files):
    """Load all plot data from CSV files with multiple normalization strategies"""
    plot_data = {}
    normalized_plot_data = {}
    # Additional normalization strategies
    no_article_plot_data = {}
    simplified_plot_data = {}
    
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
                        
                        # Strategy 1: Remove year suffixes
                        normalized_title = re.sub(r'\s*\([^)]*film\)', '', title)
                        normalized_title = re.sub(r'\s*\([^)]*\)', '', normalized_title)
                        normalized_title = normalized_title.strip()
                        if normalized_title:
                            normalized_plot_data[normalized_title] = plot
                        
                        # Strategy 2: Remove articles (A, An, The)
                        no_article_title = re.sub(r'^(A|An|The)\s+', '', title, flags=re.IGNORECASE)
                        if no_article_title != title:
                            no_article_plot_data[no_article_title] = plot
                        
                        # Strategy 3: Simplified title (remove special chars, extra spaces)
                        simplified_title = re.sub(r'[^\w\s]', '', title)
                        simplified_title = re.sub(r'\s+', ' ', simplified_title).strip()
                        if simplified_title:
                            simplified_plot_data[simplified_title] = plot
                            
        except Exception as e:
            print(f"Error processing {csv_file}: {e}")
    
    return plot_data, normalized_plot_data, no_article_plot_data, simplified_plot_data

def get_movies_without_plots(db_path):
    """Get all movies that don't have plots"""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT id, title FROM movies WHERE plot IS NULL")
    movies = cursor.fetchall()
    conn.close()
    return movies

def find_missing_plots(db_path, plot_data, normalized_plot_data, no_article_plot_data, simplified_plot_data):
    """Find additional plots using multiple heuristics"""
    movies_without_plots = get_movies_without_plots(db_path)
    print(f"Movies without plots: {len(movies_without_plots)}")
    
    additional_matches = []
    
    for movie_id, db_title in movies_without_plots:
        plot = None
        match_type = None
        
        # Strategy 1: Normalized match (remove year suffixes)
        normalized_db = re.sub(r'\s*\([^)]*film\)', '', db_title)
        normalized_db = re.sub(r'\s*\([^)]*\)', '', normalized_db)
        normalized_db = normalized_db.strip()
        if normalized_db in normalized_plot_data:
            plot = normalized_plot_data[normalized_db]
            match_type = "normalized"
        
        # Strategy 2: Remove articles
        elif re.sub(r'^(A|An|The)\s+', '', db_title, flags=re.IGNORECASE) in no_article_plot_data:
            no_article_db = re.sub(r'^(A|An|The)\s+', '', db_title, flags=re.IGNORECASE)
            plot = no_article_plot_data[no_article_db]
            match_type = "no_article"
        
        # Strategy 3: Simplified title
        elif re.sub(r'[^\w\s]', '', db_title).strip() in simplified_plot_data:
            simplified_db = re.sub(r'[^\w\s]', '', db_title)
            simplified_db = re.sub(r'\s+', ' ', simplified_db).strip()
            plot = simplified_plot_data[simplified_db]
            match_type = "simplified"
        
        # Strategy 4: Case-insensitive normalized
        elif normalized_db.lower() in {title.lower() for title in normalized_plot_data}:
            for csv_title, csv_plot in normalized_plot_data.items():
                if csv_title.lower() == normalized_db.lower():
                    plot = csv_plot
                    match_type = "case_insensitive_normalized"
                    break
        
        # Strategy 5: Case-insensitive no-article
        elif re.sub(r'^(A|An|The)\s+', '', db_title, flags=re.IGNORECASE).lower() in {title.lower() for title in no_article_plot_data}:
            no_article_db = re.sub(r'^(A|An|The)\s+', '', db_title, flags=re.IGNORECASE)
            for csv_title, csv_plot in no_article_plot_data.items():
                if csv_title.lower() == no_article_db.lower():
                    plot = csv_plot
                    match_type = "case_insensitive_no_article"
                    break
        
        if plot:
            additional_matches.append((movie_id, db_title, plot, match_type))
    
    return additional_matches

def update_database_with_additional_plots(db_path, additional_matches):
    """Update database with additional plots found"""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    updated_count = 0
    for movie_id, title, plot, match_type in additional_matches:
        cursor.execute("UPDATE movies SET plot = ? WHERE id = ?", (plot, movie_id))
        updated_count += 1
    
    conn.commit()
    conn.close()
    
    print(f"Updated {updated_count} additional movies with plot data")
    
    # Show some examples
    print(f"\nSample additional matches:")
    for movie_id, title, plot, match_type in additional_matches[:5]:
        print(f"  '{title}' (matched via {match_type})")

def analyze_missing_patterns(db_path):
    """Analyze patterns in movies without plots"""
    movies_without_plots = get_movies_without_plots(db_path)
    
    # Analyze title patterns
    patterns = {
        'with_years': 0,
        'with_colons': 0,
        'with_numbers': 0,
        'with_articles': 0,
        'very_long': 0,
        'very_short': 0
    }
    
    for _, title in movies_without_plots:
        if re.search(r'\(\d{4}\)', title):
            patterns['with_years'] += 1
        if ':' in title:
            patterns['with_colons'] += 1
        if re.search(r'\d+', title):
            patterns['with_numbers'] += 1
        if re.match(r'^(A|An|The)\s+', title, re.IGNORECASE):
            patterns['with_articles'] += 1
        if len(title) > 50:
            patterns['very_long'] += 1
        if len(title) < 10:
            patterns['very_short'] += 1
    
    print(f"\n=== PATTERN ANALYSIS OF MISSING PLOTS ===")
    for pattern, count in patterns.items():
        print(f"{pattern}: {count}")
    
    # Show some examples of missing movies
    print(f"\nSample movies without plots:")
    for _, title in movies_without_plots[:10]:
        print(f"  '{title}'")

def main():
    # Paths
    script_dir = Path(__file__).parent
    webapp_dir = script_dir.parent / "webapp"
    db_path = webapp_dir / "movies.db"
    csv_pattern = script_dir / "*.csv"
    
    # Get CSV files
    csv_files = glob.glob(str(csv_pattern))
    csv_files = [f for f in csv_files if os.path.basename(f).endswith('.csv')]
    
    print(f"Target database: {db_path}")
    print(f"Found {len(csv_files)} CSV files")
    
    # Load plot data with multiple strategies
    plot_data, normalized_plot_data, no_article_plot_data, simplified_plot_data = load_csv_data(csv_files)
    
    # Analyze missing patterns
    analyze_missing_patterns(db_path)
    
    # Find additional plots
    additional_matches = find_missing_plots(db_path, plot_data, normalized_plot_data, no_article_plot_data, simplified_plot_data)
    
    if additional_matches:
        print(f"\nFound {len(additional_matches)} additional matches!")
        update_database_with_additional_plots(db_path, additional_matches)
    else:
        print("\nNo additional matches found with current heuristics.")
    
    # Final count
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM movies WHERE plot IS NOT NULL")
    final_count = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM movies")
    total_count = cursor.fetchone()[0]
    conn.close()
    
    print(f"\nFinal results:")
    print(f"Movies with plots: {final_count}")
    print(f"Total movies: {total_count}")
    print(f"Match rate: {final_count/total_count*100:.1f}%")

if __name__ == "__main__":
    main() 