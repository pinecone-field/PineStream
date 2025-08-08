#!/usr/bin/env python3
import sqlite3
import csv
import os
import glob
import re
from pathlib import Path
from difflib import SequenceMatcher

def load_csv_data(csv_files):
    """Load all plot data from CSV files with comprehensive normalization strategies"""
    plot_data = {}
    normalized_plot_data = {}
    no_article_plot_data = {}
    simplified_plot_data = {}
    # Additional strategies
    no_colon_plot_data = {}
    no_number_plot_data = {}
    word_only_plot_data = {}
    
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
                        
                        # Strategy 2: Remove articles
                        no_article_title = re.sub(r'^(A|An|The)\s+', '', title, flags=re.IGNORECASE)
                        if no_article_title != title:
                            no_article_plot_data[no_article_title] = plot
                        
                        # Strategy 3: Simplified title
                        simplified_title = re.sub(r'[^\w\s]', '', title)
                        simplified_title = re.sub(r'\s+', ' ', simplified_title).strip()
                        if simplified_title:
                            simplified_plot_data[simplified_title] = plot
                        
                        # Strategy 4: Remove colons and subtitles
                        no_colon_title = re.sub(r':\s*.*$', '', title)
                        if no_colon_title != title:
                            no_colon_plot_data[no_colon_title] = plot
                        
                        # Strategy 5: Remove numbers
                        no_number_title = re.sub(r'\d+', '', title)
                        no_number_title = re.sub(r'\s+', ' ', no_number_title).strip()
                        if no_number_title:
                            no_number_plot_data[no_number_title] = plot
                        
                        # Strategy 6: Word-only (remove all punctuation and numbers)
                        word_only_title = re.sub(r'[^\w\s]', '', title)
                        word_only_title = re.sub(r'\d+', '', word_only_title)
                        word_only_title = re.sub(r'\s+', ' ', word_only_title).strip()
                        if word_only_title:
                            word_only_plot_data[word_only_title] = plot
                            
        except Exception as e:
            print(f"Error processing {csv_file}: {e}")
    
    return plot_data, normalized_plot_data, no_article_plot_data, simplified_plot_data, no_colon_plot_data, no_number_plot_data, word_only_plot_data

def find_fuzzy_matches(db_title, plot_data_dict, threshold=0.85):
    """Find fuzzy matches using sequence matcher"""
    matches = []
    for csv_title, plot in plot_data_dict.items():
        similarity = SequenceMatcher(None, db_title.lower(), csv_title.lower()).ratio()
        if similarity >= threshold:
            matches.append((csv_title, plot, similarity))
    return sorted(matches, key=lambda x: x[2], reverse=True)

def find_missing_plots_advanced(db_path, plot_data, normalized_plot_data, no_article_plot_data, 
                               simplified_plot_data, no_colon_plot_data, no_number_plot_data, word_only_plot_data):
    """Find additional plots using comprehensive heuristics"""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT id, title FROM movies WHERE plot IS NULL")
    movies_without_plots = cursor.fetchall()
    conn.close()
    
    print(f"Movies without plots: {len(movies_without_plots)}")
    
    additional_matches = []
    
    for movie_id, db_title in movies_without_plots:
        plot = None
        match_type = None
        
        # Strategy 1: Normalized match
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
        
        # Strategy 4: Remove colons
        elif re.sub(r':\s*.*$', '', db_title) in no_colon_plot_data:
            no_colon_db = re.sub(r':\s*.*$', '', db_title)
            plot = no_colon_plot_data[no_colon_db]
            match_type = "no_colon"
        
        # Strategy 5: Remove numbers
        elif re.sub(r'\d+', '', db_title).strip() in no_number_plot_data:
            no_number_db = re.sub(r'\d+', '', db_title)
            no_number_db = re.sub(r'\s+', ' ', no_number_db).strip()
            plot = no_number_plot_data[no_number_db]
            match_type = "no_number"
        
        # Strategy 6: Word-only
        elif re.sub(r'[^\w\s]', '', re.sub(r'\d+', '', db_title)).strip() in word_only_plot_data:
            word_only_db = re.sub(r'[^\w\s]', '', re.sub(r'\d+', '', db_title))
            word_only_db = re.sub(r'\s+', ' ', word_only_db).strip()
            plot = word_only_plot_data[word_only_db]
            match_type = "word_only"
        
        # Strategy 7: Case-insensitive versions of all above
        elif normalized_db.lower() in {title.lower() for title in normalized_plot_data}:
            for csv_title, csv_plot in normalized_plot_data.items():
                if csv_title.lower() == normalized_db.lower():
                    plot = csv_plot
                    match_type = "case_insensitive_normalized"
                    break
        
        # Strategy 8: Fuzzy matching for high-confidence matches
        else:
            # Try fuzzy matching on normalized titles
            fuzzy_matches = find_fuzzy_matches(normalized_db, normalized_plot_data, threshold=0.9)
            if fuzzy_matches:
                best_match = fuzzy_matches[0]
                if best_match[2] >= 0.95:  # Very high confidence
                    plot = best_match[1]
                    match_type = f"fuzzy_{best_match[2]:.2f}"
        
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
    for movie_id, title, plot, match_type in additional_matches[:10]:
        print(f"  '{title}' (matched via {match_type})")

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
    
    # Load plot data with comprehensive strategies
    plot_data, normalized_plot_data, no_article_plot_data, simplified_plot_data, no_colon_plot_data, no_number_plot_data, word_only_plot_data = load_csv_data(csv_files)
    
    # Find additional plots
    additional_matches = find_missing_plots_advanced(db_path, plot_data, normalized_plot_data, no_article_plot_data, 
                                                   simplified_plot_data, no_colon_plot_data, no_number_plot_data, word_only_plot_data)
    
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