const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, '..', 'node_modules', '@supabase', 'auth-helpers-nextjs', 'tsconfig');
const outFile = path.join(outDir, 'base.json');
const content = JSON.stringify({
  compilerOptions: {
    target: 'ES2017',
    lib: ['esnext', 'dom'],
    module: 'esnext',
    moduleResolution: 'bundler',
    resolveJsonModule: true,
    jsx: 'react-jsx',
    allowJs: true,
    skipLibCheck: true
  }
}, null, 2);

try {
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outFile, content, 'utf8');
  console.log('Wrote', outFile);
} catch (e) {
  console.error('Failed to write supabase tsconfig base.json', e);
  process.exit(1);
}
