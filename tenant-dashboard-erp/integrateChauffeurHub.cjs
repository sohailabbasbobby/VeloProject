const fs = require('fs');

let c = fs.readFileSync('src/components/CommandCenter.jsx', 'utf8');

// 1. Add import
c = c.replace("import FleetVault from './FleetVault';", "import FleetVault from './FleetVault';\nimport ChauffeurHub from './ChauffeurHub';");

// 2. Change activeSubView logic for operations Hub
c = c.replace("{activeSubView !== 'fleet' && (", "{activeSubView === 'operations' && (");

// 3. Add ChauffeurHub
const newBlock = `{activeSubView === 'fleet' && (
        <FleetVault />
      )}

      {activeSubView === 'chauffeurs' && (
        <ChauffeurHub />
      )}`;

c = c.replace(/\{activeSubView === 'fleet' && \(\n\s*<FleetVault \/>\n\s*\}\)/, newBlock);

fs.writeFileSync('src/components/CommandCenter.jsx', c);
