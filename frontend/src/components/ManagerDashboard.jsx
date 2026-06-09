import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export const ManagerDashboard = () => {
  const { logout, user } = useAuth();
  const [items, setItems] = useState([]);
  const [locations, setLocations] = useState([]);
  const [donations, setDonations] = useState([]);
  const [requests, setRequests] = useState([]);
  
  // Search / Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL'); // 'ALL', 'CRITICAL', 'LOW', 'STABLE'
  const [selectedWarehouse, setSelectedWarehouse] = useState('ALL'); // 'ALL' or specific location name
  
  // Modals state
  const [showItemModal, setShowItemModal] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '', category: 'Medical', currentStock: 0, minThreshold: 10, maxCapacity: 100, unit: 'units', location: '', cost: 0, supplier: 'Central Hub'
  });
  
  const [loading, setLoading] = useState(true);

  // Load Inventory Data
  const loadInventoryData = useCallback(async () => {
    try {
      const [itemRes, locRes, donRes, reqRes] = await Promise.all([
        axios.get('/api/inventory/items'),
        axios.get('/api/inventory/locations'),
        axios.get('/api/donations'),
        axios.get('/api/requests')
      ]);
      
      setItems(Array.isArray(itemRes.data) ? itemRes.data : itemRes.data?.items || []);
      setLocations(Array.isArray(locRes.data) ? locRes.data : locRes.data?.locations || []);
      setDonations(Array.isArray(donRes.data) ? donRes.data : donRes.data?.donations || []);
      setRequests(Array.isArray(reqRes.data) ? reqRes.data : reqRes.data?.requests || []);
    } catch (error) {
      console.error('Failed to load inventory operations data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInventoryData();
    const interval = setInterval(loadInventoryData, 12000);
    return () => clearInterval(interval);
  }, [loadInventoryData]);

  // Handle approvals
  const handleDonationAction = async (id, status) => {
    try {
      await axios.put(`/api/admin/donation/${id}`, { status, approvedBy: user?._id });
      loadInventoryData();
    } catch (error) {
      console.error('Donation action failed:', error);
    }
  };

  const handleRequestAction = async (id, status) => {
    try {
      await axios.put(`/api/admin/request/${id}`, { status, notes: `Approved by manager ${user?.username}` });
      loadInventoryData();
    } catch (error) {
      console.error('Request action failed:', error);
    }
  };

  // Add inventory item
  const handleCreateItem = async (e) => {
    e.preventDefault();
    try {
      // Endpoint to save item
      await axios.post('/api/data/inventory', newItem);
      setShowItemModal(false);
      setNewItem({
        name: '', category: 'Medical', currentStock: 0, minThreshold: 10, maxCapacity: 100, unit: 'units', location: '', cost: 0, supplier: 'Central Hub'
      });
      loadInventoryData();
    } catch (error) {
      console.error('Failed to create inventory item:', error);
      alert('Failed: ' + (error.response?.data?.error || error.message));
    }
  };

  const getUniqueLocations = () => {
    const dataLocs = items.map(item => {
      if (!item) return { id: 'N/A', name: 'N/A' };
      let idStr = item.location ? String(item.location._id || item.location) : 'N/A';
      if (item.locationName) return { id: idStr, name: String(item.locationName) };
      if (typeof item.location === 'object' && item.location && item.location.name) return { id: String(item.location._id), name: String(item.location.name) };
      const locObj = locations.find(l => String(l._id) === String(item.location));
      if (locObj) return { id: String(locObj._id), name: String(locObj.name) };
      return { id: idStr, name: idStr };
    }).filter(loc => loc.name && loc.name !== 'N/A' && loc.name !== 'undefined');

    const uniqueMap = new Map();
    dataLocs.forEach(loc => {
      if (!uniqueMap.has(loc.name)) uniqueMap.set(loc.name, loc);
    });

    ['North Terminal Alpha', 'East Border Hub', 'Southern Supply Point'].forEach(name => {
      if (!uniqueMap.has(name)) uniqueMap.set(name, { id: 'default-' + name, name });
    });

    return Array.from(uniqueMap.values()).slice(0, 6);
  };

  const getWarehouseStats = (warehouseName) => {
    const safeWarehouseName = String(warehouseName || '').toLowerCase();
    const warehouseItems = items.filter(item => {
      if (!item) return false;
      let itemLoc = item.locationName || item.location || 'Central Punjab Hub';
      if (typeof itemLoc === 'object' && itemLoc !== null) {
        itemLoc = itemLoc.name || String(itemLoc._id);
      }
      return String(itemLoc).toLowerCase().includes(safeWarehouseName);
    });

    const getCategoryPercentage = (catName) => {
      const catItems = warehouseItems.filter(i => String(i.category || '').toLowerCase() === catName.toLowerCase());
      if (catItems.length === 0) {
        // Mock default values if DB items don't cover it
        if (warehouseName.includes('North')) {
          if (catName === 'water') return 12;
          if (catName === 'food') return 84;
          if (catName === 'medical') return 34;
          return 92;
        } else if (warehouseName.includes('East')) {
          if (catName === 'water') return 45;
          if (catName === 'food') return 31;
          if (catName === 'medical') return 78;
          return 65;
        } else {
          if (catName === 'water') return 95;
          if (catName === 'food') return 88;
          if (catName === 'medical') return 92;
          return 99;
        }
      }
      const sumCurrent = catItems.reduce((acc, curr) => acc + (curr.currentStock || 0), 0);
      const sumMax = catItems.reduce((acc, curr) => acc + (curr.maxCapacity || 100), 0);
      return Math.round((sumCurrent / sumMax) * 100);
    };

    const waterPct = getCategoryPercentage('water');
    const foodPct = getCategoryPercentage('food');
    const medicalPct = getCategoryPercentage('medical');
    const shelterPct = getCategoryPercentage('shelter');

    // Determine Status
    let severity = 'STABLE';
    let borderColor = 'border-l-tertiary-container';
    let statusColor = 'text-tertiary-container';
    
    if (waterPct < 20 || foodPct < 20 || medicalPct < 20 || shelterPct < 20) {
      severity = 'CRITICAL';
      borderColor = 'border-l-primary-container';
      statusColor = 'text-primary-container';
    } else if (waterPct < 50 || foodPct < 50 || medicalPct < 50 || shelterPct < 50) {
      severity = 'WARNING';
      borderColor = 'border-l-orange-500';
      statusColor = 'text-orange-500';
    }

    return { waterPct, foodPct, medicalPct, shelterPct, severity, borderColor, statusColor };
  };

  // Filter items list based on search and dropdowns
  const filteredItems = items.filter(item => {
    if (!item) return false;
    const safeItemName = String(item.name || 'UNKNOWN').toLowerCase();
    
    let safeLoc = item.locationName || item.location || 'UNKNOWN';
    if (typeof safeLoc === 'object' && safeLoc !== null) {
      safeLoc = safeLoc.name || String(safeLoc._id);
    }
    safeLoc = String(safeLoc).toLowerCase();
    const safeQuery = String(searchQuery || '').toLowerCase();

    const matchesSearch = safeItemName.includes(safeQuery) || safeLoc.includes(safeQuery);
    
    const status = item.currentStock <= 0 ? 'CRITICAL' : 
                   item.currentStock <= item.minThreshold ? 'LOW' : 'STABLE';
    
    const matchesStatus = selectedStatus === 'ALL' || status === selectedStatus;
    
    let safeWarehouse = selectedWarehouse === 'ALL' ? 'ALL' : String(selectedWarehouse).toLowerCase();
    const matchesWarehouse = safeWarehouse === 'ALL' || safeLoc.includes(safeWarehouse);

    return matchesSearch && matchesStatus && matchesWarehouse;
  });

  return (
    <div className="text-on-surface selection:bg-primary-container selection:text-on-primary-container flex flex-col w-full">
      {/* Main Canvas */}
      <main className="pt-4 px-margin-mobile max-w-container-max mx-auto w-full flex-grow">
        {/* Dashboard Header */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="text-headline-lg-mobile md:text-headline-lg font-headline-lg text-on-surface">Inventory Command</h2>
              <p className="text-on-surface-variant font-body-md">Monitoring {getUniqueLocations().length} regional supply sectors</p>
            </div>
            <button 
              onClick={() => setShowItemModal(true)} 
              className="bg-primary-container text-on-primary-container font-bold px-6 py-3 rounded-xl flex items-center gap-2 hover:brightness-110 transition-all active:scale-95 text-sm"
            >
              <span className="material-symbols-outlined">add</span>
              REGISTER STOCKPILE ITEM
            </button>
          </div>

          {/* Search and Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-surface-container border border-outline-variant p-2 rounded-xl">
            <div className="md:col-span-2 relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
              <input 
                type="text" 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-surface border-none rounded-lg pl-10 text-on-surface focus:ring-1 focus:ring-primary placeholder:text-on-surface-variant/50 text-sm" 
                placeholder="Filter by Item Name or Warehouse ID..."
              />
            </div>
            <div>
              <select 
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                className="w-full bg-surface-container-high border border-outline-variant rounded-lg px-3 py-2 text-label-caps font-label-caps text-on-surface focus:ring-1 focus:ring-primary outline-none"
              >
                <option value="ALL">Status: ALL</option>
                <option value="CRITICAL">Status: CRITICAL</option>
                <option value="LOW">Status: LOW</option>
                <option value="STABLE">Status: STABLE</option>
              </select>
            </div>
            <div>
              <select 
                value={selectedWarehouse}
                onChange={e => setSelectedWarehouse(e.target.value)}
                className="w-full bg-surface-container-high border border-outline-variant rounded-lg px-3 py-2 text-label-caps font-label-caps text-on-surface focus:ring-1 focus:ring-primary outline-none"
              >
                <option value="ALL">Warehouse: ALL</option>
                {getUniqueLocations().map(loc => (
                  <option key={loc.id || loc.name || Math.random()} value={loc.name}>{loc.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Warehouse Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {getUniqueLocations().map(locObj => {
            const locName = locObj.name;
            const locId = locObj.id;
            const { waterPct, foodPct, medicalPct, shelterPct, severity, borderColor, statusColor } = getWarehouseStats(locName);
            return (
              <div 
                key={locName}
                onClick={() => setSelectedWarehouse(locName)}
                className={`bg-surface-container-low border border-outline-variant rounded-xl overflow-hidden hover:border-primary/50 transition-colors relative cursor-pointer border-l-4 ${borderColor}`}
              >
                <div className="p-4 flex flex-col justify-between h-full space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1 text-xs">
                      <span className="text-data-mono font-data-mono text-on-surface-variant uppercase" title={String(locId)}>
                        WH-ID: <span className="text-primary">{String(locId).length > 10 ? String(locId).substring(0, 8) : String(locId)}</span>
                      </span>
                      <span className={`text-data-mono font-data-mono font-bold ${statusColor}`}>{severity}</span>
                    </div>
                    <h3 className="text-headline-md font-bold text-on-surface leading-tight truncate">{locName}</h3>
                  </div>

                  {/* Stock Levels progress bars */}
                  <div className="space-y-2">
                    <div className="space-y-0.5">
                      <div className="flex justify-between text-[9px] font-label-caps text-on-surface-variant uppercase">
                        <span>Water</span>
                        <span className={waterPct < 30 ? 'text-red-400' : 'text-on-surface'}>{waterPct}%</span>
                      </div>
                      <div className="h-1 w-full bg-surface-variant rounded-full overflow-hidden">
                        <div className={`h-full status-bar-fill ${waterPct < 30 ? 'bg-primary-container' : 'bg-tertiary-container'}`} style={{ width: `${waterPct}%` }}></div>
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex justify-between text-[9px] font-label-caps text-on-surface-variant uppercase">
                        <span>Food</span>
                        <span className={foodPct < 30 ? 'text-red-400' : 'text-on-surface'}>{foodPct}%</span>
                      </div>
                      <div className="h-1 w-full bg-surface-variant rounded-full overflow-hidden">
                        <div className={`h-full status-bar-fill ${foodPct < 30 ? 'bg-primary-container' : 'bg-tertiary-container'}`} style={{ width: `${foodPct}%` }}></div>
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex justify-between text-[9px] font-label-caps text-on-surface-variant uppercase">
                        <span>Medical</span>
                        <span className={medicalPct < 30 ? 'text-red-400' : 'text-on-surface'}>{medicalPct}%</span>
                      </div>
                      <div className="h-1 w-full bg-surface-variant rounded-full overflow-hidden">
                        <div className={`h-full status-bar-fill ${medicalPct < 30 ? 'bg-primary-container' : 'bg-tertiary-container'}`} style={{ width: `${medicalPct}%` }}></div>
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex justify-between text-[9px] font-label-caps text-on-surface-variant uppercase">
                        <span>Shelter</span>
                        <span className={shelterPct < 30 ? 'text-red-400' : 'text-on-surface'}>{shelterPct}%</span>
                      </div>
                      <div className="h-1 w-full bg-surface-variant rounded-full overflow-hidden">
                        <div className={`h-full status-bar-fill ${shelterPct < 30 ? 'bg-primary-container' : 'bg-tertiary-container'}`} style={{ width: `${shelterPct}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Stock Repository Table */}
        <section className="bg-surface-container-low border border-outline-variant rounded-xl overflow-hidden mb-8">
          <div className="p-4 bg-surface-variant/30 border-b border-outline-variant flex justify-between items-center">
            <h3 className="text-label-caps font-label-caps text-on-surface">STOCK CATALOG REPOSITORY ({filteredItems.length})</h3>
            <button 
              onClick={() => { setSelectedWarehouse('ALL'); setSelectedStatus('ALL'); setSearchQuery(''); }}
              className="text-xs text-primary font-bold hover:underline"
            >
              CLEAR FILTERS
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/60 text-on-surface-variant font-mono uppercase bg-slate-900/40">
                  <th className="p-3">Item Description</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Stock Count</th>
                  <th className="p-3">Min Limit</th>
                  <th className="p-3">Location</th>
                  <th className="p-3">Supplier</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30">
                {filteredItems.map(item => {
                  const status = item.currentStock <= 0 ? 'CRITICAL' : 
                                 item.currentStock <= item.minThreshold ? 'LOW' : 'STABLE';
                  const badgeClass = status === 'CRITICAL' ? 'bg-primary-container text-on-primary-container border border-red-500/20' :
                                     status === 'LOW' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                                     'bg-tertiary-container text-on-tertiary-container border border-green-500/20';

                  return (
                    <tr key={String(item._id)} className="hover:bg-surface-variant/10 transition-colors">
                      <td className="p-3 font-bold text-on-surface">{item.name ? String(item.name) : 'UNKNOWN'}</td>
                      <td className="p-3 text-on-surface-variant">{item.category ? String(item.category) : 'UNKNOWN'}</td>
                      <td className="p-3 font-mono font-bold text-sm">{item.currentStock || 0} {item.unit ? String(item.unit) : ''}</td>
                      <td className="p-3 font-mono text-on-surface-variant">{item.minThreshold || 0}</td>
                      <td className="p-3 text-on-surface-variant">
                        {item.locationName ? String(item.locationName) : (typeof item.location === 'object' && item.location !== null ? String(item.location.name || item.location._id) : String(item.location || 'UNKNOWN'))}
                      </td>
                      <td className="p-3 text-on-surface-variant opacity-60">{item.supplier ? String(item.supplier) : 'UNKNOWN'}</td>
                      <td className="p-3">
                        <span className={`px-2.5 py-1 rounded text-[10px] font-bold ${badgeClass}`}>
                          {String(status)}
                        </span>
                      </td>
                    </tr>
                  );
                })}

                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-on-surface-variant">
                      No stockpile items found matching query selectors.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Approvals Board split grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter mb-8">
          
          {/* Volunteer Donations Approvals */}
          <section className="glass-panel rounded-xl overflow-hidden flex flex-col h-[280px]">
            <div className="p-4 bg-surface-variant/30 border-b border-outline-variant flex justify-between items-center">
              <h3 className="text-label-caps font-label-caps text-[#62df7d] flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">volunteer_activism</span>
                VOLUNTEER DONATION BEACONS
              </h3>
            </div>
            <div className="p-4 flex-grow overflow-y-auto divide-y divide-outline-variant/30 space-y-2">
              {donations.filter(d => d && d.status === 'pending').map(don => (
                <div key={String(don._id)} className="pt-2 flex justify-between items-center gap-4 text-xs">
                  <div>
                    <h4 className="font-bold text-on-surface">{don.itemName ? String(don.itemName) : 'UNKNOWN'}</h4>
                    <p className="text-on-surface-variant text-[11px]">Qty: {don.quantity || 1} | Drop-off: {typeof don.location === 'object' && don.location !== null ? String(don.location.name || don.location._id || 'UNKNOWN') : String(don.location || 'UNKNOWN')}</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleDonationAction(don._id, 'approved')} 
                      className="bg-[#62df7d]/10 hover:bg-[#62df7d]/20 text-[#62df7d] border border-[#62df7d]/30 font-bold px-3 py-1.5 rounded text-[10px] transition-all"
                    >
                      APPROVE
                    </button>
                    <button 
                      onClick={() => handleDonationAction(don._id, 'rejected')} 
                      className="bg-primary-container/10 hover:bg-primary-container/20 text-[#ffb4ab] border border-primary-container/20 font-bold px-3 py-1.5 rounded text-[10px] transition-all"
                    >
                      REJECT
                    </button>
                  </div>
                </div>
              ))}

              {donations.filter(d => d.status === 'pending').length === 0 && (
                <div className="p-8 text-center text-on-surface-variant text-xs h-full flex items-center justify-center">
                  All volunteer donations fully processed. Command pipeline clear.
                </div>
              )}
            </div>
          </section>

          {/* Citizen Supply Requests Approvals */}
          <section className="glass-panel rounded-xl overflow-hidden flex flex-col h-[280px]">
            <div className="p-4 bg-surface-variant/30 border-b border-outline-variant flex justify-between items-center">
              <h3 className="text-label-caps font-label-caps text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">emergency_home</span>
                CITIZEN RESCUE REQUESTS
              </h3>
            </div>
            <div className="p-4 flex-grow overflow-y-auto divide-y divide-outline-variant/30 space-y-2">
              {requests.filter(r => r && r.status === 'pending').map(req => (
                <div key={String(req._id)} className="pt-2 flex justify-between items-center gap-4 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-on-surface">{req.itemName ? String(req.itemName) : 'UNKNOWN'}</h4>
                      <span className={`px-1.5 py-0.2 rounded text-[8px] font-bold ${
                        req.priority === 'urgent' ? 'bg-red-500/15 text-red-400' : 'bg-yellow-500/15 text-yellow-400'
                      }`}>
                        {String(req.priority || 'UNKNOWN').toUpperCase()}
                      </span>
                    </div>
                    <p className="text-on-surface-variant text-[11px]">Qty: {req.quantity || 1} | Requester: {req.requesterId?.username ? String(req.requesterId.username) : (typeof req.requesterId === 'string' ? String(req.requesterId) : 'UNKNOWN')}</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleRequestAction(req._id, 'approved')} 
                      className="bg-primary text-on-primary font-bold px-3 py-1.5 rounded text-[10px] hover:brightness-110 transition-all"
                    >
                      APPROVE
                    </button>
                    <button 
                      onClick={() => handleRequestAction(req._id, 'rejected')} 
                      className="bg-surface-container-high hover:bg-surface-variant text-on-surface-variant border border-outline-variant font-bold px-3 py-1.5 rounded text-[10px] transition-all"
                    >
                      REJECT
                    </button>
                  </div>
                </div>
              ))}

              {requests.filter(r => r.status === 'pending').length === 0 && (
                <div className="p-8 text-center text-on-surface-variant text-xs h-full flex items-center justify-center">
                  No pending citizen supply requests in queue.
                </div>
              )}
            </div>
          </section>

        </div>

        {/* Intelligence Bento Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface-container-high p-6 rounded-xl border border-outline-variant flex flex-col justify-between h-40 overflow-hidden relative">
            <div>
              <h4 className="text-label-caps font-label-caps text-on-surface-variant">Active Operations</h4>
              <p className="text-display-lg font-display-lg mt-1 font-bold text-3xl">{requests.filter(r => r && r.status === 'approved').length + donations.filter(d => d && d.status === 'approved').length}</p>
              <p className="text-tertiary text-xs font-mono mt-1">+2 inbound dispatch transfers</p>
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-10">
              <span className="material-symbols-outlined text-8xl">local_shipping</span>
            </div>
          </div>
          <div className="bg-surface-container-high p-6 rounded-xl border border-outline-variant flex flex-col justify-between h-40 overflow-hidden relative">
            <div>
              <h4 className="text-label-caps font-label-caps text-on-surface-variant">Burn Rate Acceleration</h4>
              <p className="text-display-lg font-display-lg mt-1 font-bold text-3xl text-primary">0.8x</p>
              <p className="text-on-surface-variant text-xs font-mono mt-1">Accelerated stockpile deplete in Sector 7</p>
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-10">
              <span className="material-symbols-outlined text-8xl">trending_up</span>
            </div>
          </div>
          <div className="bg-surface-container-high p-6 rounded-xl border border-outline-variant flex flex-col justify-between h-40 overflow-hidden relative">
            <div>
              <h4 className="text-label-caps font-label-caps text-on-surface-variant">Network Status Telemetry</h4>
              <p className="text-display-lg font-display-lg mt-1 font-bold text-3xl text-tertiary">99.8%</p>
              <p className="text-on-surface-variant text-xs font-mono mt-1">Satellite arrays reporting green</p>
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-10">
              <span className="material-symbols-outlined text-8xl">radar</span>
            </div>
          </div>
        </div>

      </main>

      {/* Add Stock Item Modal */}
      {showItemModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card p-6 rounded-xl border border-outline-variant max-w-md w-full bg-slate-900 text-on-surface space-y-4 mx-4">
            <div className="flex justify-between items-center border-b border-outline-variant pb-2">
              <h3 className="text-headline-md font-bold text-primary">Add Stockpile Item</h3>
              <button onClick={() => setShowItemModal(false)} className="text-on-surface-variant hover:text-primary">✕</button>
            </div>
            
            <form onSubmit={handleCreateItem} className="space-y-4">
              <div>
                <label className="text-label-caps font-label-caps opacity-80 block mb-1">Item Name</label>
                <input 
                  type="text" 
                  className="w-full bg-surface border border-outline-variant rounded-lg p-2 text-sm focus:ring-1 focus:ring-primary focus:border-transparent outline-none" 
                  value={newItem.name} 
                  onChange={e => setNewItem({...newItem, name: e.target.value})} 
                  placeholder="e.g. Surgical Masks, Rice Bag" 
                  required 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-label-caps font-label-caps opacity-80 block mb-1">Category</label>
                  <select 
                    className="w-full bg-surface border border-outline-variant rounded-lg p-2 text-sm focus:ring-1 focus:ring-primary focus:border-transparent outline-none text-on-surface" 
                    value={newItem.category} 
                    onChange={e => setNewItem({...newItem, category: e.target.value})}
                  >
                    <option value="Water">Water</option>
                    <option value="Food">Food</option>
                    <option value="Medical">Medical</option>
                    <option value="Shelter">Shelter</option>
                    <option value="Equipment">Equipment</option>
                  </select>
                </div>
                <div>
                  <label className="text-label-caps font-label-caps opacity-80 block mb-1">Unit</label>
                  <input 
                    type="text" 
                    className="w-full bg-surface border border-outline-variant rounded-lg p-2 text-sm focus:ring-1 focus:ring-primary focus:border-transparent outline-none" 
                    value={newItem.unit} 
                    onChange={e => setNewItem({...newItem, unit: e.target.value})} 
                    placeholder="e.g. units, kg, box" 
                    required 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-label-caps font-label-caps opacity-80 block mb-1">Initial Stock</label>
                  <input 
                    type="number" 
                    className="w-full bg-surface border border-outline-variant rounded-lg p-2 text-sm focus:ring-1 focus:ring-primary focus:border-transparent outline-none" 
                    value={newItem.currentStock} 
                    onChange={e => setNewItem({...newItem, currentStock: parseInt(e.target.value) || 0})} 
                    required 
                  />
                </div>
                <div>
                  <label className="text-label-caps font-label-caps opacity-80 block mb-1">Min Limit</label>
                  <input 
                    type="number" 
                    className="w-full bg-surface border border-outline-variant rounded-lg p-2 text-sm focus:ring-1 focus:ring-primary focus:border-transparent outline-none" 
                    value={newItem.minThreshold} 
                    onChange={e => setNewItem({...newItem, minThreshold: parseInt(e.target.value) || 0})} 
                    required 
                  />
                </div>
              </div>

              <div>
                <label className="text-label-caps font-label-caps opacity-80 block mb-1">Storage Location Name</label>
                <input 
                  type="text" 
                  className="w-full bg-surface border border-outline-variant rounded-lg p-2 text-sm focus:ring-1 focus:ring-primary focus:border-transparent outline-none" 
                  value={newItem.location} 
                  onChange={e => setNewItem({...newItem, location: e.target.value})} 
                  placeholder="e.g. Amritsar Storage" 
                  required 
                />
              </div>

              <div className="flex gap-4 pt-2">
                <button type="submit" className="flex-1 py-3 bg-primary text-on-primary font-bold rounded-lg active:scale-95 transition-transform text-sm uppercase tracking-wider">
                  Register Item
                </button>
                <button type="button" onClick={() => setShowItemModal(false)} className="flex-1 py-3 border border-outline-variant text-on-surface font-bold rounded-lg active:scale-95 transition-transform text-sm">
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
