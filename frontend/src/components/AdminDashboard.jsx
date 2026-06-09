import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { MapContainer } from './MapContainer';

export const AdminDashboard = ({ setActiveTab }) => {
  const { logout, user } = useAuth();
  const [emergencies, setEmergencies] = useState([]);
  const [disasters, setDisasters] = useState([]);
  const [dispatchRequests, setDispatchRequests] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [stats, setStats] = useState({ active: 0, dispatched: 0, critical: 0 });
  const [loading, setLoading] = useState(true);

  // Load dashboard telemetry data
  const loadDashboardData = useCallback(async () => {
    try {
      const [emgRes, distRes, reqRes] = await Promise.all([
        axios.get('/api/emergency/active'),
        axios.get('/api/disasters/zones'),
        axios.get('/api/emergency/dispatch-requests')
      ]);

      const activeEmergencies = emgRes.data?.emergencies || [];
      setEmergencies(activeEmergencies);
      setDisasters(distRes.data?.zones || []);
      setDispatchRequests(reqRes.data?.requests || []);

      const activeCount = activeEmergencies.length;
      const dispatchedCount = activeEmergencies.filter(e => e.status === 'dispatched' || e.status === 'en_route').length;
      const criticalCount = activeEmergencies.filter(e => e.aiAnalysis?.severity === 'critical').length;

      setStats({
        active: activeCount,
        dispatched: dispatchedCount,
        critical: criticalCount
      });

    } catch (error) {
      console.error('Failed to load operations dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 10000);
    return () => clearInterval(interval);
  }, [loadDashboardData]);

  // Execute AI Dispatch Approval
  const handleApproveDispatch = async (emgId) => {
    try {
      await axios.post(`/api/emergency/dispatch/${emgId}`, { adminId: user?._id });
      loadDashboardData();
      if (selectedIncident && selectedIncident.emergencyId === emgId) {
        setSelectedIncident(prev => ({ ...prev, status: 'dispatched' }));
      }
    } catch (error) {
      console.error('Dispatch failed:', error);
      alert('Dispatch failed: ' + (error.response?.data?.error || error.message));
    }
  };

  const completedOrDispatched = emergencies.filter(e => e && (e.status === 'dispatched' || e.status === 'completed' || e.status === 'en_route')).length;
  const totalEmergencies = emergencies.length || 1;
  const completionPercentage = Math.round((completedOrDispatched / totalEmergencies) * 100) || 0;

  // Split incidents
  const criticalEmergencies = emergencies.filter(e => e && e.aiAnalysis?.severity === 'critical');
  const otherEmergencies = emergencies.filter(e => e && e.aiAnalysis?.severity !== 'critical');

  const getTimeAgo = (dateStr) => {
    const ms = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(ms / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ${mins % 60}m ago`;
  };

  return (
    <div className="selection:bg-primary-container selection:text-on-primary-container text-on-surface w-full">
      <main className="pt-4 pb-24 md:pb-8 px-margin-mobile max-w-container-max mx-auto">
        {/* Main Container */}
        <div className="animate-entrance bg-surface-container rounded-3xl shadow-lg border border-outline-variant overflow-hidden">
          {/* Global Progress Tracker (Interactive Header) */}
          <div className="p-6 border-b border-outline-variant bg-surface-container-high/50">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex-grow w-full md:w-auto">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-label-caps text-on-surface-variant uppercase tracking-wider font-semibold">Total Operational Completion</span>
                  <span className="text-headline-md font-bold text-tertiary">{completionPercentage}%</span>
                </div>
                <div className="w-full h-3 bg-surface-container-highest rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-tertiary rounded-full animate-progress-grow shadow-[0_0_12px_rgba(98,223,125,0.3)]" 
                    style={{ width: `${completionPercentage}%` }}
                  ></div>
                </div>
              </div>
              {/* Workflow Stages */}
              <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container-highest border border-outline-variant transition-colors hover:bg-surface-container-highest/80">
                  <span className="w-2 h-2 rounded-full bg-on-surface-variant"></span>
                  <span className="text-on-surface-variant uppercase">Pending ({emergencies.length - completedOrDispatched})</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary-container/20 border border-secondary/30 transition-colors hover:bg-secondary-container/30">
                  <span className="w-2 h-2 rounded-full bg-secondary pulse-live"></span>
                  <span class="text-secondary uppercase">In Progress ({stats.dispatched})</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-tertiary-container/20 border border-tertiary/30 transition-colors hover:bg-tertiary-container/30">
                  <span className="w-2 h-2 rounded-full bg-tertiary"></span>
                  <span className="text-tertiary uppercase">Completed</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-8 flex flex-col gap-8">
              {/* Clean Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div onClick={() => setActiveTab && setActiveTab('map')} className="animate-entrance stagger-1 card p-4 card-interactive cursor-pointer">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-label-caps text-on-surface-variant">Active Dispatches</span>
                    <span className="material-symbols-outlined text-secondary text-lg">broadcast_on_home</span>
                  </div>
                  <p className="text-headline-md font-bold text-on-surface">{stats.dispatched} <span className="text-xs font-normal text-on-surface-variant">Units</span></p>
                </div>
                <div onClick={() => alert('Response time analytics coming soon.')} className="animate-entrance stagger-2 card p-4 card-interactive cursor-pointer">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-label-caps text-on-surface-variant">Avg Response</span>
                    <span className="material-symbols-outlined text-secondary text-lg">timer</span>
                  </div>
                  <p className="text-headline-md font-bold text-on-surface">4:12 <span className="text-xs font-normal text-on-surface-variant">m/s</span></p>
                </div>
                <div onClick={() => setActiveTab && setActiveTab('inventory')} className="animate-entrance stagger-3 card p-4 card-interactive cursor-pointer">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-label-caps text-on-surface-variant">Resource Load</span>
                    <span className="material-symbols-outlined text-secondary text-lg">analytics</span>
                  </div>
                  <p className="text-headline-md font-bold text-on-surface">82% <span className="text-xs font-normal text-on-surface-variant">System</span></p>
                </div>
              </div>

              {/* Active Incident Feed */}
              <section>
                <h3 className="text-label-caps text-on-surface font-bold mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">emergency</span>
                  ACTIVE INCIDENTS
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  {emergencies.filter(e => e !== null && e !== undefined).slice(0, 4).map((emg, index) => {
                    const isCritical = emg.aiAnalysis?.severity === 'critical';
                    const isRoutine = !isCritical;
                    const progress = emg.status === 'dispatched' ? 90 : emg.status === 'en_route' ? 50 : 15;
                    const units = emg.response?.resources?.immediate || ['F12'];

                    return (
                      <div 
                        key={emg.emergencyId || index}
                        onClick={() => setSelectedIncident(emg)}
                        className={`card card-interactive ${selectedIncident?.emergencyId === emg.emergencyId ? 'ring-2 ring-secondary' : ''} ${isCritical ? 'border-secondary/50' : ''}`}
                      >
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 gap-2">
                          <div className="flex items-center gap-3 flex-wrap">
                            {isCritical ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-secondary/10 text-secondary border border-secondary/20 uppercase tracking-wider">
                                High Priority
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-on-surface-variant/10 text-on-surface-variant border border-on-surface-variant/20 uppercase tracking-wider">
                                Routine
                              </span>
                            )}
                            <h4 className="text-headline-md font-bold text-on-surface capitalize">
                              {emg.aiAnalysis?.disaster?.type && String(emg.aiAnalysis.disaster.type) !== 'Unknown' && typeof emg.aiAnalysis.disaster.type === 'string'
                                ? `${emg.aiAnalysis.disaster.type} Request` 
                                : `Emergency Request`} 
                              {emg.userId?.username ? ` by ${String(emg.userId.username)}` : (emg.user?.username ? ` by ${String(emg.user.username)}` : '')}
                            </h4>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-data-mono text-xs text-on-surface-variant whitespace-nowrap">{getTimeAgo(emg.createdAt || new Date())}</span>
                            <span className="text-data-mono text-[9px] text-on-surface-variant/50 uppercase" title={emg.emergencyId ? String(emg.emergencyId) : 'N/A'}>
                              REQ-ID: {emg.emergencyId ? String(emg.emergencyId).substring(0, 8) : 'N/A'}
                            </span>
                          </div>
                        </div>
                        <p className="text-body-md text-on-surface-variant mb-6 line-clamp-1">"{emg.userMessage ? String(emg.userMessage) : 'Assistance required at location.'}"</p>
                        
                        <div className="flex items-center gap-6">
                          <div className="flex-grow">
                            <div className="flex justify-between items-center text-[10px] text-on-surface-variant mb-2">
                              <span className="uppercase">UNIT JOURNEY: {units[0]}</span>
                              <span className={`font-bold ${isCritical ? 'text-tertiary' : 'text-secondary'}`}>{progress}% {progress > 80 ? 'ARRIVED' : 'EN ROUTE'}</span>
                            </div>
                            <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                              <div className={`h-full ${isCritical ? 'bg-tertiary' : 'bg-secondary'} rounded-full pulse-live`} style={{ width: `${progress}%` }}></div>
                            </div>
                          </div>
                          <div className="flex -space-x-2">
                            {Array.isArray(units) && units.slice(0, 2).map((unit, uIdx) => (
                              <div key={uIdx} className={`w-8 h-8 rounded-full border-2 border-surface-container-high ${isCritical ? 'bg-secondary text-on-secondary' : 'bg-surface-container-highest text-on-surface-variant'} flex items-center justify-center text-[10px] font-bold pulse-live`} style={{ animationDelay: `${uIdx * 0.3}s` }}>
                                {unit ? String(unit).substring(0, 3) : 'U'}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Dispatch Button if pending */}
                        {emg.status === 'received' && (
                          <div className="mt-4 flex justify-end">
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleApproveDispatch(emg.emergencyId); }}
                              className="px-4 py-2 bg-primary-container text-on-primary-container rounded-lg text-sm font-bold shadow hover:brightness-110 transition-all z-10 relative"
                            >
                              Approve Dispatch
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {emergencies.length === 0 && (
                    <div className="card p-8 text-center text-on-surface-variant">
                      No active incidents currently reported.
                    </div>
                  )}
                </div>
              </section>

              {/* Milestone Focus */}
              <section className="opacity-80">
                <h3 className="text-label-caps text-on-surface-variant font-bold mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  RECENTLY COMPLETED
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div onClick={() => alert('Detailed mission report downloaded.')} className="animate-entrance stagger-3 shimmer-bg p-3 rounded-xl bg-surface-container/30 border border-outline-variant/30 flex items-center gap-3 card-interactive cursor-pointer">
                    <span className="material-symbols-outlined text-tertiary">check_circle</span>
                    <div className="flex-grow">
                      <p className="text-xs font-bold text-on-surface-variant">Hazard Cleared - Sector 9</p>
                      <p className="text-[10px] text-on-surface-variant/60">Resolved 14:22 • Duration 18m</p>
                    </div>
                  </div>
                  <div onClick={() => alert('Detailed mission report downloaded.')} className="animate-entrance stagger-4 shimmer-bg p-3 rounded-xl bg-surface-container/30 border border-outline-variant/30 flex items-center gap-3 card-interactive cursor-pointer">
                    <span className="material-symbols-outlined text-tertiary">check_circle</span>
                    <div className="flex-grow">
                      <p className="text-xs font-bold text-on-surface-variant">EMS Support - Downtown</p>
                      <p className="text-[10px] text-on-surface-variant/60">Resolved 14:05 • Duration 42m</p>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Right Column */}
            <div className="lg:col-span-4 flex flex-col gap-8">
              {/* Map Card */}
              <div className="animate-entrance stagger-2 bg-surface-container-high rounded-2xl border border-outline-variant overflow-hidden h-[400px] relative card-interactive flex flex-col z-10">
                <MapContainer emergencies={emergencies} selectedIncident={selectedIncident} onSelectIncident={setSelectedIncident} />
                <div className="absolute top-3 left-3 px-3 py-1 rounded bg-surface-container/90 backdrop-blur-md border border-outline-variant text-[10px] font-bold text-on-surface z-[400] pointer-events-none">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary mr-1 pulse-live"></span>
                  LIVE OVERVIEW
                </div>
              </div>

              {/* Resource Load List */}
              <div className="animate-entrance stagger-3 bg-surface-container-high rounded-2xl border border-outline-variant p-5 card-interactive">
                <h3 className="text-label-caps text-on-surface font-bold mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">groups</span>
                  RESOURCE LOAD
                </h3>
                <div className="space-y-4">
                  <div onClick={() => setActiveTab && setActiveTab('inventory')} className="group/bar cursor-pointer">
                    <div className="flex justify-between text-[11px] font-bold mb-1">
                      <span className="text-on-surface-variant">FIRE/RESCUE</span>
                      <span className="text-on-surface">14/20</span>
                    </div>
                    <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                      <div className="h-full bg-secondary rounded-full transition-all duration-1000 group-hover/bar:brightness-110" style={{ width: '70%' }}></div>
                    </div>
                  </div>
                  <div onClick={() => setActiveTab && setActiveTab('inventory')} className="group/bar cursor-pointer">
                    <div className="flex justify-between text-[11px] font-bold mb-1">
                      <span className="text-on-surface-variant">EMS UNITS</span>
                      <span className="text-on-surface">18/22</span>
                    </div>
                    <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                      <div className="h-full bg-tertiary rounded-full transition-all duration-1000 group-hover/bar:brightness-110" style={{ width: '82%' }}></div>
                    </div>
                  </div>
                  <div onClick={() => setActiveTab && setActiveTab('inventory')} className="group/bar cursor-pointer">
                    <div className="flex justify-between text-[11px] font-bold mb-1">
                      <span className="text-on-surface-variant">LOGISTICS</span>
                      <span className="text-on-surface">5/12</span>
                    </div>
                    <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                      <div className="h-full bg-outline rounded-full transition-all duration-1000 group-hover/bar:brightness-110" style={{ width: '41%' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setActiveTab && setActiveTab('report')}
                className="animate-entrance stagger-4 w-full bg-primary-container text-on-primary-container py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all duration-300 shadow-md"
              >
                <span className="material-symbols-outlined">add_alert</span>
                CREATE NEW DISPATCH
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
