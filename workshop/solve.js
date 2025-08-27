#!/usr/bin/env node

/**
 * Workshop Solve Script with Backup & Restore
 *
 * This script replaces placeholder sections in the workshop files with solutions.
 * It automatically backs up original placeholder content and can restore it.
 *
 * Usage: node solve.js [command] [solution-id]
 *
 * Commands:
 *   solve [solution-id]  - Apply a specific solution
 *   restore [solution-id] - Restore a specific placeholder
 *   all                 - Apply all solutions
 *   restore all         - Restore all placeholders
 *   backup              - Create backups of current state
 *   help                - Show this help message
 */

const fs = require("fs");
const path = require("path");

// Get the directory where this script is located
const SCRIPT_DIR = __dirname;

// Helper function to resolve paths relative to script location
function resolvePath(relativePath) {
  return path.resolve(SCRIPT_DIR, relativePath);
}

// Map of solution IDs to their file paths
const SOLUTION_MAP = {
  "similar-movies-retrieval": "solutions/similar-movies-retrieval.ts",
  "similar-movies-generation": "solutions/similar-movies-generation.ts",
  "semantic-search-vector": "solutions/semantic-search-vector.ts",
  "semantic-search-rerank": "solutions/semantic-search-rerank.ts",
  "semantic-search-insight": "solutions/semantic-search-insight.ts",
  "dense-embeddings-extract": "solutions/dense-embeddings-extract.ts",
  "dense-embeddings-upsert": "solutions/dense-embeddings-upsert.ts",
  "sparse-embeddings-extract": "solutions/sparse-embeddings-extract.ts",
  "sparse-embeddings-upsert": "solutions/sparse-embeddings-upsert.ts",
  "user-recommendations": "solutions/user-recommendations.ts",
};

// Map of solution IDs to their target files
const TARGET_MAP = {
  "similar-movies-retrieval": "../webapp/server/api/movies/[id]/similar.ts",
  "similar-movies-generation": "../webapp/server/api/movies/[id]/similar.ts",
  "semantic-search-vector": "../webapp/server/api/search/semantic.ts",
  "semantic-search-rerank": "../webapp/server/api/search/semantic.ts",
  "semantic-search-insight": "../webapp/server/api/search/semantic.ts",
  "dense-embeddings-extract":
    "../webapp/server/api/admin/generate-dense-embeddings.post.ts",
  "dense-embeddings-upsert":
    "../webapp/server/api/admin/generate-dense-embeddings.post.ts",
  "sparse-embeddings-extract":
    "../webapp/server/api/admin/generate-sparse-embeddings.post.ts",
  "sparse-embeddings-upsert":
    "../webapp/server/api/admin/generate-sparse-embeddings.post.ts",
  "user-recommendations": "../webapp/server/api/user/recommendations.ts",
};

// Backup storage
const BACKUP_FILE = "backups.json";
let backupData = {};

// Load existing backups
function loadBackups() {
  try {
    const backupPath = resolvePath(BACKUP_FILE);
    if (fs.existsSync(backupPath)) {
      backupData = JSON.parse(fs.readFileSync(backupPath, "utf8"));
    }
  } catch (error) {
    console.log("No existing backups found, starting fresh");
    backupData = {};
  }
}

// Save backups
function saveBackups() {
  try {
    const backupPath = resolvePath(BACKUP_FILE);
    const backupDir = path.dirname(backupPath);
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
  } catch (error) {
    console.error("Error saving backups:", error.message);
  }
}

// Find placeholder section by ID
function findPlaceholderSection(content, solutionId) {
  const lines = content.split("\n");
  let startLine = -1;
  let endLine = -1;

  // Find the start of the placeholder section
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(`PLACEHOLDER ID: ${solutionId}`)) {
      startLine = i - 1; // Go back to the comment line with =====
      break;
    }
  }

  if (startLine === -1) {
    return null;
  }

  // Find the end of the placeholder section (look for the NEXT ===== line)
  for (let i = startLine + 1; i < lines.length; i++) {
    if (
      lines[i].includes(
        "============================================================="
      )
    ) {
      endLine = i;
      break;
    }
  }

  if (endLine === -1) {
    return null;
  }

  return { startLine, endLine };
}

// Create backup of current placeholder content
function createBackup(content, solutionId) {
  const section = findPlaceholderSection(content, solutionId);

  if (!section) {
    return false;
  }

  const lines = content.split("\n");

  // Find the start and end of the arrow section within the placeholder
  let arrowStart = -1;
  let arrowEnd = -1;

  for (let i = section.startLine; i <= section.endLine; i++) {
    const line = lines[i];
    if (
      line.includes(
        "↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓"
      )
    ) {
      arrowStart = i;
    }
    if (
      line.includes(
        "↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑"
      )
    ) {
      arrowEnd = i;
      break;
    }
  }

  if (arrowStart === -1 || arrowEnd === -1) {
    return false;
  }

  // Only backup the content BETWEEN the arrows (exclusive)
  const contentBetweenArrows = lines.slice(arrowStart + 1, arrowEnd);

  // Store the backup
  if (!backupData[solutionId]) {
    backupData[solutionId] = {};
  }
  backupData[solutionId].content = contentBetweenArrows.join("\n");
  backupData[solutionId].timestamp = new Date().toISOString();

  return true;
}

