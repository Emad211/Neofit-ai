import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import ts from 'typescript';

const sourceRoot = path.resolve('src');
const forbiddenModulePatterns = [
  /^react(?:\/|$)/,
  /^react-native(?:\/|$)/,
  /^expo(?:-|\/|$)/,
  /^@expo(?:\/|$)/,
  /^expo-sqlite(?:\/|$)/,
  /^better-sqlite3(?:\/|$)/,
  /^sqlite3(?:\/|$)/,
  /^next(?:\/|$)/,
  /^@supabase(?:\/|$)/,
  /^node:(?:fs|fs\/promises|http|https|net|tls|dns|child_process)(?:\/|$)/,
];
const forbiddenRuntimePatterns = [
  { label: 'fetch', pattern: /\bfetch\s*\(/ },
  { label: 'XMLHttpRequest', pattern: /\bXMLHttpRequest\b/ },
  { label: 'localStorage', pattern: /\blocalStorage\b/ },
  { label: 'sessionStorage', pattern: /\bsessionStorage\b/ },
  { label: 'process.env', pattern: /\bprocess\.env\b/ },
];

async function listTypeScriptFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await listTypeScriptFiles(absolute));
    else if (entry.isFile() && entry.name.endsWith('.ts')) files.push(absolute);
  }
  return files;
}

function moduleSpecifierFromNode(node) {
  if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier) {
    return ts.isStringLiteralLike(node.moduleSpecifier) ? node.moduleSpecifier.text : null;
  }
  if (ts.isImportEqualsDeclaration(node)
    && ts.isExternalModuleReference(node.moduleReference)
    && node.moduleReference.expression
    && ts.isStringLiteralLike(node.moduleReference.expression)) {
    return node.moduleReference.expression.text;
  }
  if (ts.isCallExpression(node) && node.arguments.length === 1) {
    const argument = node.arguments[0];
    if (!argument || !ts.isStringLiteralLike(argument)) return null;
    if (node.expression.kind === ts.SyntaxKind.ImportKeyword) return argument.text;
    if (ts.isIdentifier(node.expression) && node.expression.text === 'require') return argument.text;
  }
  return null;
}

const violations = [];
const files = await listTypeScriptFiles(sourceRoot);
for (const file of files) {
  const sourceText = await readFile(file, 'utf8');
  const relative = path.relative(process.cwd(), file);
  const sourceFile = ts.createSourceFile(relative, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);

  function visit(node) {
    const moduleName = moduleSpecifierFromNode(node);
    if (moduleName && forbiddenModulePatterns.some((pattern) => pattern.test(moduleName))) {
      const position = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
      violations.push(`${relative}:${position.line + 1}: forbidden module ${moduleName}`);
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);

  for (const item of forbiddenRuntimePatterns) {
    if (item.pattern.test(sourceText)) violations.push(`${relative}: forbidden runtime access ${item.label}`);
  }
}

if (violations.length > 0) {
  console.error('Nutrition Core pure-boundary violations:');
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log(`Pure boundary verified across ${files.length} TypeScript source files.`);
