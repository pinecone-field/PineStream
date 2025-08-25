#!/bin/bash

# Script to clear chunk_mappings and user_watched_movies tables
# This will remove all data from these tables but keep the table structure

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Load environment variables from .env file
if [ -f ".env" ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo -e "${RED}❌ No .env or .example.env file found${NC}"
    exit 1
fi

# Database file path from environment variable, default to movies.db
DB_FILE="${DATABASE_FILE:-movies.db}"

echo -e "${BLUE}🗑️  Table Cleanup Script${NC}"
echo "================================"

# Check if database file exists
if [ ! -f "$DB_FILE" ]; then
    echo -e "${RED}❌ Database file not found: $DB_FILE${NC}"
    exit 1
fi

echo -e "${YELLOW}📁 Using database: $DB_FILE${NC}"
echo ""

# Function to clear a table and show results
clear_table() {
    local table_name=$1
    local display_name=$2
    
    echo -e "${YELLOW}🗑️  Checking $display_name table...${NC}"
    
    # Check if table exists
    local table_exists=$(sqlite3 "$DB_FILE" "SELECT name FROM sqlite_master WHERE type='table' AND name='$table_name';")
    
    if [ -z "$table_exists" ]; then
        echo -e "${YELLOW}⚠️  Table $display_name does not exist, skipping${NC}"
        return 0
    fi
    
    echo -e "${YELLOW}🗑️  Clearing $display_name table...${NC}"
    
    # Get row count before clearing
    local before_count=$(sqlite3 "$DB_FILE" "SELECT COUNT(*) FROM $table_name;")
    
    # Clear the table
    sqlite3 "$DB_FILE" "DELETE FROM $table_name;"
    
    # Get row count after clearing
    local after_count=$(sqlite3 "$DB_FILE" "SELECT COUNT(*) FROM $table_name;")
    
    local cleared_count=$((before_count - after_count))
    echo -e "${GREEN}✅ Cleared $cleared_count rows from $display_name${NC}"
}

# Clear chunk_mappings table
clear_table "chunk_mappings" "chunk_mappings"

# Clear user_watched_movies table
clear_table "user_watched_movies" "user_watched_movies"

echo ""
echo -e "${BLUE}📊 Final table status:${NC}"
echo "================================"

# Show final counts for existing tables
chunk_exists=$(sqlite3 "$DB_FILE" "SELECT name FROM sqlite_master WHERE type='table' AND name='chunk_mappings';")
if [ -n "$chunk_exists" ]; then
    chunk_count=$(sqlite3 "$DB_FILE" "SELECT COUNT(*) FROM chunk_mappings;")
    echo -e "   chunk_mappings: ${GREEN}$chunk_count rows${NC}"
else
    echo -e "   chunk_mappings: ${YELLOW}table does not exist${NC}"
fi

watched_exists=$(sqlite3 "$DB_FILE" "SELECT name FROM sqlite_master WHERE type='table' AND name='user_watched_movies';")
if [ -n "$watched_exists" ]; then
    watched_count=$(sqlite3 "$DB_FILE" "SELECT COUNT(*) FROM user_watched_movies;")
    echo -e "   user_watched_movies: ${GREEN}$watched_count rows${NC}"
else
    echo -e "   user_watched_movies: ${YELLOW}table does not exist${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Table cleanup completed successfully!${NC}"
