import fs from 'fs';
import path from 'path';

const files = [
  'src/pages/Catalogo.tsx',
  'src/components/production/ProductionBatchTable.tsx',
  'src/components/layout/CommandPalette.tsx',
  'src/pages/DigitalMenu.tsx',
  'src/pages/Clientes.tsx',
  'src/pages/Consignacao.tsx',
  'src/pages/PublicMenu.tsx',
  'src/components/crm/SpecialOrdersTab.tsx',
  'src/components/production/ProductionDetailDrawer.tsx',
  'src/components/production/ProductionBatchDrawer.tsx',
  'src/components/sales/SaleSummary.tsx',
  'src/components/sales/SaleCart.tsx',
  'src/components/sales/ProductSearch.tsx',
  'src/components/finance/CashFlowPanel.tsx',
  'src/components/finance/SimpleDRE.tsx',
  'src/components/finance/AccountsPayableTable.tsx',
  'src/components/finance/FinancialSummaryCards.tsx',
  'src/components/finance/AccountsReceivableTable.tsx',
  'src/components/consignments/NewConsignmentDrawer.tsx'
];

function convertToFormatBRL(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let originalContent = content;

  // R$ ${someVar.toFixed(2)} and R$ {someVar.toFixed(2)} -> {formatBRL(someVar)}
  // Handle literal strings and JSX
  
  // 1. JSX: R$ {expr.toFixed(2)}
  content = content.replace(/R\$\s*\{([^}]+)\.toFixed\(2\)\}/g, '{formatBRL($1)}');
  
  // 2. JSX with Object.values complex replace (PublicMenu.tsx)
  content = content.replace(/R\$\s*\{\((.*?)\)\.toFixed\(2\)\}/g, '{formatBRL($1)}');

  // 3. String literals: `... R$ ${expr.toFixed(2)} ...`
  content = content.replace(/R\$\s*\$\{([^}]+)\.toFixed\(2\)\}/g, '${formatBRL($1)}');

  // 4. toLocaleString
  content = content.replace(/R\$\s*\{([^}]+)\.toLocaleString\('pt-BR',\s*\{\s*minimumFractionDigits:\s*2\s*\}\)\}/g, '{formatBRL($1)}');
  content = content.replace(/R\$\s*\{([^}]+)\.toLocaleString\('pt-BR'[^}]+\)\}/g, '{formatBRL($1)}');
  
  // 5. SpecialOrdersTab.tsx
  content = content.replace(/<span>R\$\s*\{([^}]+)\}<\/span>/g, '<span>{formatBRL($1)}</span>');

  // If changed, add import
  if (content !== originalContent) {
    if (!content.includes('formatBRL')) {
      const importLevels = (filePath.match(/\//g) || []).length;
      const relativeDots = importLevels === 1 ? '../' : '../../'; // simple heuristic
      
      // Calculate properly
      const depth = filePath.split('/').length - 2; // src/pages/Catalogo.tsx -> 2 - 2 = 0? No, src is 0, pages is 1
      const prefix = depth === 1 ? '../' : depth === 2 ? '../../' : '../../../';
      
      const importStatement = `\nimport { formatBRL } from '${prefix}lib/format';\n`;
      
      // find last import
      const lastImportMatch = [...content.matchAll(/^import .*;$/gm)].pop();
      if (lastImportMatch) {
         const index = lastImportMatch.index + lastImportMatch[0].length;
         content = content.slice(0, index) + importStatement + content.slice(index);
      } else {
         content = importStatement + content;
      }
    }
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Updated ${filePath}`);
  }
}

files.forEach(convertToFormatBRL);
