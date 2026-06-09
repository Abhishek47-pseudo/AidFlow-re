import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { MapContainer } from './MapContainer';

export const VolunteerDashboard = ({ subView = 'map', setActiveTab }) => {
  const { logout, user } = useAuth();
  
  // Tab selector state
  const activeTab = subView;
  
  // Data States
  const [donations, setDonations] = useState([]);
  const [activeDispatches, setActiveDispatches] = useState([]);
  
  // Selected Dispatch for map focus
  const [selectedDispatch, setSelectedDispatch] = useState(null);
  
  // Search query overlay
  const [searchQuery, setSearchQuery] = useState('');

  // Donation form modal state
  const [showDonateForm, setShowDonateForm] = useState(false);
  const [donationForm, setDonationForm] = useState({
    itemName: '', category: 'Food', quantity: 10, location: 'Central Punjab Hub'
  });

  const [loading, setLoading] = useState(true);

  // Load Volunteer Telemetry Data
  const loadVolunteerData = useCallback(async () => {
    try {
      const [donRes, dispRes] = await Promise.all([
        axios.get('/api/volunteer/donations'),
        axios.get('/api/emergency/active-dispatches')
      ]);
      setDonations(donRes.data || []);
      setActiveDispatches(dispRes.data?.dispatches || []);
    } catch (error) {
      console.error('Failed to load volunteer dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVolunteerData();
    const interval = setInterval(loadVolunteerData, 12000);
    return () => clearInterval(interval);
  }, [loadVolunteerData]);

  // Submit donation log
  const handleDonateSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/volunteer/donate', donationForm);
      setShowDonateForm(false);
      setDonationForm({
        itemName: '', category: 'Food', quantity: 10, location: 'Central Punjab Hub'
      });
      loadVolunteerData();
      setActiveTab('inventory'); // Switch to logged donations list tab to show success
    } catch (error) {
      console.error('Donation log failed:', error);
    }
  };

  // Map markers mapping for MapContainer
  const mapEmergencies = activeDispatches.map(disp => ({
    ...disp,
    // Add extra indicators for volunteer view
    label: disp.response?.routing?.unitId || 'Active Dispatch'
  }));

  // Filtering dispatch lists based on search bar queries
  const filteredDispatches = activeDispatches.filter(disp => 
    disp.emergencyId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    disp.userMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="text-on-surface font-body-md flex flex-col overflow-x-hidden w-full">
      {/* Main Canvas */}
      <main className="pt-4 flex-grow flex flex-col relative">
        
        {/* TAB 1: Live Disaster Map (Fullscreen Map view with Floating UI HUDs) */}
        {activeTab === 'map' && (
          <div className="relative w-full h-[calc(100vh-128px)]">
            {/* Fullscreen Map background */}
            <div className="absolute inset-0 z-0">
              <MapContainer 
                emergencies={mapEmergencies}
                selectedLocation={selectedDispatch?.location}
                activeRoute={selectedDispatch?.response?.routing}
                onMarkerClick={(emg) => setSelectedDispatch(emg)}
              />
            </div>

            {/* Search Bar Overlay */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[calc(100%-32px)] md:w-full md:max-w-xl z-[1000] px-4">
              <div className="card flex items-center px-4 py-2.5 rounded-xl border border-outline-variant">
                <span className="material-symbols-outlined text-outline mr-3">search</span>
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none text-on-surface focus:ring-0 w-full placeholder:text-outline-variant text-sm" 
                  placeholder="Search active incident IDs or sectors..." 
                />
                <span className="material-symbols-outlined text-outline ml-3">filter_list</span>
              </div>
            </div>

            {/* Floating Info Stats Panel (Bottom-Left sheet) */}
            <div className="absolute bottom-4 left-4 right-4 md:left-margin-desktop md:right-auto md:w-96 z-[1000]">
              <div className="card rounded-xl p-4 border border-outline-variant space-y-4">
                <div className="flex justify-between items-center border-b border-outline-variant pb-2">
                  <h3 className="text-label-caps font-label-caps text-on-surface-variant">AT A GLANCE STATUS</h3>
                  <span className="text-data-mono font-data-mono text-error animate-pulse">● LIVE</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-surface-container-low p-3 rounded border border-outline-variant text-center">
                    <p className="text-[10px] text-outline font-label-caps uppercase">ACTIVE</p>
                    <p className="text-headline-md font-bold text-primary text-xl">{activeDispatches.length}</p>
                  </div>
                  <div className="bg-surface-container-low p-3 rounded border border-outline-variant text-center">
                    <p className="text-[10px] text-outline font-label-caps uppercase">UNITS</p>
                    <p className="text-headline-md font-bold text-secondary text-xl">48</p>
                  </div>
                  <div className="bg-surface-container-low p-3 rounded border border-outline-variant text-center">
                    <p className="text-[10px] text-outline font-label-caps uppercase">CRIT</p>
                    <p className="text-headline-md font-bold text-error text-xl">
                      {activeDispatches.filter(d => d.aiAnalysis?.severity === 'critical').length}
                    </p>
                  </div>
                </div>
                {selectedDispatch ? (
                  <div className="p-3 bg-secondary/5 border-l-4 border-secondary rounded text-xs space-y-1">
                    <p className="font-bold text-secondary uppercase">SELECTED DISPATCH TASK</p>
                    <p className="text-on-surface font-medium truncate">"{selectedDispatch.userMessage}"</p>
                    <p className="text-on-surface-variant text-[10px] font-mono">
                      UNIT: {selectedDispatch.response?.routing?.unitId || 'UNIT-1'} | ETA: {selectedDispatch.response?.routing?.eta || '12 mins'}
                    </p>
                  </div>
                ) : (
                  <div className="p-3 bg-error-container/20 border-l-4 border-error rounded text-xs">
                    <p className="text-label-caps font-label-caps text-error font-bold">CRITICAL ZONE ALERT</p>
                    <p className="text-on-surface-variant text-[10px] font-mono mt-0.5">Evacuations recommended in North Docks</p>
                  </div>
                )}
                <button 
                  onClick={() => setActiveTab('dashboard')}
                  className="w-full bg-surface-container-high py-2 rounded text-label-caps font-label-caps hover:bg-surface-variant transition-colors flex items-center justify-center gap-2 text-[10px]"
                >
                  EXPAND DEPLOYMENT LIST <span className="material-symbols-outlined text-sm">keyboard_arrow_up</span>
                </button>
              </div>
            </div>

            {/* Quick Report FAB (Launches Donation modal) */}
            <button 
              onClick={() => setShowDonateForm(true)}
              className="fixed bottom-24 right-4 md:right-8 z-[1000] bg-primary-container text-on-primary-container px-5 py-4 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2 font-bold text-sm"
            >
              <span className="material-symbols-outlined">emergency</span>
              QUICK DONATION LOG
            </button>
          </div>
        )}

        {/* TAB 2: Report (Inline Donation logging) */}
        {activeTab === 'report' && (
          <div className="max-w-md mx-auto py-8 px-4 w-full">
            <div className="card p-6 rounded-xl border border-outline-variant space-y-4">
              <div className="border-b border-outline-variant pb-2">
                <h3 className="text-headline-md font-bold text-primary flex items-center gap-2">
                  <span className="material-symbols-outlined text-2xl">volunteer_activism</span>
                  Log Relief Donation
                </h3>
                <p className="text-on-surface-variant text-xs mt-1">Register donation item details to drop off at relief centers.</p>
              </div>
              <form onSubmit={handleDonateSubmit} className="space-y-4">
                <div>
                  <label className="text-label-caps font-label-caps opacity-80 block mb-1">Item Description</label>
                  <input 
                    type="text" 
                    className="w-full bg-surface border border-outline-variant rounded-lg p-2.5 text-sm focus:ring-1 focus:ring-primary outline-none" 
                    value={donationForm.itemName} 
                    onChange={e => setDonationForm({...donationForm, itemName: e.target.value})} 
                    placeholder="e.g. Rice bags, Blankets, Medical kits" 
                    required 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-label-caps font-label-caps opacity-80 block mb-1">Category</label>
                    <select 
                      className="w-full bg-surface border border-outline-variant rounded-lg p-2.5 text-sm focus:ring-1 focus:ring-primary outline-none text-on-surface" 
                      value={donationForm.category} 
                      onChange={e => setDonationForm({...donationForm, category: e.target.value})}
                    >
                      <option value="Food">Food</option>
                      <option value="Water">Water</option>
                      <option value="Medical">Medical</option>
                      <option value="Shelter">Shelter</option>
                      <option value="Equipment">Equipment</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-label-caps font-label-caps opacity-80 block mb-1">Quantity</label>
                    <input 
                      type="number" 
                      className="w-full bg-surface border border-outline-variant rounded-lg p-2.5 text-sm focus:ring-1 focus:ring-primary outline-none" 
                      value={donationForm.quantity} 
                      onChange={e => setDonationForm({...donationForm, quantity: parseInt(e.target.value) || 0})} 
                      required 
                    />
                  </div>
                </div>

                <div>
                  <label className="text-label-caps font-label-caps opacity-80 block mb-1">Drop-off Center Hub</label>
                  <input 
                    type="text" 
                    className="w-full bg-surface border border-outline-variant rounded-lg p-2.5 text-sm focus:ring-1 focus:ring-primary outline-none" 
                    value={donationForm.location} 
                    onChange={e => setDonationForm({...donationForm, location: e.target.value})} 
                    placeholder="e.g. Ludhiana Storage" 
                    required 
                  />
                </div>

                <button type="submit" className="w-full py-4 bg-primary text-on-primary font-bold rounded-lg active:scale-95 transition-all text-sm uppercase tracking-wider">
                  Submit Log
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 3: Dashboard (Active Dispatch Deployments) */}
        {activeTab === 'dashboard' && (
          <div className="max-w-4xl mx-auto py-6 px-4 w-full space-y-6">
            <div>
              <h2 className="text-headline-lg font-headline-lg text-primary">Active Dispatch Operations</h2>
              <p className="text-on-surface-variant">Real-time status of en-route vehicles and tactical rescue routes.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {filteredDispatches.map(disp => {
                const isSelected = selectedDispatch?.emergencyId === disp.emergencyId;
                return (
                  <div 
                    key={disp.emergencyId}
                    onClick={() => { setSelectedDispatch(disp); setActiveTab('map'); }}
                    className={`card p-4 rounded-xl border cursor-pointer hover:border-primary/50 transition-all ${
                      isSelected ? 'border-primary ring-1 ring-primary' : 'border-outline-variant'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-data-mono font-data-mono text-xs text-primary">{disp.response?.routing?.unitId || 'UNIT-1'}</span>
                      <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-green-500/10 text-green-400 border border-green-500/20 uppercase">
                        {disp.status}
                      </span>
                    </div>
                    <h4 className="font-bold text-on-surface line-clamp-1 mb-1">
                      {disp.aiAnalysis?.disaster?.type?.toUpperCase() || 'RESCUE'}
                    </h4>
                    <p className="text-xs text-on-surface-variant line-clamp-2 mb-3">
                      "{disp.userMessage}"
                    </p>
                    <div className="flex justify-between items-center text-[10px] text-on-surface-variant font-mono">
                      <span>ETA: {disp.response?.routing?.eta || '12 mins'}</span>
                      <span>ID: {disp.emergencyId.substring(0,8)}</span>
                    </div>
                  </div>
                );
              })}

              {filteredDispatches.length === 0 && (
                <div className="col-span-1 md:col-span-3 p-12 text-center text-on-surface-variant bg-slate-900/20 rounded-xl border border-outline-variant">
                  No active dispatches en-route at this time.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: Inventory (Logged Donations) */}
        {activeTab === 'inventory' && (
          <div className="max-w-4xl mx-auto py-6 px-4 w-full space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-headline-lg font-headline-lg text-primary">My Logged Donations</h2>
                <p className="text-on-surface-variant">Track donation drop-off verification approvals.</p>
              </div>
              <button 
                onClick={() => setActiveTab('report')}
                className="bg-primary text-on-primary font-bold px-4 py-2.5 rounded-xl text-xs uppercase"
              >
                LOG NEW DONATION
              </button>
            </div>

            <div className="border border-outline-variant bg-surface-container rounded-xl overflow-hidden">
              <div className="divide-y divide-outline-variant">
                {donations.map(don => (
                  <div key={don._id} className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-slate-900/30 transition-colors">
                    <div>
                      <h4 className="font-bold text-on-surface text-base">{don.itemName}</h4>
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        Category: {don.category} | Quantity: <strong>{don.quantity}</strong> | Location: {don.location}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                      <div className="text-right">
                        <span className="text-[10px] text-on-surface-variant block uppercase">VERIFICATION</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                          don.status === 'approved' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                          don.status === 'rejected' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                          'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                        }`}>
                          {don.status?.toUpperCase()}
                        </span>
                      </div>
                      <span className="text-data-mono font-data-mono text-xs text-on-surface-variant">
                        Logged on: {new Date(don.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}

                {donations.length === 0 && (
                  <div className="p-12 text-center text-on-surface-variant">
                    No donation logs reported by your account.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Log Donation Overlay Modal */}
      {showDonateForm && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card p-6 rounded-xl border border-outline-variant max-w-md w-full bg-slate-900 text-on-surface space-y-4 mx-4">
            <div className="flex justify-between items-center border-b border-outline-variant pb-2">
              <h3 className="text-headline-md font-bold text-primary">Log Relief Donation</h3>
              <button onClick={() => setShowDonateForm(false)} className="text-on-surface-variant hover:text-primary">✕</button>
            </div>
            <form onSubmit={handleDonateSubmit} className="space-y-4">
              <div>
                <label className="text-label-caps font-label-caps opacity-80 block mb-1">Item Description</label>
                <input 
                  type="text" 
                  className="w-full bg-surface border border-outline-variant rounded-lg p-2 text-sm focus:ring-1 focus:ring-primary outline-none" 
                  value={donationForm.itemName} 
                  onChange={e => setDonationForm({...donationForm, itemName: e.target.value})} 
                  placeholder="e.g. Rice bags, Blankets, Painkillers" 
                  required 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-label-caps font-label-caps opacity-80 block mb-1">Category</label>
                  <select 
                    className="w-full bg-surface border border-outline-variant rounded-lg p-2 text-sm focus:ring-1 focus:ring-primary outline-none text-on-surface" 
                    value={donationForm.category} 
                    onChange={e => setDonationForm({...donationForm, category: e.target.value})}
                  >
                    <option value="Food">Food</option>
                    <option value="Water">Water</option>
                    <option value="Medical">Medical</option>
                    <option value="Shelter">Shelter</option>
                    <option value="Equipment">Equipment</option>
                  </select>
                </div>
                <div>
                  <label className="text-label-caps font-label-caps opacity-80 block mb-1">Quantity</label>
                  <input 
                    type="number" 
                    className="w-full bg-surface border border-outline-variant rounded-lg p-2 text-sm focus:ring-1 focus:ring-primary outline-none" 
                    value={donationForm.quantity} 
                    onChange={e => setDonationForm({...donationForm, quantity: parseInt(e.target.value) || 0})} 
                    required 
                  />
                </div>
              </div>

              <div>
                <label className="text-label-caps font-label-caps opacity-80 block mb-1">Drop-off Hub Location</label>
                <input 
                  type="text" 
                  className="w-full bg-surface border border-outline-variant rounded-lg p-2 text-sm focus:ring-1 focus:ring-primary outline-none" 
                  value={donationForm.location} 
                  onChange={e => setDonationForm({...donationForm, location: e.target.value})} 
                  placeholder="e.g. Ludhiana Storage" 
                  required 
                />
              </div>

              <div className="flex gap-4 pt-2">
                <button type="submit" className="flex-1 py-3 bg-primary text-on-primary font-bold rounded-lg active:scale-95 transition-transform text-sm uppercase tracking-wider">
                  Submit Log
                </button>
                <button type="button" onClick={() => setShowDonateForm(false)} className="flex-1 py-3 border border-outline-variant text-on-surface font-bold rounded-lg active:scale-95 transition-transform text-sm">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
