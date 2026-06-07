const fs = require('fs');

// 1. Update FleetVault.css
let css = fs.readFileSync('src/components/FleetVault.css', 'utf8');
css = css.replace(/height: 85vh;/, 'max-height: 75vh;\n  height: auto;');
css = css.replace(/\.form-group label \{\n  font-size: 13px;/, '.form-group label {\n  font-size: 11px;');
css = css.replace(/\.input-field \{\n  padding: 8px 12px;\n  background-color: rgba\(0,0,0,0\.2\);\n  border: 1px solid rgba\(255,255,255,0\.1\);/, '.input-field {\n  padding: 6px 10px;\n  background-color: rgba(0,0,0,0.4);\n  border: 1px solid rgba(255,255,255,0.05);');
fs.writeFileSync('src/components/FleetVault.css', css);

// 2. Update FleetVault.jsx
let jsx = fs.readFileSync('src/components/FleetVault.jsx', 'utf8');

// Change header padding
jsx = jsx.replace('className="command-modal-header p-xl', 'className="command-modal-header p-md');

// Reduce gaps in overview
jsx = jsx.replace('className="flex-col gap-xl"', 'className="flex-col gap-sm"');
jsx = jsx.replace(/className="flex-col gap-md">/g, 'className="flex-col gap-sm">');
jsx = jsx.replace(/pb-md mb-md/g, 'pb-sm mb-sm');
jsx = jsx.replace(/pb-md mb-md mt-md/g, 'pb-sm mb-sm mt-sm');

// Rewrite compliance cards
const oldCardsRegex = /<div className="flex-col gap-md">\s*\{\/\* MOT \*\/\}[\s\S]*?(?=\n\s*<\/div>\n\s*<\/div>\n\s*<\/div>\n\s*\}\))/;

const newCards = `<div className="flex-col gap-xs">
                        {/* MOT */}
                        <div className="flex-row space-between align-center p-sm rounded" style={{ backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <span className="text-white font-bold text-xs" style={{ width: '120px' }}>MOT Cert.</span>
                          <div className="flex-row gap-sm" style={{ flex: 1 }}>
                            <input type="date" className="input-field text-xs" defaultValue="2026-01-15" disabled={!unlockedSections['overview_c']} style={{ colorScheme: 'dark', width: '110px' }} />
                            <input type="date" className="input-field text-xs" defaultValue="2027-01-15" disabled={!unlockedSections['overview_c']} style={{ colorScheme: 'dark', width: '110px' }} />
                          </div>
                          <div className="flex-row gap-xs">
                            <button className="btn-secondary text-xs p-xs" disabled={!unlockedSections['overview_c']}><FileText size={12}/></button>
                            <button className="btn-primary text-xs p-xs" disabled={!unlockedSections['overview_c']}><Upload size={12}/></button>
                          </div>
                        </div>

                        {/* PCO */}
                        <div className="flex-row space-between align-center p-sm rounded" style={{ backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <span className="text-white font-bold text-xs" style={{ width: '120px' }}>PCO License</span>
                          <div className="flex-row gap-sm" style={{ flex: 1 }}>
                            <input type="date" className="input-field text-xs" defaultValue="2026-02-10" disabled={!unlockedSections['overview_c']} style={{ colorScheme: 'dark', width: '110px' }} />
                            <input type="date" className="input-field text-xs" defaultValue="2027-02-10" disabled={!unlockedSections['overview_c']} style={{ colorScheme: 'dark', width: '110px' }} />
                          </div>
                          <div className="flex-row gap-xs">
                            <button className="btn-secondary text-xs p-xs" disabled={!unlockedSections['overview_c']}><FileText size={12}/></button>
                            <button className="btn-primary text-xs p-xs" disabled={!unlockedSections['overview_c']}><Upload size={12}/></button>
                          </div>
                        </div>

                        {/* Insurance */}
                        <div className="flex-row space-between align-center p-sm rounded" style={{ backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <span className="text-white font-bold text-xs" style={{ width: '120px' }}>Insurance Policy</span>
                          <div className="flex-row gap-sm" style={{ flex: 1 }}>
                            <input type="date" className="input-field text-xs" defaultValue="2026-03-01" disabled={!unlockedSections['overview_c']} style={{ colorScheme: 'dark', width: '110px' }} />
                            <input type="date" className="input-field text-xs" defaultValue="2027-03-01" disabled={!unlockedSections['overview_c']} style={{ colorScheme: 'dark', width: '110px' }} />
                          </div>
                          <div className="flex-row gap-xs">
                            <button className="btn-secondary text-xs p-xs" disabled={!unlockedSections['overview_c']}><FileText size={12}/></button>
                            <button className="btn-primary text-xs p-xs" disabled={!unlockedSections['overview_c']}><Upload size={12}/></button>
                          </div>
                        </div>
                      </div>`;

jsx = jsx.replace(oldCardsRegex, newCards);

fs.writeFileSync('src/components/FleetVault.jsx', jsx);
