// log-analyzer.mjs
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

// 1. Argument Parsing & Validation
const [,, targetDirArg, outputFileArg] = process.argv;

if (!targetDirArg || !outputFileArg) {
  console.error('Usage: node log-analyzer.mjs <target-dir> <output-file>');
  process.exit(1);
}

const targetDir = path.resolve(process.cwd(), targetDirArg);
const outputFile = path.resolve(process.cwd(), outputFileArg);

async function analyzeLogFile(filePath) {
// TODO: Read the file, count lines and errors, return metrics object

const content = await readFile(filePath, 'utf-8');
const lines = content.split('\n');
const errors = lines.filter(
    line => line.includes("ERROR")
  );
const errorCount = errors.length;

  return {
    file: path.basename(filePath),
    totalLines: lines.length,
    errors: errorCount
  };
}
async function run() {
  try {
    // 2. Read directory entries
    const entries = await readdir(targetDir, { withFileTypes: true });

    // 3. Filter for .log files only
    const logFiles = entries
      .filter(entry => entry.isFile() && path.extname(entry.name) === '.log')
      .map(entry => path.join(targetDir, entry.name));

    // 4. Concurrently process files
    const fileStats = await Promise.all(logFiles.map(analyzeLogFile));

    // 5. Aggregate totals
    const report = {
      timestamp: new Date().toISOString(),
      directoryScanned: targetDir,
      filesProcessed: fileStats.length,
      aggregateLines: fileStats.reduce((acc, curr) => acc + curr.totalLines, 0),
      aggregateErrors: fileStats.reduce((acc, curr) => acc + curr.errors, 0),
      details: fileStats
    };

    // 6. Write output report
    await writeFile(outputFile, JSON.stringify(report, null, 2), 'utf-8');
    console.log(`Success: Report written to ${outputFile}`);

  } catch (error) {
    console.error(`Fatal I/O Error: ${error.message}`);
    process.exit(2);
  }
}

run();