// Replace placeholder with solution
function replacePlaceholder(content, solutionId, solutionContent) {
  const section = findPlaceholderSection(content, solutionId);

  if (!section) {
    console.error(
      `❌ Could not find placeholder section with ID: ${solutionId}`
    );
    return null;
  }

  // Create backup before replacing
  if (!createBackup(content, solutionId)) {
    console.error(`❌ Could not create backup for ${solutionId}`);
    return null;
  }

  const lines = content.split("\n");
  const beforeSection = lines.slice(0, section.startLine);
  const afterSection = lines.slice(section.endLine + 1);

  // Find the start and end of the arrow section within the placeholder
  let arrowStart = -1;
  let arrowEnd = -1;

  for (let i = section.startLine; i <= section.endLine; i++) {
    const line = lines[i];

    if (
      line.includes(
        "↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓"
      )
    ) {
      arrowStart = i;
    }
    if (
      line.includes(
        "↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑"
      )
    ) {
      arrowEnd = i;
      break;
    }
  }

  if (arrowStart === -1 || arrowEnd === -1) {
    console.error(
      `❌ Could not find arrow markers in placeholder section for ${solutionId}`
    );
    return null;
  }

  // Keep the placeholder structure (including ID) and only replace the content between arrows
  const placeholderHeader = lines.slice(section.startLine, arrowStart + 1);
  const placeholderFooter = lines.slice(arrowEnd, section.endLine + 1);

  // Add the solution content between the arrows
  const newContent = [
    ...beforeSection,
    ...placeholderHeader,
    ...solutionContent.split("\n"),
    ...placeholderFooter,
    ...afterSection,
  ].join("\n");

  return newContent;
}

// Restore placeholder from backup
function restorePlaceholder(content, solutionId) {
  if (!backupData[solutionId] || backupData[solutionId].content === undefined) {
    console.error(`❌ No backup found for ${solutionId}`);
    return null;
  }

  const section = findPlaceholderSection(content, solutionId);

  if (!section) {
    console.error(
      `❌ Could not find placeholder section with ID: ${solutionId}`
    );
    return null;
  }

  const lines = content.split("\n");

  // Find the start and end of the arrow section within the placeholder
  let arrowStart = -1;
  let arrowEnd = -1;

  for (let i = section.startLine; i <= section.endLine; i++) {
    const line = lines[i];
    if (
      line.includes(
        "↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓"
      )
    ) {
      arrowStart = i;
    }
    if (
      line.includes(
        "↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑"
      )
    ) {
      arrowEnd = i;
      break;
    }
  }

  if (arrowStart === -1 || arrowEnd === -1) {
    console.error(
      `❌ Could not find arrow markers in placeholder section for ${solutionId}`
    );
    return null;
  }

  // Replace only the content between arrows, keeping the rest of the file intact
  const beforeArrows = lines.slice(0, arrowStart + 1);
  const afterArrows = lines.slice(arrowEnd);
  const backupContent = backupData[solutionId].content.split("\n");

  const newContent = [...beforeArrows, ...backupContent, ...afterArrows].join(
    "\n"
  );

  return newContent;
}

// File operations
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    process.exit(1);
  }
}

function writeFile(filePath, content) {
  try {
    fs.writeFileSync(filePath, content, "utf8");
    console.log(`✅ Updated ${filePath}`);
  } catch (error) {
    console.error(`Error writing file ${filePath}:`, error.message);
    process.exit(1);
  }
}

// Apply solution
function solveSolution(solutionId) {
  const solutionPath = resolvePath(SOLUTION_MAP[solutionId]);
  const targetPath = resolvePath(TARGET_MAP[solutionId]);

  if (!SOLUTION_MAP[solutionId] || !TARGET_MAP[solutionId]) {
    console.error(`❌ Unknown solution ID: ${solutionId}`);
    return false;
  }

  console.log(`🔍 Solving ${solutionId}...`);
  console.log(`📁 Solution file: ${solutionPath}`);
  console.log(`🎯 Target file: ${targetPath}`);

  // Read the solution content
  const solutionContent = readFile(solutionPath);

  // Read the target file
  const targetContent = readFile(targetPath);

  // Replace the placeholder with the solution
  const newContent = replacePlaceholder(
    targetContent,
    solutionId,
    solutionContent
  );

  if (newContent) {
    // Write the updated content back to the target file
    writeFile(targetPath, newContent);
    console.log(`🎉 Successfully applied solution: ${solutionId}`);

    // Save the backup
    saveBackups();
    return true;
  }

  return false;
}

