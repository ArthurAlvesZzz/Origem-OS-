import fs from 'fs';
import path from 'path';

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  if (!content.includes('alert(')) return;

  // Make sure useToast is imported
  if (!content.includes('useToast')) {
    // find relative depth to src/components/ui/Toast
    const depth = filePath.split('/').length - 2; // src/pages/Financeiro.tsx -> depth 1
    const prefix = depth > 0 ? '../'.repeat(depth) : './';
    const importStr = `import { useToast } from '${prefix}components/ui/Toast';\n`;
    
    // insert after imports
    const match = content.match(/^import.*$/m);
    if (match) {
        const lastImportIndex = content.lastIndexOf('import');
        const endOfImport = content.indexOf('\n', lastImportIndex);
        content = content.slice(0, endOfImport + 1) + importStr + content.slice(endOfImport + 1);
    } else {
        content = importStr + content;
    }
  }

  // Find component to insert const { success, error, info } = useToast();
  // Usually right after "export function X() {"
  const funcMatch = content.match(/export\s+function\s+[A-Za-z0-9_]+\s*\([^)]*\)\s*{/);
  if (funcMatch && !content.includes('useToast()')) {
    content = content.replace(funcMatch[0], `${funcMatch[0]}\n  const { success, error: toastError, info } = useToast();`);
  }

  // replace alert(...) with correct toast type
  content = content.replace(/alert\((.*?)sucesso(.*)\)/g, 'success($1sucesso$2)');
  content = content.replace(/alert\((.*?)Erro(.*)\)/g, 'toastError($1Erro$2)');
  content = content.replace(/alert\((.*?)\)/g, 'toastError($1)'); // Default to error as most alerts are errors

  fs.writeFileSync(filePath, content);
  console.log(`Replaced in ${filePath}`);
}

function traverse(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      traverse(fullPath);
    } else if (fullPath.endsWith('.tsx')) {
      replaceInFile(fullPath);
    }
  }
}

traverse('src');
