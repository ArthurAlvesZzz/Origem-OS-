import fs from 'fs';
import path from 'path';

const files = [
  'src/components/finance/AccountsPayableTable.tsx',
  'src/components/finance/AccountsReceivableTable.tsx',
  'src/components/finance/CashFlowPanel.tsx',
  'src/components/finance/FinancialSummaryCards.tsx',
  'src/components/finance/SimpleDRE.tsx',
  'src/components/consignments/NewConsignmentDrawer.tsx',
  'src/components/crm/SpecialOrdersTab.tsx',
  'src/components/layout/CommandPalette.tsx',
  'src/components/production/ProductionBatchDrawer.tsx',
  'src/components/production/ProductionBatchTable.tsx',
  'src/components/production/ProductionDetailDrawer.tsx',
  'src/components/sales/NewSaleDrawer.tsx',
  'src/components/sales/ProductSearch.tsx',
  'src/components/sales/SaleCart.tsx',
  'src/components/sales/SaleSummary.tsx',
  'src/pages/Catalogo.tsx',
  'src/pages/Clientes.tsx',
  'src/pages/Comercial.tsx',
  'src/pages/Consignacao.tsx',
  'src/pages/Dashboard.tsx',
  'src/pages/DigitalMenu.tsx',
  'src/pages/PublicMenu.tsx'
];

function fixImports(file) {
   let content = fs.readFileSync(file, 'utf8');
   
   if (content.includes('import { formatBRL } from')) {
      // remove wrong formatBRL imports
      content = content.replace(/import\s+\{\s*formatBRL\s*\}\s*from\s*['"][^'"]+['"];?\n?/g, '');
   }
   
   if (content.includes('formatBRL')) {
      const parts = file.split('/');
      // e.g. src/pages/Catalogo.tsx -> length 3 (src, pages, Catalogo.tsx) -> 1 level up is ../
      // src/components/sales/SaleCart.tsx -> length 4 (src, components, sales, SaleCart) -> 2 levels up is ../../
      let prefix = '';
      if (parts.length === 3) prefix = '../';
      else if (parts.length === 4) prefix = '../../';
      else if (parts.length === 5) prefix = '../../../';
      
      const importStatement = `import { formatBRL } from '${prefix}lib/format';\n`;
      content = importStatement + content;
      fs.writeFileSync(file, content);
      console.log('Fixed', file);
   }
}

files.forEach(fixImports);
