import fs from 'fs';

const files = [
  'src/pages/Dashboard.tsx',
  'src/components/production/ProductionBatchDrawer.tsx',
  'src/components/ui/Button.tsx',
  'src/components/ui/EmptyState.tsx',
  'src/components/sales/NewSaleDrawer.tsx',
  'src/components/finance/ExpenseDrawer.tsx',
  'src/components/consignments/SettlementDrawer.tsx',
  'src/components/layout/Shell.tsx',
  'src/components/ui/MetricCard.tsx'
];

files.forEach(file => {
   if (fs.existsSync(file)) {
      let content = fs.readFileSync(file, 'utf8');
      if (content.includes('rgba(245,158,11,')) {
         content = content.replace(/rgba\(245,158,11,/g, 'rgba(197,152,104,');
         fs.writeFileSync(file, content);
         console.log('Fixed', file);
      }
   }
});
