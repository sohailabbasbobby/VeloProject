const fs = require('fs');

const replaceInFile = (file, regex, replacement) => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(regex, replacement);
  fs.writeFileSync(file, content);
};

// 1. FleetVault.jsx
let fv = fs.readFileSync('src/components/FleetVault.jsx', 'utf8');
fv = fv.replace(/const fleet = \[[\s\S]*?\];\n/, 'const fleet = MOCK_VEHICLES.map(v => ({\n  id: v.id,\n  name: `${v.make} ${v.model}`,\n  plate: v.registration,\n  image: "https://images.unsplash.com/photo-1631477091219-c4fb5ebda941?w=400&q=80",\n  class: "VIP Sedan",\n  status: v.status === "Active" ? "Deployed" : v.status,\n  color: "Onyx Black",\n  fleetNo: v.id,\n  ownership: "Fleet Vehicle",\n  mileage: v.mileage.toLocaleString(),\n  mileageUpdated: "Today",\n  earliestExpiry: { item: "MOT", days: 30 },\n  fuelLevel: 80,\n  serviceTarget: 90,\n  cleanliness: "Excellent",\n  operationalLogs: v.faults,\n  compliance: {\n    mot: { issue: "14 Oct 2025", expiry: v.motExpiry, valid: v.complianceStatus === "VERIFIED" },\n    roadTax: { issue: "01 Jan 2026", expiry: "31 Dec 2026", valid: true },\n    taxiCompliance: { issue: "02 May 2024", expiry: "02 May 2025", valid: true },\n    insurance: { type: "Fleet", issue: "28 Dec 2024", expiry: v.insuranceExpiry, valid: true }\n  }\n}));\n');
fv = fv.replace("import './FleetVault.css';", "import './FleetVault.css';\nimport { MOCK_VEHICLES } from '../data/mockDatabase';");
fs.writeFileSync('src/components/FleetVault.jsx', fv);

// 2. ChauffeurHub.jsx
let ch = fs.readFileSync('src/components/ChauffeurHub.jsx', 'utf8');
ch = ch.replace(/const MOCK_CHAUFFEURS = \[[\s\S]*?\];\n/, '');
ch = ch.replace("import './ChauffeurHub.css';", "import './ChauffeurHub.css';\nimport { MOCK_CHAUFFEURS } from '../data/mockDatabase';");
fs.writeFileSync('src/components/ChauffeurHub.jsx', ch);

// 3. CorporateClientHub.jsx
let cc = fs.readFileSync('src/components/CorporateClientHub.jsx', 'utf8');
cc = cc.replace(/const MOCK_CLIENTS = \[[\s\S]*?\];\n/, '');
cc = cc.replace("import './CorporateClientHub.css';", "import './CorporateClientHub.css';\nimport { MOCK_CORP_CLIENTS as MOCK_CLIENTS } from '../data/mockDatabase';");
fs.writeFileSync('src/components/CorporateClientHub.jsx', cc);

// 4. PrivateClientRegistry.jsx
let pc = fs.readFileSync('src/components/PrivateClientRegistry.jsx', 'utf8');
pc = pc.replace(/const MOCK_CLIENTS = \[[\s\S]*?\];\n/, '');
pc = pc.replace("import './PrivateClientRegistry.css';", "import './PrivateClientRegistry.css';\nimport { MOCK_PRIV_CLIENTS as MOCK_CLIENTS } from '../data/mockDatabase';");
fs.writeFileSync('src/components/PrivateClientRegistry.jsx', pc);

// 5. CommandCenter.jsx
let cmd = fs.readFileSync('src/components/CommandCenter.jsx', 'utf8');
cmd = cmd.replace(/const activeTasks = \[[\s\S]*?\];\n/, '');
cmd = cmd.replace("import './CommandCenter.css';", "import './CommandCenter.css';\nimport { MOCK_ACTIVE_TASKS as activeTasks, MOCK_LEDGER } from '../data/mockDatabase';");
// Also inject MOCK_LEDGER into Operations Hub. The operations hub currently renders activeTasks mapping. We will just leave it rendering activeTasks but it's now coming from DB.
fs.writeFileSync('src/components/CommandCenter.jsx', cmd);

console.log('Successfully injected mock DB');
