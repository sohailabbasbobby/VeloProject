const fs = require('fs');
let c = fs.readFileSync('src/components/FleetVault.jsx', 'utf8');

const replacement = `                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="flex-col gap-xl">
                    {/* SECTION A: Vehicle Identity & Ownership */}
                    <div>
                      <div className="flex-row space-between align-center border-bottom-subtle pb-md mb-md">
                         <h3 className="text-white text-sm m-0 flex-row align-center gap-xs" style={{ letterSpacing: '2px' }}>
                           VEHICLE IDENTITY & OWNERSHIP 
                           <button onClick={() => toggleUnlock('overview_a')} style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: '8px' }}>
                             {unlockedSections['overview_a'] ? <Unlock size={14} color="var(--color-gold)" /> : <Lock size={14} color="var(--color-muted)" />}
                           </button>
                         </h3>
                      </div>
                      <div className="form-grid" style={{ gridAutoRows: 'min-content' }}>
                         <div className="form-group">
                           <label>Make</label>
                           <input type="text" className="input-field" defaultValue={currentVehicle.name.split(' ')[0]} disabled={!unlockedSections['overview_a']} />
                         </div>
                         <div className="form-group">
                           <label>Model</label>
                           <input type="text" className="input-field" defaultValue={currentVehicle.name.split(' ').slice(1).join(' ')} disabled={!unlockedSections['overview_a']} />
                         </div>
                         <div className="form-group">
                           <label>Registration Number</label>
                           <input type="text" className="input-field" defaultValue={currentVehicle.plate} disabled={!unlockedSections['overview_a']} />
                         </div>
                         <div className="form-group">
                           <label>VIN (Vehicle Identification Number)</label>
                           <input type="text" className="input-field" defaultValue="WDD2231232A123456" disabled={!unlockedSections['overview_a']} />
                         </div>
                         <div className="form-group span-2">
                           <label>Ownership Status</label>
                           <select className="input-field" defaultValue={currentVehicle.ownership} disabled={!unlockedSections['overview_a']} style={{ appearance: 'none' }}>
                              <option>Fleet Asset</option>
                              <option>Owner Vehicle</option>
                           </select>
                         </div>
                      </div>
                    </div>

                    {/* SECTION B: Specifications */}
                    <div>
                      <div className="flex-row space-between align-center border-bottom-subtle pb-md mb-md mt-md">
                         <h3 className="text-white text-sm m-0 flex-row align-center gap-xs" style={{ letterSpacing: '2px' }}>
                           SPECIFICATIONS 
                           <button onClick={() => toggleUnlock('overview_b')} style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: '8px' }}>
                             {unlockedSections['overview_b'] ? <Unlock size={14} color="var(--color-gold)" /> : <Lock size={14} color="var(--color-muted)" />}
                           </button>
                         </h3>
                      </div>
                      <div className="form-grid" style={{ gridAutoRows: 'min-content' }}>
                         <div className="form-group">
                           <label>Initial Mileage</label>
                           <input type="number" className="input-field" defaultValue={12450} disabled={!unlockedSections['overview_b']} />
                         </div>
                         <div className="form-group">
                           <label>Exterior Color</label>
                           <input type="text" className="input-field" defaultValue="Obsidian Black" disabled={!unlockedSections['overview_b']} />
                         </div>
                         <div className="form-group">
                           <label>Passenger Capacity</label>
                           <div className="flex-row align-center gap-sm">
                             <input type="number" className="input-field text-center" defaultValue={4} disabled={!unlockedSections['overview_b']} />
                           </div>
                         </div>
                         <div className="form-group">
                           <label>Luggage Capacity</label>
                           <div className="flex-row align-center gap-sm">
                             <input type="number" className="input-field text-center" defaultValue={3} disabled={!unlockedSections['overview_b']} />
                           </div>
                         </div>
                      </div>
                    </div>

                    {/* SECTION C: Compliance & Documentation */}
                    <div>
                      <div className="flex-row space-between align-center border-bottom-subtle pb-md mb-md mt-md">
                         <h3 className="text-white text-sm m-0 flex-row align-center gap-xs" style={{ letterSpacing: '2px' }}>
                           COMPLIANCE & DOCUMENTATION 
                           <button onClick={() => toggleUnlock('overview_c')} style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: '8px' }}>
                             {unlockedSections['overview_c'] ? <Unlock size={14} color="var(--color-gold)" /> : <Lock size={14} color="var(--color-muted)" />}
                           </button>
                         </h3>
                      </div>
                      <div className="flex-col gap-md">
                        {/* MOT */}
                        <div className="compliance-card flex-row space-between align-center p-md" style={{ backgroundColor: 'var(--color-obsidian)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 'var(--border-radius-md)' }}>
                          <div className="flex-row align-center gap-md" style={{ flex: 1 }}>
                            <Award size={18} color="var(--color-gold)"/>
                            <span className="text-white font-bold" style={{ width: '180px' }}>MOT Certification</span>
                            <div className="flex-row gap-sm" style={{ flex: 1 }}>
                              <div className="form-group" style={{ flex: 1, margin: 0 }}>
                                <label style={{ fontSize: '10px' }}>ISSUED</label>
                                <input type="date" className="input-field p-sm text-sm" defaultValue="2026-01-15" disabled={!unlockedSections['overview_c']} style={{ colorScheme: 'dark' }} />
                              </div>
                              <div className="form-group" style={{ flex: 1, margin: 0 }}>
                                <label style={{ fontSize: '10px' }}>EXPIRY</label>
                                <input type="date" className="input-field p-sm text-sm" defaultValue="2027-01-15" disabled={!unlockedSections['overview_c']} style={{ colorScheme: 'dark' }} />
                              </div>
                            </div>
                          </div>
                          <div className="flex-row align-center gap-sm ml-xl">
                            <button className="btn-secondary text-xs flex-row align-center gap-xs" disabled={!unlockedSections['overview_c']}><FileText size={14}/> VIEW</button>
                            <button className="btn-primary text-xs flex-row align-center gap-xs" disabled={!unlockedSections['overview_c']}><Upload size={14}/> UPDATE</button>
                          </div>
                        </div>

                        {/* PCO */}
                        <div className="compliance-card flex-row space-between align-center p-md" style={{ backgroundColor: 'var(--color-obsidian)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 'var(--border-radius-md)' }}>
                          <div className="flex-row align-center gap-md" style={{ flex: 1 }}>
                            <ShieldCheck size={18} color="var(--color-gold)"/>
                            <span className="text-white font-bold" style={{ width: '180px' }}>PCO License</span>
                            <div className="flex-row gap-sm" style={{ flex: 1 }}>
                              <div className="form-group" style={{ flex: 1, margin: 0 }}>
                                <label style={{ fontSize: '10px' }}>ISSUED</label>
                                <input type="date" className="input-field p-sm text-sm" defaultValue="2026-02-10" disabled={!unlockedSections['overview_c']} style={{ colorScheme: 'dark' }} />
                              </div>
                              <div className="form-group" style={{ flex: 1, margin: 0 }}>
                                <label style={{ fontSize: '10px' }}>EXPIRY</label>
                                <input type="date" className="input-field p-sm text-sm" defaultValue="2027-02-10" disabled={!unlockedSections['overview_c']} style={{ colorScheme: 'dark' }} />
                              </div>
                            </div>
                          </div>
                          <div className="flex-row align-center gap-sm ml-xl">
                            <button className="btn-secondary text-xs flex-row align-center gap-xs" disabled={!unlockedSections['overview_c']}><FileText size={14}/> VIEW</button>
                            <button className="btn-primary text-xs flex-row align-center gap-xs" disabled={!unlockedSections['overview_c']}><Upload size={14}/> UPDATE</button>
                          </div>
                        </div>

                        {/* Insurance */}
                        <div className="compliance-card flex-row space-between align-center p-md" style={{ backgroundColor: 'var(--color-obsidian)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 'var(--border-radius-md)' }}>
                          <div className="flex-row align-center gap-md" style={{ flex: 1 }}>
                            <Shield size={18} color="var(--color-gold)"/>
                            <span className="text-white font-bold" style={{ width: '180px' }}>Insurance Policy</span>
                            <div className="flex-row gap-sm" style={{ flex: 1 }}>
                              <div className="form-group" style={{ flex: 1, margin: 0 }}>
                                <label style={{ fontSize: '10px' }}>ISSUED</label>
                                <input type="date" className="input-field p-sm text-sm" defaultValue="2026-03-01" disabled={!unlockedSections['overview_c']} style={{ colorScheme: 'dark' }} />
                              </div>
                              <div className="form-group" style={{ flex: 1, margin: 0 }}>
                                <label style={{ fontSize: '10px' }}>EXPIRY</label>
                                <input type="date" className="input-field p-sm text-sm" defaultValue="2027-03-01" disabled={!unlockedSections['overview_c']} style={{ colorScheme: 'dark' }} />
                              </div>
                            </div>
                          </div>
                          <div className="flex-row align-center gap-sm ml-xl">
                            <button className="btn-secondary text-xs flex-row align-center gap-xs" disabled={!unlockedSections['overview_c']}><FileText size={14}/> VIEW</button>
                            <button className="btn-primary text-xs flex-row align-center gap-xs" disabled={!unlockedSections['overview_c']}><Upload size={14}/> UPDATE</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}`;

c = c.replace(/\{\/\* Overview Tab \*\/\}[\s\S]*?(?=\n                \{\/\* Mileage Log Tab \*\/)/, replacement);
fs.writeFileSync('src/components/FleetVault.jsx', c);
