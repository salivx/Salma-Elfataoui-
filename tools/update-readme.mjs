#!/usr/bin/env node
// Régénère les sections automatiques du README.md racine.
//
// Usage : node tools/update-readme.mjs          (réécrit README.md)
//         node tools/update-readme.mjs --check  (code de sortie 1 si README.md n'est pas à jour)
//
// Seul le contenu situé entre les marqueurs <!-- AUTO:xxx:START --> et
// <!-- AUTO:xxx:END --> est remplacé ; le reste du README est conservé tel quel.
// Lancé automatiquement par le hook git .githooks/pre-commit.

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const README = join(ROOT, 'README.md');
const IGNORED_DIRS = new Set(['.git', '.github', '.githooks', '.qodo', '.claude', 'docs', 'tools', 'node_modules', 'libraries', 'assets']);

// Comportements connus (noms de méthode, cf. docs/STEERING_BEHAVIORS.md).
const BEHAVIORS = [
  'seek', 'flee', 'arrive', 'pursue', 'pursuePerfect', 'evade', 'offsetPursue',
  'wander', 'avoid', 'avoidCollisions', 'boundaries', 'contain', 'followPath',
  'followWall', 'follow', 'separate', 'align', 'cohesion', 'flock',
  'followLeader', 'interpose', 'hide',
];

function naturalCompare(a, b) {
  return a.localeCompare(b, 'fr', { numeric: true, sensitivity: 'base' });
}

function listProjects() {
  return readdirSync(ROOT)
    .filter((name) => !IGNORED_DIRS.has(name))
    .filter((name) => statSync(join(ROOT, name)).isDirectory())
    .filter((name) => existsSync(join(ROOT, name, 'index.html')))
    .sort(naturalCompare);
}

function listJsFiles(dir) {
  let files = [];
  readdirSync(dir).forEach((name) => {
    let full = join(dir, name);
    if (statSync(full).isDirectory()) {
      if (!IGNORED_DIRS.has(name)) {
        files = files.concat(listJsFiles(full));
      }
    } else if (name.endsWith('.js')) {
      files.push(full);
    }
  });
  return files.sort(naturalCompare);
}

function readTitleAndDescription(dir) {
  let title = basename(dir);
  let description = '';
  let readme = join(dir, 'README.md');
  if (existsSync(readme)) {
    let lines = readFileSync(readme, 'utf8').split(/\r?\n/);
    let heading = lines.find((l) => l.startsWith('# '));
    if (heading !== undefined) {
      title = heading.slice(2).trim();
    }
    let para = lines.find((l) => l.trim() !== '' && !l.startsWith('#'));
    if (para !== undefined) {
      description = para.trim();
    }
  } else {
    let html = readFileSync(join(dir, 'index.html'), 'utf8');
    let match = html.match(/<title>([^<]*)<\/title>/i);
    if (match !== null && match[1].trim() !== '' && match[1].trim() !== 'Sketch') {
      title = match[1].trim();
    }
  }
  return { title, description };
}

function analyzeProject(name) {
  let dir = join(ROOT, name);
  let classes = [];
  let behaviors = new Set();
  let warnings = [];

  listJsFiles(dir).forEach((file) => {
    let src = readFileSync(file, 'utf8');
    let rel = file.slice(dir.length + 1).replace(/\\/g, '/');
    let topLevel = [...src.matchAll(/^class\s+(\w+)(?:\s+extends\s+([\w.]+))?/gm)];

    topLevel.forEach((m) => {
      classes.push(m[2] === undefined ? m[1] : `${m[1]} → ${m[2]}`);
    });
    if (topLevel.length > 1) {
      warnings.push(`\`${rel}\` contient ${topLevel.length} classes`);
    }
    if (topLevel.length === 1 && basename(rel, '.js') !== topLevel[0][1]) {
      warnings.push(`\`${rel}\` devrait s'appeler \`${topLevel[0][1]}.js\``);
    }
    BEHAVIORS.forEach((b) => {
      if (new RegExp(`^\\s+${b}\\s*\\([^)]*\\)\\s*\\{`, 'm').test(src)) {
        behaviors.add(b);
      }
    });
  });

  return { name, ...readTitleAndDescription(dir), classes, behaviors: [...behaviors], warnings };
}

function projectsSection(projects) {
  let rows = projects.map((p) => {
    let link = `[${p.name}](${encodeURI(p.name)}/)`;
    let classes = p.classes.length > 0 ? p.classes.map((c) => `\`${c}\``).join(', ') : '—';
    let behaviors = p.behaviors.length > 0 ? p.behaviors.map((b) => `\`${b}\``).join(', ') : '—';
    let desc = p.description !== '' ? `${p.title} — ${p.description}` : p.title;
    return `| ${link} | ${desc} | ${classes} | ${behaviors} |`;
  });
  return [
    `${projects.length} application(s) détectée(s) (tout dossier contenant un \`index.html\`).`,
    '',
    '| Dossier | Description | Classes (→ parente) | Comportements implémentés |',
    '|---|---|---|---|',
    ...rows,
  ].join('\n');
}

function conformitySection(projects) {
  let lines = [];
  projects.forEach((p) => {
    p.warnings.forEach((w) => lines.push(`- ${p.name} : ${w}`));
  });
  if (lines.length === 0) {
    return 'Aucun écart détecté : une classe par fichier, fichiers nommés comme leur classe.';
  }
  return [
    'Écarts à la règle « une classe par fichier, nommé comme la classe » (voir [ARCHITECTURE.md](ARCHITECTURE.md)) :',
    '',
    ...lines,
  ].join('\n');
}

function historySection() {
  try {
    let log = execSync('git log -n 10 --date=short --pretty=format:"- %ad — %s (%an)"', {
      cwd: ROOT,
      encoding: 'utf8',
    }).trim();
    return log === '' ? 'Aucun commit.' : log;
  } catch {
    return 'Historique git indisponible.';
  }
}

function replaceSection(text, key, content) {
  let start = `<!-- AUTO:${key}:START -->`;
  let end = `<!-- AUTO:${key}:END -->`;
  let pattern = new RegExp(`${start}[\\s\\S]*?${end}`);
  if (!pattern.test(text)) {
    console.warn(`Marqueurs ${key} absents de README.md : section ignorée.`);
    return text;
  }
  return text.replace(pattern, () => `${start}\n${content}\n${end}`);
}

let projects = listProjects().map(analyzeProject);
let original = readFileSync(README, 'utf8');
let updated = original;
updated = replaceSection(updated, 'PROJECTS', projectsSection(projects));
updated = replaceSection(updated, 'CONFORMITY', conformitySection(projects));
updated = replaceSection(updated, 'HISTORY', historySection());

if (process.argv.includes('--check')) {
  if (updated !== original) {
    console.error('README.md n\'est pas à jour : lancez node tools/update-readme.mjs');
    process.exit(1);
  }
  console.log('README.md est à jour.');
} else if (updated !== original) {
  writeFileSync(README, updated);
  console.log('README.md mis à jour.');
} else {
  console.log('README.md déjà à jour.');
}
