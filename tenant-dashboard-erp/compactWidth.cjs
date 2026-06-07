const fs = require('fs');

// 1. Update FleetVault.css
let css = fs.readFileSync('src/components/FleetVault.css', 'utf8');
css = css.replace(/max-width: 1200px;/, 'max-width: 800px;\n  margin: 0 auto;');
fs.writeFileSync('src/components/FleetVault.css', css);

// 2. Update FleetVault.jsx
let jsx = fs.readFileSync('src/components/FleetVault.jsx', 'utf8');

// Change padding to exactly 24px
jsx = jsx.replace('className="tab-content p-xl flex-1" style={{ overflowY: \'auto\' }}', 'className="tab-content flex-1" style={{ overflowY: \'auto\', padding: \'24px\' }}');
jsx = jsx.replace('className="p-xl border-top-subtle flex-row space-between align-center"', 'className="border-top-subtle flex-row space-between align-center"');
jsx = jsx.replace(/backgroundColor: 'var\(--color-surface\)', zIndex: 10/, 'padding: \'24px\', backgroundColor: \'var(--color-surface)\', zIndex: 10');

// Convert form-grid to single column flex-col
jsx = jsx.replace(/className="form-grid" style=\{\{ gridAutoRows: 'min-content' \}\}/g, 'className="flex-col gap-sm"');

// Remove span-2 from ownership status
jsx = jsx.replace(/className="form-group span-2"/g, 'className="form-group"');

fs.writeFileSync('src/components/FleetVault.jsx', jsx);
