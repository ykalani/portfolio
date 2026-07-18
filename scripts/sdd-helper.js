const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const root = path.join(__dirname, "..");
const sddDir = path.join(root, ".superpowers", "sdd");

if (!fs.existsSync(sddDir)) {
  fs.mkdirSync(sddDir, { recursive: true });
}
fs.writeFileSync(path.join(sddDir, ".gitignore"), "*\n");

const action = process.argv[2];

if (action === "task-brief") {
  const planFile = process.argv[3];
  const taskNum = process.argv[4];
  
  if (!planFile || !taskNum) {
    console.error("Usage: node sdd-helper.js task-brief <plan_file> <task_number> [outfile]");
    process.exit(1);
  }

  const planPath = path.resolve(root, planFile);
  if (!fs.existsSync(planPath)) {
    console.error(`Plan file not found: ${planPath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(planPath, "utf-8");
  const lines = content.split(/\r?\n/);
  
  let inFence = false;
  let inTask = false;
  const taskLines = [];
  
  // Matches "### Task N: ..." or "## Task N: ..."
  const taskHeaderRegex = new RegExp(`^#+[ \\t]+Task[ \\t]+${taskNum}(?:[^0-9]|$)`, "i");
  const anyTaskHeaderRegex = /^#+[ \t]+Task[ \t]+[0-9]+/i;

  for (const line of lines) {
    if (line.startsWith("```")) {
      inFence = !inFence;
    }
    
    if (!inFence && anyTaskHeaderRegex.test(line)) {
      inTask = taskHeaderRegex.test(line);
    }
    
    if (inTask) {
      taskLines.push(line);
    }
  }

  if (taskLines.length === 0) {
    console.error(`Task ${taskNum} not found in plan file.`);
    process.exit(1);
  }

  const outFile = process.argv[5] || path.join(sddDir, `task-${taskNum}-brief.md`);
  fs.writeFileSync(outFile, taskLines.join("\n"), "utf-8");
  console.log(`Wrote task ${taskNum} brief to ${outFile}`);
} else if (action === "review-package") {
  const base = process.argv[3];
  const head = process.argv[4];

  if (!base || !head) {
    console.error("Usage: node sdd-helper.js review-package <base> <head> [outfile]");
    process.exit(1);
  }

  const outFile = process.argv[5] || path.join(sddDir, `review-${base.slice(0, 7)}..${head.slice(0, 7)}.diff`);

  try {
    const commits = execSync(`git log --oneline ${base}..${head}`, { encoding: "utf-8" });
    const stat = execSync(`git diff --stat ${base}..${head}`, { encoding: "utf-8" });
    const diff = execSync(`git diff -U10 ${base}..${head}`, { encoding: "utf-8" });

    const packageContent = [
      `# Review package: ${base}..${head}`,
      "",
      "## Commits",
      commits,
      "",
      "## Files changed",
      stat,
      "",
      "## Diff",
      diff
    ].join("\n");

    fs.writeFileSync(outFile, packageContent, "utf-8");
    console.log(`Wrote review package to ${outFile}`);
  } catch (err) {
    console.error(`Failed to generate review package: ${err.message}`);
    process.exit(1);
  }
} else {
  console.error("Unknown action. Use 'task-brief' or 'review-package'.");
  process.exit(1);
}
