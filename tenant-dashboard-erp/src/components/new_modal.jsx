      {/* Vehicle Detail Modal Deep-Dive */}
      {isCommandModalOpen && currentVehicle && (
        <div className="modal-overlay">
          <div className="command-modal-content surface-panel flex-col" style={{ display: 'flex', flexDirection: 'column' }}>
            
            {/* Modal Header */}
            <div className="command-modal-header p-xl flex-row space-between align-start" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', backgroundColor: 'rgba(0,0,0,0.2)' }}>
              <div className="flex-row gap-lg align-start">
                <div className="inspector-large-icon bg-gold-dim p-md rounded-lg">
                  <Car size={48} color="var(--color-gold)" />
                </div>
                <div className="flex-col gap-sm">
                  <h2 className="text-white m-0 flex-row align-center gap-md" style={{ fontSize: '28px' }}>
                    {currentVehicle.name} 
                    <span className={`status-badge ${currentVehicle.status.toLowerCase()}`} style={{ fontSize: '12px' }}>{currentVehicle.status}</span>
                  </h2>
                  <div className="flex-row align-center gap-md text-sm text-muted font-bold">
                    <span className="text-white">{currentVehicle.plate}</span>
                    <span>•</span>
                    <span>{currentVehicle.fleetNo}</span>
                    <span>•</span>
                    <span className="text-gold">{currentVehicle.ownership}</span>
                  </div>
                </div>
              </div>
              <div className="flex-row gap-xl align-start">
                <button className="modal-close-btn" onClick={handleCloseCommandModal}>
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Tabbed Interface */}
            <div className="flex-1 flex-col" style={{ overflow: 'hidden' }}>
              <div className="tabs-header flex-row px-xl pt-md border-bottom-subtle gap-md">
                <button className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Overview</button>
                <button className={`tab-btn ${activeTab === 'mileage' ? 'active' : ''}`} onClick={() => setActiveTab('mileage')}>Mileage Log</button>
                <button className={`tab-btn ${activeTab === 'maintenance' ? 'active' : ''}`} onClick={() => setActiveTab('maintenance')}>Maintenance Log</button>
                <button className={`tab-btn ${activeTab === 'expenses' ? 'active' : ''}`} onClick={() => setActiveTab('expenses')}>Expenses Log</button>
              </div>

              <div className="tab-content p-xl flex-1" style={{ overflowY: 'auto' }}>
                
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="flex-col gap-xl">
                    <div className="flex-row space-between align-center border-bottom-subtle pb-md">
                       <h3 className="text-white text-sm m-0 flex-row align-center gap-xs" style={{ letterSpacing: '2px' }}>
                         PRIMARY DETAILS 
                         <button onClick={() => toggleUnlock('overview')} style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: '8px' }}>
                           {unlockedSections['overview'] ? <Unlock size={14} color="var(--color-gold)" /> : <Lock size={14} color="var(--color-muted)" />}
                         </button>
                       </h3>
                    </div>
                    <div className="form-grid" style={{ gridAutoRows: 'min-content' }}>
                       <div className="form-group">
                         <label>Make</label>
                         <input type="text" className="input-field" defaultValue={currentVehicle.name.split(' ')[0]} disabled={!unlockedSections['overview']} />
                       </div>
                       <div className="form-group">
                         <label>Model</label>
                         <input type="text" className="input-field" defaultValue={currentVehicle.name.split(' ').slice(1).join(' ')} disabled={!unlockedSections['overview']} />
                       </div>
                       <div className="form-group">
                         <label>Registration Number</label>
                         <input type="text" className="input-field" defaultValue={currentVehicle.plate} disabled={!unlockedSections['overview']} />
                       </div>
                       <div className="form-group">
                         <label>VIN (Vehicle Identification Number)</label>
                         <input type="text" className="input-field" defaultValue="WDD2231232A123456" disabled={!unlockedSections['overview']} />
                       </div>
                       <div className="form-group span-2">
                         <label>Ownership Status</label>
                         <select className="input-field" defaultValue={currentVehicle.ownership} disabled={!unlockedSections['overview']} style={{ appearance: 'none' }}>
                            <option>Fleet Asset</option>
                            <option>Owner Vehicle</option>
                         </select>
                       </div>
                    </div>
                  </div>
                )}

                {/* Mileage Log Tab */}
                {activeTab === 'mileage' && (
                  <div className="flex-col gap-lg">
                     <div className="flex-row space-between align-center border-bottom-subtle pb-md">
                       <h3 className="text-white text-sm m-0 flex-row align-center gap-xs" style={{ letterSpacing: '2px' }}>
                         SHIFT MILEAGE HISTORY
                         <button onClick={() => toggleUnlock('mileage')} style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: '8px' }}>
                           {unlockedSections['mileage'] ? <Unlock size={14} color="var(--color-gold)" /> : <Lock size={14} color="var(--color-muted)" />}
                         </button>
                       </h3>
                       {unlockedSections['mileage'] && <button className="btn-primary text-xs flex-row align-center gap-xs"><Plus size={14}/> Add Entry</button>}
                     </div>
                     <div className="vehicle-log-timeline mt-md">
                        <div className="vehicle-log-entry">
                          <div className="flex-row space-between align-center mb-sm text-xs">
                            <span className="text-muted font-bold">Today, 08:30 AM</span>
                            <span className="badge-valid bg-gold-dim text-gold" style={{ border: '1px solid rgba(212,175,55,0.3)' }}>End of Shift</span>
                          </div>
                          <p className="text-white text-sm mb-md">Shift completed. 142 miles driven.</p>
                          <div className="flex-row space-between text-xs text-muted border-top-subtle pt-sm">
                            <span className="flex-row align-center gap-xs"><User size={12} color="var(--color-gold)"/> <span className="font-bold text-white">Marcus T.</span> (CH-992)</span>
                            <span className="flex-row align-center gap-xs"><Gauge size={12} color="var(--color-emerald)"/> <span className="font-bold text-white">12,450</span> mi</span>
                          </div>
                        </div>
                        <div className="vehicle-log-entry">
                          <div className="flex-row space-between align-center mb-sm text-xs">
                            <span className="text-muted font-bold">Yesterday, 18:00 PM</span>
                            <span className="badge-valid bg-gold-dim text-gold" style={{ border: '1px solid rgba(212,175,55,0.3)' }}>End of Shift</span>
                          </div>
                          <p className="text-white text-sm mb-md">Shift completed. 110 miles driven.</p>
                          <div className="flex-row space-between text-xs text-muted border-top-subtle pt-sm">
                            <span className="flex-row align-center gap-xs"><User size={12} color="var(--color-gold)"/> <span className="font-bold text-white">Sarah Jenkins</span> (CH-814)</span>
                            <span className="flex-row align-center gap-xs"><Gauge size={12} color="var(--color-emerald)"/> <span className="font-bold text-white">12,308</span> mi</span>
                          </div>
                        </div>
                     </div>
                  </div>
                )}

                {/* Maintenance Log Tab */}
                {activeTab === 'maintenance' && (
                  <div className="flex-col gap-lg">
                     <div className="flex-row space-between align-center border-bottom-subtle pb-md">
                       <h3 className="text-white text-sm m-0 flex-row align-center gap-xs" style={{ letterSpacing: '2px' }}>
                         DEFECTS & REPAIRS
                         <button onClick={() => toggleUnlock('maintenance')} style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: '8px' }}>
                           {unlockedSections['maintenance'] ? <Unlock size={14} color="var(--color-gold)" /> : <Lock size={14} color="var(--color-muted)" />}
                         </button>
                       </h3>
                       {unlockedSections['maintenance'] && <button className="btn-primary text-xs flex-row align-center gap-xs"><Plus size={14}/> Add Defect</button>}
                     </div>
                     <div className="vehicle-log-timeline mt-md">
                        <div className="vehicle-log-entry">
                          <div className="flex-row space-between align-center mb-sm text-xs">
                            <span className="text-muted font-bold">04 Jun 2026, 09:15 AM</span>
                            <span className="badge-valid bg-gold-dim text-gold" style={{ border: '1px solid rgba(212,175,55,0.3)', color: 'var(--color-red)' }}>Critical Alert</span>
                          </div>
                          <p className="text-white text-sm mb-md">Low tire pressure warning (Rear Right). Checked and inflated to 38 PSI.</p>
                          <div className="flex-row space-between text-xs text-muted border-top-subtle pt-sm">
                            <span className="flex-row align-center gap-xs"><User size={12} color="var(--color-gold)"/> <span className="font-bold text-white">Alistair B.</span> (CH-701)</span>
                            <span className="flex-row align-center gap-xs"><Wrench size={12} color="var(--color-emerald)"/> <span className="font-bold text-white">Resolved</span></span>
                          </div>
                        </div>
                     </div>
                  </div>
                )}

                {/* Expenses Log Tab */}
                {activeTab === 'expenses' && (
                  <div className="flex-col gap-lg">
                     <div className="flex-row space-between align-center border-bottom-subtle pb-md">
                       <h3 className="text-white text-sm m-0 flex-row align-center gap-xs" style={{ letterSpacing: '2px' }}>
                         FUEL & CLEANING COSTS
                         <button onClick={() => toggleUnlock('expenses')} style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: '8px' }}>
                           {unlockedSections['expenses'] ? <Unlock size={14} color="var(--color-gold)" /> : <Lock size={14} color="var(--color-muted)" />}
                         </button>
                       </h3>
                       {unlockedSections['expenses'] && <button className="btn-primary text-xs flex-row align-center gap-xs"><Plus size={14}/> Add Expense</button>}
                     </div>
                     <div className="vehicle-log-timeline mt-md">
                        <div className="vehicle-log-entry">
                          <div className="flex-row space-between align-center mb-sm text-xs">
                            <span className="text-muted font-bold">06 Jun 2026, 14:20 PM</span>
                            <span className="badge-valid bg-gold-dim text-gold" style={{ border: '1px solid rgba(212,175,55,0.3)' }}>Fuel</span>
                          </div>
                          <p className="text-white text-sm mb-md">BP Unleaded 95 - 45 Liters. Receipt attached.</p>
                          <div className="flex-row space-between text-xs text-muted border-top-subtle pt-sm">
                            <span className="flex-row align-center gap-xs"><User size={12} color="var(--color-gold)"/> <span className="font-bold text-white">Sarah Jenkins</span> (CH-814)</span>
                            <span className="flex-row align-center gap-xs"><CreditCard size={12} color="var(--color-emerald)"/> <span className="font-bold text-white">£64.50</span></span>
                          </div>
                        </div>
                        <div className="vehicle-log-entry">
                          <div className="flex-row space-between align-center mb-sm text-xs">
                            <span className="text-muted font-bold">05 Jun 2026, 08:00 AM</span>
                            <span className="badge-valid bg-gold-dim text-gold" style={{ border: '1px solid rgba(212,175,55,0.3)' }}>Cleaning</span>
                          </div>
                          <p className="text-white text-sm mb-md">Full valet and interior deep clean.</p>
                          <div className="flex-row space-between text-xs text-muted border-top-subtle pt-sm">
                            <span className="flex-row align-center gap-xs"><User size={12} color="var(--color-gold)"/> <span className="font-bold text-white">Marcus T.</span> (CH-992)</span>
                            <span className="flex-row align-center gap-xs"><CreditCard size={12} color="var(--color-emerald)"/> <span className="font-bold text-white">£25.00</span></span>
                          </div>
                        </div>
                     </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sticky Footer */}
            <div className="p-xl border-top-subtle flex-row space-between align-center" style={{ backgroundColor: 'var(--color-surface)', zIndex: 10, borderBottomLeftRadius: 'var(--border-radius-lg)', borderBottomRightRadius: 'var(--border-radius-lg)' }}>
               <div className="flex-row align-center gap-sm text-muted text-xs font-bold tracking-wider">
                 <ShieldCheck size={16} color="var(--color-gold)" />
                 VERIFIED BY VELO AI SECURITY PROTOCOL
               </div>
               <div className="flex-row gap-md">
                 {Object.values(unlockedSections).some(v => v) && (
                   <button className="btn-secondary" onClick={() => setUnlockedSections({})}>Cancel</button>
                 )}
                 <button className="btn-primary flex-row align-center gap-sm" onClick={handleUpdateVehicle} disabled={isSyncing}>
                   {isSyncing ? <span className="spinner-border text-white spinner-border-sm" role="status" aria-hidden="true" style={{ width: '1rem', height: '1rem', borderWidth: '0.15em' }}></span> : null}
                   {isSyncing ? 'SYNCING TO BACKOFFICE...' : 'UPDATE & LOCK VEHICLE'}
                 </button>
               </div>
            </div>
            
          </div>
        </div>
      )}
