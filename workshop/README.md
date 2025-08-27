# Workshop Solution System

This directory contains the workshop solution system that allows you to replace placeholder sections in the code with actual implementations.

## Structure

```
workshop/
├── solutions/                    # Solution files for each placeholder
│   ├── similar-movies-retrieval.ts
│   ├── similar-movies-generation.ts
│   ├── semantic-search-vector.ts
│   ├── semantic-search-rerank.ts
│   ├── semantic-search-insight.ts
│   ├── dense-embeddings-extract.ts
│   ├── dense-embeddings-upsert.ts
│   ├── sparse-embeddings-extract.ts
│   ├── sparse-embeddings-upsert.ts
│   └── user-recommendations.ts
├── solve.js                     # Script to apply solutions
├── WORKSHOP_STEPS.md            # Original workshop documentation
├── backups.json                 # Backup storage (auto-generated)
└── README.md                    # This file
```

## How It Works

1. **Placeholder Sections**: Each placeholder section in the workshop files has been given a unique ID (e.g., `ID: similar-movies-retrieval`)

2. **Solution Files**: Each solution is stored in a separate file in the `solutions/` directory

3. **Solve Script**: The `solve.js` script can replace placeholders with solutions using their IDs

4. **Backup System**: Automatically creates backups of original placeholder content when applying solutions

5. **Restore Functionality**: Can restore placeholders to their exact original state using the backup system

## Usage

### Apply a Single Solution

```bash
# Apply the similar movies retrieval solution
node workshop/solve.js similar-movies-retrieval

# Apply the dense embeddings extract solution
node workshop/solve.js dense-embeddings-extract
```

### Apply All Solutions

```bash
# Apply all workshop solutions at once
node workshop/solve.js all
```

### Restore a Single Placeholder

```bash
# Restore the similar movies retrieval placeholder
node workshop/solve.js restore similar-movies-retrieval

# Restore the dense embeddings extract placeholder
node workshop/solve.js restore dense-embeddings-extract
```

### Restore All Placeholders

```bash
# Restore all workshop placeholders to their original state
node workshop/solve.js restore all
```

### Create Manual Backups

```bash
# Create backups of current workshop state
node workshop/solve.js backup
```

### Get Help

```bash
# Show available solutions and usage
node workshop/solve.js help
```

## Available Solutions

| Solution ID                 | Description                                | Target File                                                  |
| --------------------------- | ------------------------------------------ | ------------------------------------------------------------ |
| `similar-movies-retrieval`  | RAG retrieval for similar movies           | `webapp/server/api/movies/[id]/similar.ts`                   |
| `similar-movies-generation` | LLM generation for similarity descriptions | `webapp/server/api/movies/[id]/similar.ts`                   |
| `semantic-search-vector`    | Vector search implementation               | `webapp/server/api/search/semantic.ts`                       |
| `semantic-search-rerank`    | Reranking implementation                   | `webapp/server/api/search/semantic.ts`                       |
| `semantic-search-insight`   | LLM query analysis                         | `webapp/server/api/search/semantic.ts`                       |
| `dense-embeddings-extract`  | Dense embedding chunk extraction           | `webapp/server/api/admin/generate-dense-embeddings.post.ts`  |
| `dense-embeddings-upsert`   | Dense embedding Pinecone upsert            | `webapp/server/api/admin/generate-dense-embeddings.post.ts`  |
| `sparse-embeddings-extract` | Sparse embedding chunk extraction          | `webapp/server/api/admin/generate-sparse-embeddings.post.ts` |
| `sparse-embeddings-upsert`  | Sparse embedding Pinecone upsert           | `webapp/server/api/admin/generate-sparse-embeddings.post.ts` |
| `user-recommendations`      | User recommendation system                 | `webapp/server/api/user/recommendations.ts`                  |

## Example Workflow

1. **Start with placeholders**: The workshop files contain placeholder sections with IDs
2. **Create backups**: Use `backup` command to save current state
3. **Choose a solution**: Decide which part you want to implement
4. **Apply the solution**: Use the solve script to replace the placeholder
5. **Test**: Verify that the solution works as expected
6. **Continue**: Apply more solutions or work on other parts
7. **Reset if needed**: Use restore commands to get back to original state

## Key Features

### **Smart Backup System**

- 💾 Automatically creates backups when applying solutions
- 💾 Preserves exact original placeholder content
- 💾 Manual backup creation with `backup` command
- 💾 Backups stored in `workshop/backups.json`

### **Perfect Restore Functionality**

- 🔄 Restore individual placeholders from backups
- 🔄 Restore all placeholders at once
- 🔄 Exact restoration of original content
- 🔄 Perfect for resetting workshop state

### **Preserves Placeholder Structure**

- ✅ Keeps ID comments for re-applying solutions
- ✅ Maintains placeholder boundaries
- ✅ Only replaces code between arrows

### **Reusable Solutions**

- ♻️ Apply solutions multiple times
- ♻️ Switch between different implementations
- ♻️ Easy to test and iterate

## Backup System Details

The backup system works by:

1. **Automatic Backup Creation**: When you apply a solution, the script automatically backs up the original placeholder content
2. **Content Preservation**: Stores the exact text, comments, and structure of the original placeholder
3. **Restore Accuracy**: When restoring, it puts back the exact original content, not generic placeholders
4. **Persistent Storage**: Backups are saved to `workshop/backups.json` and persist between sessions

## Customization

You can modify the solution files in the `solutions/` directory to customize the implementations. The solve script will use your modified versions when applying solutions.

## Troubleshooting

- **Solution not found**: Make sure the solution ID exists in the `SOLUTION_MAP`
- **Target file not found**: Ensure the target file path is correct
- **Placeholder not found**: Check that the placeholder section has the correct ID format
- **Backup not found**: Use `backup` command to create backups before applying solutions

## Adding New Solutions

To add a new solution:

1. Create a new solution file in `workshop/solutions/`
2. Add the solution ID and file path to `SOLUTION_MAP` in `solve.js`
3. Add the target file mapping to `TARGET_MAP` in `solve.js`
4. Add the ID comment to the placeholder section in the target file

## Notes

- The solve script preserves the original file structure and only replaces the placeholder sections
- Solutions are applied in-place, so make sure to backup your files if needed
- The script handles different file formats and preserves line endings
- The backup system ensures you can always restore to the exact original state
- Backups are automatically created when applying solutions, so you never lose original content