// Restore solution
function restoreSolution(solutionId) {
  const targetPath = resolvePath(TARGET_MAP[solutionId]);

  if (!TARGET_MAP[solutionId]) {
    console.error(`❌ Unknown solution ID: ${solutionId}`);
    return false;
  }

  console.log(`🔄 Restoring ${solutionId} to placeholder...`);
  console.log(`🎯 Target file: ${targetPath}`);

  // Read the target file
  const targetContent = readFile(targetPath);

  // Restore the placeholder
  const newContent = restorePlaceholder(targetContent, solutionId);

  if (newContent) {
    // Write the updated content back to the target file
    writeFile(targetPath, newContent);
    console.log(`✅ Successfully restored placeholder: ${solutionId}`);
    return true;
  }

  return false;
}

// Apply all solutions
function solveAll() {
  console.log("🚀 Solving all workshop solutions...\n");

  let successCount = 0;
  let totalCount = Object.keys(SOLUTION_MAP).length;

  for (const solutionId of Object.keys(SOLUTION_MAP)) {
    if (solveSolution(solutionId)) {
      successCount++;
    }
    console.log(""); // Add spacing between solutions
  }

  console.log(
    `📊 Summary: ${successCount}/${totalCount} solutions applied successfully`
  );
}

// Restore all solutions
function restoreAll() {
  console.log("🔄 Restoring all workshop placeholders...\n");

  let successCount = 0;
  let totalCount = Object.keys(TARGET_MAP).length;

  for (const solutionId of Object.keys(TARGET_MAP)) {
    if (restoreSolution(solutionId)) {
      successCount++;
    }
    console.log(""); // Add spacing between restorations
  }

  console.log(
    `📊 Summary: ${successCount}/${totalCount} placeholders restored successfully`
  );
}

// Create backups of current state
function createBackups() {
  console.log("💾 Creating backups of current workshop state...\n");
  console.log(
    "⚠️  WARNING: This will create backups of the current state of all workshop files."
  );
  console.log(
    "   Make sure all files are in their clean, original placeholder state before proceeding.\n"
  );

  // Ask for confirmation
  const readline = require("readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question(
    "Are you sure you want to create backups? (yes/no): ",
    (answer) => {
      rl.close();

      if (answer.toLowerCase() !== "yes" && answer.toLowerCase() !== "y") {
        console.log("❌ Backup creation cancelled.");
        return;
      }

      console.log("✅ Proceeding with backup creation...\n");

      let backupCount = 0;
      let totalCount = Object.keys(TARGET_MAP).length;

      for (const solutionId of Object.keys(TARGET_MAP)) {
        const targetPath = resolvePath(TARGET_MAP[solutionId]);
        console.log(`📁 Backing up ${solutionId}...`);

        try {
          const targetContent = readFile(targetPath);
          if (createBackup(targetContent, solutionId)) {
            backupCount++;
            console.log(`✅ Backup created for ${solutionId}`);
          } else {
            console.log(`⚠️  No placeholder found for ${solutionId}`);
          }
        } catch (error) {
          console.log(`❌ Error backing up ${solutionId}: ${error.message}`);
        }
        console.log("");
      }

      // Save all backups
      saveBackups();
      console.log(
        `📊 Summary: ${backupCount}/${totalCount} backups created successfully`
      );
      console.log(`💾 Backups saved to: ${BACKUP_FILE}`);
    }
  );
}

// Show help
function showHelp() {
  console.log(`
Workshop Solve Script with Backup & Restore

Usage: node solve.js [command] [solution-id]

Commands:
  solve [solution-id]  - Apply a specific solution (default command)
  restore [solution-id] - Restore a specific placeholder from backup
  all                 - Apply all solutions
  restore all         - Restore all placeholders from backups
  backup              - Create backups of current state
  help                - Show this help message

Available Solution IDs:
${Object.keys(SOLUTION_MAP)
  .map((id) => `  ${id}`)
  .join("\n")}

Examples:
  node solve.js similar-movies-retrieval
  node solve.js all
  node solve.js restore similar-movies-retrieval
  node solve.js restore all
  node solve.js backup
  node solve.js help

Backup System:
  - Automatically creates backups when applying solutions
  - Use 'backup' command to manually create backups
  - Backups are stored in: ${resolvePath(BACKUP_FILE)}
`);
}

// Main function
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("help")) {
    showHelp();
    return;
  }

  // Load existing backups
  loadBackups();

  const command = args[0];
  const solutionId = args[1];

  if (command === "backup") {
    createBackups();
  } else if (command === "restore") {
    if (solutionId === "all") {
      restoreAll();
    } else if (TARGET_MAP[solutionId]) {
      restoreSolution(solutionId);
    } else {
      console.error(`❌ Unknown solution ID: ${solutionId}`);
      console.log('\nUse "node solve.js help" to see available solutions');
      process.exit(1);
    }
  } else if (command === "all") {
    solveAll();
  } else if (SOLUTION_MAP[command]) {
    // If first arg is a solution ID, treat it as solve command
    solveSolution(command);
  } else {
    console.error(`❌ Unknown command: ${command}`);
    console.log('\nUse "node solve.js help" to see available commands');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  solveSolution,
  solveAll,
  restoreSolution,
  restoreAll,
  createBackups,
  SOLUTION_MAP,
  TARGET_MAP,
};
