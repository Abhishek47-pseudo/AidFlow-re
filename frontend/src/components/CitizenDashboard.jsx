import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { MapContainer as LeafletMap, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Fix Leaflet marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Interactive map clicks
const LocationMarker = ({ position, setPosition }) => {
  useMapEvents({
    click(e) {
      setPosition({ lat: e.latlng.lat, lon: e.latlng.lng });
    },
  });
  return position ? <Marker position={[position.lat, position.lon]} /> : null;
};

const LocationPickerMap = ({ lat, lon, onChange }) => {
  return (
    <LeafletMap center={[lat, lon]} zoom={13} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        attribution='&copy; CARTO'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      <LocationMarker position={{ lat, lon }} setPosition={({ lat, lon }) => onChange(lat, lon)} />
    </LeafletMap>
  );
};

export const CitizenDashboard = ({ subView = 'report', setActiveTab }) => {
  const { logout, user } = useAuth();
  
  // Tab control
  const activeTab = subView;
  
  // Step control (for 'report' tab)
  const [step, setStep] = useState(1); // 1: Location, 2: Type/Details, 3: Visuals, 4: Review

  // SOS Form States
  const [locationCoords, setLocationCoords] = useState({ lat: 30.7333, lon: 76.7794 });
  const [disasterCategory, setDisasterCategory] = useState('fire_truck'); // 'flood', 'fire_truck', 'earthquake', 'storm'
  const [situationReport, setSituationReport] = useState('');
  const [imageData, setImageData] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  
  // AI Simulation States
  const [isScanning, setIsScanning] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);
  const [aiConfidence, setAiConfidence] = useState(null);
  const [aiThreatLevel, setAiThreatLevel] = useState(null);

  // Supply Requests States
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestForm, setRequestForm] = useState({
    itemName: '', category: 'Water', quantity: 2, location: 'My Coordinates', priority: 'normal'
  });

  // SOS submission status
  const [sosStatus, setSosStatus] = useState(null); // 'sending', 'success', 'error'
  const [sosError, setSosError] = useState('');

  const fileInputRef = useRef(null);

  // Fetch location on mount
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationCoords({
          lat: position.coords.latitude,
          lon: position.coords.longitude
        });
      },
      (error) => {
        console.warn('Geolocation access denied. Using default coordinates (Chandigarh).');
      },
      { timeout: 8000 }
    );
  }, []);

  // Load citizen's supply requests
  const loadCitizenRequests = useCallback(async () => {
    try {
      const response = await axios.get('/api/requester/requests');
      setRequests(response.data || []);
    } catch (error) {
      console.error('Failed to load citizen supply requests:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCitizenRequests();
    const interval = setInterval(loadCitizenRequests, 10000);
    return () => clearInterval(interval);
  }, [loadCitizenRequests]);

  // Handle supply request submit
  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/requester/request', requestForm);
      setShowRequestForm(false);
      setRequestForm({
        itemName: '', category: 'Water', quantity: 2, location: 'My Coordinates', priority: 'normal'
      });
      loadCitizenRequests();
    } catch (error) {
      console.error('Request submission failed:', error);
    }
  };

  // Confirm receipt of supplies
  const handleFulfillRequest = async (id) => {
    try {
      await axios.put(`/api/requester/fulfill/${id}`, { notes: 'Citizen marked as fulfilled' });
      loadCitizenRequests();
    } catch (error) {
      console.error('Fulfillment update failed:', error);
    }
  };

  // Image upload handler
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = () => {
        setImageData(reader.result); // Base64 data URL
        setHasScanned(false); // Reset scanning status on new image
      };
    }
  };

  // Simulate AI Scan locally
  const runAISimulation = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setHasScanned(true);
      setAiConfidence(98.4);
      setAiThreatLevel('CRITICAL');
    }, 3000);
  };

  // Submit Emergency (SOS)
  const handleSubmitEmergency = async () => {
    setSosStatus('sending');
    setSosError('');

    try {
      let payload;
      let endpoint;

      const categoryText = {
        'flood': 'Flood',
        'fire_truck': 'Wildfire',
        'earthquake': 'Earthquake',
        'storm': 'Severe Storm'
      }[disasterCategory] || 'Emergency';

      const fullMessage = situationReport || `URGENT ASSISTANCE REQUIRED. ${categoryText.toUpperCase()} reported by citizen.`;

      if (imageData) {
        endpoint = '/api/emergency/request-with-image';
        payload = {
          imageData: imageData,
          location: {
            lat: locationCoords.lat,
            lon: locationCoords.lon,
            address: `GPS Coordinate: ${locationCoords.lat.toFixed(4)}, ${locationCoords.lon.toFixed(4)}`
          },
          userId: user?._id,
          message: fullMessage
        };
      } else {
        endpoint = '/api/emergency/request';
        payload = {
          lat: locationCoords.lat,
          lon: locationCoords.lon,
          message: fullMessage,
          address: `GPS Coordinate: ${locationCoords.lat.toFixed(4)}, ${locationCoords.lon.toFixed(4)}`
        };
      }

      const response = await axios.post(endpoint, payload);
      setSosStatus('success');
      
      // Reset form variables
      setTimeout(() => {
        setStep(1);
        setSituationReport('');
        setImageData(null);
        setPreviewUrl(null);
        setHasScanned(false);
        setSosStatus(null);
        loadCitizenRequests();
      }, 3000);

    } catch (error) {
      const errMsg = error.response?.data?.error || error.message;
      setSosStatus('error');
      setSosError(errMsg);
    }
  };

  // Stepper dot classes helper
  const getDotClass = (dotStep) => {
    if (step === dotStep) {
      return "w-8 h-8 rounded-full border-2 border-primary flex items-center justify-center bg-primary text-on-primary font-bold";
    } else if (step > dotStep) {
      return "w-8 h-8 rounded-full border-2 border-primary flex items-center justify-center bg-primary/20 text-primary font-bold";
    } else {
      return "w-8 h-8 rounded-full border-2 border-outline-variant flex items-center justify-center text-on-surface-variant";
    }
  };

  return (
    <div className="text-on-surface font-body-md antialiased overflow-x-hidden min-h-screen flex flex-col">
      {/* Main Canvas */}
      <main className="pt-4 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto w-full flex-grow">
        
        {/* TAB 1: Report Emergency (SOS) */}
        {activeTab === 'report' && (
          <div className="max-w-2xl mx-auto py-6">
            {/* Stepper Indicator */}
            <nav className="flex justify-between items-center mb-8">
              <div className="flex flex-col items-center gap-1">
                <div className={getDotClass(1)}>
                  {step > 1 ? <span className="material-symbols-outlined text-sm">check</span> : "1"}
                </div>
                <span className="text-label-caps font-label-caps opacity-60">Location</span>
              </div>
              <div className={`h-px flex-1 mx-2 mb-6 ${step > 1 ? 'bg-primary' : 'bg-outline-variant'}`}></div>
              <div className="flex flex-col items-center gap-1">
                <div className={getDotClass(2)}>
                  {step > 2 ? <span className="material-symbols-outlined text-sm">check</span> : "2"}
                </div>
                <span className="text-label-caps font-label-caps opacity-60">Details</span>
              </div>
              <div className={`h-px flex-1 mx-2 mb-6 ${step > 2 ? 'bg-primary' : 'bg-outline-variant'}`}></div>
              <div className="flex flex-col items-center gap-1">
                <div className={getDotClass(3)}>
                  {step > 3 ? <span className="material-symbols-outlined text-sm">check</span> : "3"}
                </div>
                <span className="text-label-caps font-label-caps opacity-60">Visuals</span>
              </div>
              <div className={`h-px flex-1 mx-2 mb-6 ${step > 3 ? 'bg-primary' : 'bg-outline-variant'}`}></div>
              <div className="flex flex-col items-center gap-1">
                <div className={getDotClass(4)}>4</div>
                <span className="text-label-caps font-label-caps opacity-60">Review</span>
              </div>
            </nav>

            {/* Stepper Content */}
            <div className="space-y-6">
              
              {/* Step 1: Location Selection */}
              {step === 1 && (
                <section className="space-y-4">
                  <h1 className="text-headline-lg-mobile md:text-headline-lg font-headline-lg text-primary">Confirm Emergency Location</h1>
                  <p className="text-on-surface-variant">Verify or tap the map to change the coordinates of the disaster site.</p>
                  
                  <div className="relative w-full h-[350px] rounded-xl overflow-hidden border border-outline-variant">
                    <LocationPickerMap 
                      lat={locationCoords.lat} 
                      lon={locationCoords.lon} 
                      onChange={(lat, lon) => setLocationCoords({ lat, lon })} 
                    />
                    
                    <div className="absolute bottom-4 left-4 z-[1000] glass-overlay p-3 rounded border border-surface-variant flex flex-col">
                      <span className="text-data-mono font-data-mono text-primary text-xs">LAT: {locationCoords.lat.toFixed(6)}</span>
                      <span className="text-data-mono font-data-mono text-primary text-xs">LNG: {locationCoords.lon.toFixed(6)}</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => setStep(2)} 
                    className="w-full py-4 bg-primary text-on-primary font-bold rounded-xl active:scale-95 transition-transform tracking-wider"
                  >
                    CONFIRM LOCATION
                  </button>
                </section>
              )}

              {/* Step 2: Disaster Type & SITREP */}
              {step === 2 && (
                <section className="space-y-6">
                  <h1 className="text-headline-lg-mobile md:text-headline-lg font-headline-lg text-primary">Incident Details</h1>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => setDisasterCategory('flood')}
                      className={`flex flex-col items-center gap-2 p-4 border rounded-xl hover:bg-surface-variant transition-colors group ${disasterCategory === 'flood' ? 'border-primary ring-1 ring-primary text-primary' : 'border-outline-variant'}`}
                    >
                      <span className="material-symbols-outlined text-3xl">flood</span>
                      <span className="text-label-caps font-label-caps">Flood</span>
                    </button>
                    <button 
                      onClick={() => setDisasterCategory('fire_truck')}
                      className={`flex flex-col items-center gap-2 p-4 border rounded-xl hover:bg-surface-variant transition-colors group ${disasterCategory === 'fire_truck' ? 'border-primary ring-1 ring-primary text-primary' : 'border-outline-variant'}`}
                    >
                      <span className="material-symbols-outlined text-3xl">fire_truck</span>
                      <span className="text-label-caps font-label-caps">Wildfire</span>
                    </button>
                    <button 
                      onClick={() => setDisasterCategory('earthquake')}
                      className={`flex flex-col items-center gap-2 p-4 border rounded-xl hover:bg-surface-variant transition-colors group ${disasterCategory === 'earthquake' ? 'border-primary ring-1 ring-primary text-primary' : 'border-outline-variant'}`}
                    >
                      <span className="material-symbols-outlined text-3xl">earthquake</span>
                      <span className="text-label-caps font-label-caps">Earthquake</span>
                    </button>
                    <button 
                      onClick={() => setDisasterCategory('storm')}
                      className={`flex flex-col items-center gap-2 p-4 border rounded-xl hover:bg-surface-variant transition-colors group ${disasterCategory === 'storm' ? 'border-primary ring-1 ring-primary text-primary' : 'border-outline-variant'}`}
                    >
                      <span className="material-symbols-outlined text-3xl">storm</span>
                      <span className="text-label-caps font-label-caps">Severe Storm</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    <label className="text-label-caps font-label-caps opacity-80">SITUATION REPORT (SITREP)</label>
                    <textarea 
                      value={situationReport}
                      onChange={(e) => setSituationReport(e.target.value)}
                      className="w-full bg-surface border border-outline-variant rounded-xl p-4 focus:ring-2 focus:ring-primary focus:border-transparent outline-none placeholder:text-on-surface-variant/40" 
                      placeholder="Describe the current situation, estimated victims, and immediate needs..." 
                      rows="4"
                    />
                  </div>

                  <div className="flex gap-4">
                    <button 
                      onClick={() => setStep(1)} 
                      className="flex-1 py-4 border border-outline-variant text-on-surface font-bold rounded-xl active:scale-95 transition-transform"
                    >
                      BACK
                    </button>
                    <button 
                      onClick={() => setStep(3)} 
                      className="flex-[2] py-4 bg-primary text-on-primary font-bold rounded-xl active:scale-95 transition-transform"
                    >
                      NEXT: CAPTURE MEDIA
                    </button>
                  </div>
                </section>
              )}

              {/* Step 3: Image Upload & AI Scan */}
              {step === 3 && (
                <section className="space-y-6">
                  <h1 className="text-headline-lg-mobile md:text-headline-lg font-headline-lg text-primary">Visual Assessment</h1>
                  
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={fileInputRef} 
                    onChange={handleImageChange} 
                  />
                  
                  <div 
                    onClick={() => fileInputRef.current.click()}
                    className="relative w-full aspect-video rounded-xl border-2 border-dashed border-outline-variant flex flex-col items-center justify-center gap-2 bg-surface-container overflow-hidden cursor-pointer hover:border-primary/50 transition-colors"
                  >
                    {previewUrl ? (
                      <>
                        <img className="absolute inset-0 w-full h-full object-cover" src={previewUrl} alt="Disaster Preview" />
                        
                        {isScanning && (
                          <div className="absolute inset-0 z-10 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center">
                            <div className="scanning-line"></div>
                            <div className="absolute top-4 left-4 glass-overlay p-2 rounded text-data-mono text-primary text-xs border border-primary/40">
                              ANALYZING PIXEL DATA...
                            </div>
                          </div>
                        )}
                        
                        {hasScanned && (
                          <div className="absolute bottom-4 right-4 bg-primary-container text-on-primary-container px-3 py-1.5 rounded-full text-label-caps font-label-caps flex items-center gap-2 border border-red-500/20">
                            <span className="material-symbols-outlined text-sm">verified</span> 
                            {disasterCategory.toUpperCase()} DETECTED {aiConfidence}%
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex flex-col items-center p-6 text-center">
                        <span className="material-symbols-outlined text-4xl text-outline mb-2">add_a_photo</span>
                        <span className="text-label-caps font-label-caps">Upload or Take Photo</span>
                        <span className="text-[10px] text-on-surface-variant opacity-60 mt-1">AI will automatically analyze the threat level</span>
                      </div>
                    )}
                  </div>

                  {hasScanned && (
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-surface-variant p-2 rounded flex flex-col items-center border border-outline-variant">
                        <span className="text-data-mono text-[10px] opacity-60">Threat</span>
                        <span className="text-label-caps font-bold text-error">{aiThreatLevel}</span>
                      </div>
                      <div className="bg-surface-variant p-2 rounded flex flex-col items-center border border-outline-variant">
                        <span className="text-data-mono text-[10px] opacity-60">Confidence</span>
                        <span className="text-label-caps font-bold text-tertiary">HIGH</span>
                      </div>
                      <div className="bg-surface-variant p-2 rounded flex flex-col items-center border border-outline-variant">
                        <span className="text-data-mono text-[10px] opacity-60">AI Model</span>
                        <span className="text-label-caps font-bold">V-NET 4.0</span>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-4">
                    <button 
                      onClick={() => setStep(2)} 
                      className="flex-1 py-4 border border-outline-variant text-on-surface font-bold rounded-xl active:scale-95 transition-transform"
                    >
                      BACK
                    </button>
                    
                    {!imageData ? (
                      <button 
                        onClick={() => setStep(4)} 
                        className="flex-[2] py-4 bg-surface-variant text-on-surface font-bold rounded-xl active:scale-95 transition-transform border border-outline-variant"
                      >
                        SKIP MEDIA: GO TO REVIEW
                      </button>
                    ) : !hasScanned ? (
                      <button 
                        disabled={isScanning}
                        onClick={runAISimulation} 
                        className="flex-[2] py-4 bg-tertiary-container text-on-tertiary-container font-bold rounded-xl active:scale-95 transition-transform flex items-center justify-center gap-2"
                      >
                        {isScanning ? 'RUNNING DETECTOR...' : 'RUN AI DETECTION'}
                      </button>
                    ) : (
                      <button 
                        onClick={() => setStep(4)} 
                        className="flex-[2] py-4 bg-primary text-on-primary font-bold rounded-xl active:scale-95 transition-transform"
                      >
                        REVIEW SUMMARY
                      </button>
                    )}
                  </div>
                </section>
              )}

              {/* Step 4: Summary & Submit */}
              {step === 4 && (
                <section className="space-y-6">
                  {sosStatus === 'sending' ? (
                    <div className="p-8 border border-outline-variant rounded-xl bg-surface-container flex flex-col items-center justify-center text-center space-y-4">
                      <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                      <h3 className="text-headline-md font-bold text-primary">TRANSMITTING SOS BEACON</h3>
                      <p className="text-on-surface-variant text-sm">Locking coordinates and generating rescue dispatch details...</p>
                    </div>
                  ) : sosStatus === 'success' ? (
                    <div className="p-8 border border-tertiary/40 rounded-xl bg-surface-container flex flex-col items-center justify-center text-center space-y-4 border-2">
                      <span className="material-symbols-outlined text-tertiary text-6xl">verified</span>
                      <h3 className="text-headline-md font-bold text-tertiary">SOS BEACON ACTIVE</h3>
                      <p className="text-on-surface-variant text-sm">Dispatch centers notified. Real-time rescue operators en-route.</p>
                    </div>
                  ) : (
                    <>
                      <div className="p-6 border-2 border-primary-container rounded-xl bg-surface-container-high space-y-4">
                        <div className="flex justify-between items-start">
                          <h1 className="text-headline-lg-mobile font-headline-lg text-primary">Emergency Summary</h1>
                          <span className="px-3 py-1 bg-error-container text-on-error-container text-label-caps font-label-caps rounded-full border border-error">
                            {hasScanned ? 'SEVERITY: CRITICAL' : 'SEVERITY: PENDING EVAL'}
                          </span>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center gap-4">
                            {previewUrl && (
                              <div className="w-16 h-16 rounded bg-surface border border-outline-variant overflow-hidden flex-shrink-0">
                                <img className="w-full h-full object-cover" src={previewUrl} alt="Thumbnail" />
                              </div>
                            )}
                            <div className="flex-1">
                              <span className="text-label-caps font-label-caps opacity-60 block">AI SENTIMENT ANALYSIS</span>
                              <div className="w-full h-2 bg-surface-variant rounded-full mt-1 overflow-hidden">
                                <div className="h-full bg-primary-container" style={{ width: hasScanned ? '88%' : '50%' }}></div>
                              </div>
                              <span className="text-data-mono text-xs text-primary mt-1 block">
                                Urgency: {hasScanned ? '88%' : '50%'} | Distress: High | Structural Damage: Likely
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-xs font-data-mono">
                            <div className="p-3 border border-outline-variant rounded bg-surface">
                              <span className="opacity-40 block mb-1">LOCATION</span>
                              {locationCoords.lat.toFixed(4)}° N, {locationCoords.lon.toFixed(4)}° E
                            </div>
                            <div className="p-3 border border-outline-variant rounded bg-surface">
                              <span className="opacity-40 block mb-1">DISASTER TYPE</span>
                              {disasterCategory.toUpperCase()}
                            </div>
                          </div>

                          {situationReport && (
                            <div className="p-3 border border-outline-variant rounded bg-surface text-xs">
                              <span className="opacity-40 block mb-1">SITREP NOTES</span>
                              {situationReport}
                            </div>
                          )}
                        </div>
                      </div>

                      {sosStatus === 'error' && (
                        <div className="p-3 bg-red-950/40 border border-red-500/30 text-red-400 rounded-lg text-sm">
                          Error submitting: {sosError}
                        </div>
                      )}

                      <div className="flex flex-col gap-3">
                        <button 
                          onClick={handleSubmitEmergency}
                          className="w-full py-5 bg-primary-container text-on-primary-container font-bold text-lg rounded-xl active:scale-95 transition-transform flex items-center justify-center gap-2 shadow-2xl shadow-primary-container/20"
                        >
                          <span className="material-symbols-outlined">bolt</span>
                          SUBMIT EMERGENCY
                        </button>
                        <button 
                          onClick={() => setStep(3)} 
                          className="w-full py-3 border border-outline-variant text-on-surface-variant font-bold rounded-xl"
                        >
                          EDIT DETAILS
                        </button>
                      </div>
                    </>
                  )}
                </section>
              )}

            </div>
          </div>
        )}

        {/* TAB 2: Live Disaster Map */}
        {activeTab === 'map' && (
          <div className="h-[calc(100vh-200px)] py-4">
            <h2 className="text-headline-md font-bold mb-3 text-primary">Live Operations Map</h2>
            <div className="w-full h-full rounded-2xl overflow-hidden border border-outline-variant relative">
              <LeafletMap center={[locationCoords.lat, locationCoords.lon]} zoom={11} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  attribution='&copy; CARTO'
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />
                <Marker position={[locationCoords.lat, locationCoords.lon]} />
              </LeafletMap>
              
              {/* Bottom Sheet Status overlay */}
              <div className="absolute bottom-4 left-4 z-[1000] glass-overlay p-4 rounded-xl border border-outline-variant max-w-xs space-y-2">
                <span className="text-label-caps font-bold text-primary block">AT A GLANCE STATUS</span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-surface-container-low p-2 rounded">
                    <p className="text-on-surface-variant">ACTIVE ALERTS</p>
                    <p className="text-lg font-bold text-primary">12</p>
                  </div>
                  <div className="bg-surface-container-low p-2 rounded">
                    <p className="text-on-surface-variant">RESCUE UNITS</p>
                    <p className="text-lg font-bold text-secondary">48</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Dashboard Info Hub */}
        {activeTab === 'dashboard' && (
          <div className="max-w-2xl mx-auto py-6 space-y-6">
            <h2 className="text-headline-lg font-headline-lg text-primary">Crisis Info & Broadcasts</h2>
            
            <div className="p-6 border border-outline-variant bg-surface-container rounded-xl space-y-4">
              <div className="flex items-center gap-3 text-primary">
                <span className="material-symbols-outlined text-3xl">rss_feed</span>
                <h3 className="text-headline-md font-bold">📡 Satellite Broadcasts</h3>
              </div>
              <p className="text-on-surface-variant leading-relaxed">
                Emergency support teams have fully deployed in the Punjab region. Check network status indicators routinely. In case of localized infrastructure dropouts, relocate to elevated dry land. Keep communication frequencies clear for emergency dispatch vehicles.
              </p>
            </div>

            <div className="p-6 border border-outline-variant bg-surface-container rounded-xl space-y-4">
              <h3 className="text-headline-md font-bold text-primary">SUPPORT HOTLINES</h3>
              <div className="divide-y divide-outline-variant font-data-mono text-sm">
                <div className="flex justify-between py-3">
                  <span>Punjab Disaster Control</span>
                  <strong className="text-primary font-bold">1078</strong>
                </div>
                <div className="flex justify-between py-3">
                  <span>Emergency Operations Center</span>
                  <strong className="text-primary font-bold">0172-2740397</strong>
                </div>
                <div className="flex justify-between py-3">
                  <span>Medical Response Services</span>
                  <strong className="text-primary font-bold">108</strong>
                </div>
              </div>
            </div>

            <div className="p-6 border border-outline-variant bg-surface-container rounded-xl space-y-4">
              <h3 className="text-headline-md font-bold text-primary">USER PROFILE DETAILS</h3>
              <div className="grid grid-cols-2 gap-4 text-xs font-data-mono text-on-surface-variant">
                <div>
                  <span className="opacity-50 block mb-1">OPERATOR NAME</span>
                  <span className="text-on-surface font-bold text-sm">{user?.firstName || 'Citizen'} {user?.lastName || ''}</span>
                </div>
                <div>
                  <span className="opacity-50 block mb-1">EMAIL IDENTIFIER</span>
                  <span className="text-on-surface font-bold text-sm">{user?.username}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Inventory (Relief Requests) */}
        {activeTab === 'inventory' && (
          <div className="max-w-4xl mx-auto py-6 space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-headline-lg font-headline-lg text-primary">Supply Requests</h2>
                <p className="text-on-surface-variant">Request relief items and confirm delivery status.</p>
              </div>
              <button 
                onClick={() => setShowRequestForm(true)}
                className="bg-primary text-on-primary font-bold px-6 py-3 rounded-xl flex items-center gap-2 hover:brightness-110 active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined">add</span>
                REQUEST SUPPLIES
              </button>
            </div>

            <div className="border border-outline-variant bg-surface-container rounded-xl overflow-hidden">
              <div className="p-4 bg-surface-variant/20 border-b border-outline-variant">
                <span className="text-label-caps font-bold">LOGGED REQUESTS ({requests.length})</span>
              </div>
              
              <div className="divide-y divide-outline-variant max-h-[500px] overflow-y-auto">
                {requests.length === 0 ? (
                  <div className="p-8 text-center text-on-surface-variant">
                    No supply requests logged. Request item reserves using the button above.
                  </div>
                ) : (
                  requests.map((req) => (
                    <div key={req._id} className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-surface-variant/15 transition-all">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-on-surface text-base">{req.itemName}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            req.priority === 'urgent' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                          }`}>
                            {req.priority?.toUpperCase()}
                          </span>
                        </div>
                        <div className="text-xs text-on-surface-variant mt-1">
                          Category: {req.category} | Quantity: <strong>{req.quantity}</strong> | Requested on: {new Date(req.createdAt).toLocaleDateString()}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                        <div className="text-right">
                          <span className="text-[10px] text-on-surface-variant block uppercase">STATUS</span>
                          <span className={`px-2.5 py-1 rounded text-xs font-bold ${
                            req.status === 'fulfilled' || req.status === 'delivered' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                            req.status === 'rejected' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                            'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                          }`}>
                            {req.status?.toUpperCase()}
                          </span>
                        </div>

                        {req.status === 'delivered' && (
                          <button
                            onClick={() => handleFulfillRequest(req._id)}
                            className="bg-green-600 hover:bg-green-500 text-white font-bold py-1.5 px-3 rounded text-xs transition-all active:scale-95 flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-sm">check_circle</span>
                            CONFIRM RECEIPT
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Request Supplies Overlay Modal */}
      {showRequestForm && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card p-6 rounded-xl border border-outline-variant max-w-md w-full bg-slate-900 text-on-surface space-y-4 mx-4">
            <div className="flex justify-between items-center border-b border-outline-variant pb-2">
              <h3 className="text-headline-md font-bold text-primary">Request Relief Supplies</h3>
              <button onClick={() => setShowRequestForm(false)} className="text-on-surface-variant hover:text-primary">✕</button>
            </div>
            
            <form onSubmit={handleRequestSubmit} className="space-y-4">
              <div>
                <label className="text-label-caps font-label-caps opacity-80 block mb-1">Item Description</label>
                <input 
                  type="text" 
                  className="w-full bg-surface border border-outline-variant rounded-lg p-2 text-sm focus:ring-1 focus:ring-primary focus:border-transparent outline-none" 
                  value={requestForm.itemName} 
                  onChange={e => setRequestForm({...requestForm, itemName: e.target.value})} 
                  placeholder="e.g. Water bottles, Insulin" 
                  required 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-label-caps font-label-caps opacity-80 block mb-1">Category</label>
                  <select 
                    className="w-full bg-surface border border-outline-variant rounded-lg p-2 text-sm focus:ring-1 focus:ring-primary focus:border-transparent outline-none text-on-surface" 
                    value={requestForm.category} 
                    onChange={e => setRequestForm({...requestForm, category: e.target.value})}
                  >
                    <option value="Water">Water</option>
                    <option value="Food">Food</option>
                    <option value="Medical">Medical</option>
                    <option value="Shelter">Shelter</option>
                    <option value="Equipment">Equipment</option>
                  </select>
                </div>
                <div>
                  <label className="text-label-caps font-label-caps opacity-80 block mb-1">Quantity</label>
                  <input 
                    type="number" 
                    className="w-full bg-surface border border-outline-variant rounded-lg p-2 text-sm focus:ring-1 focus:ring-primary focus:border-transparent outline-none" 
                    value={requestForm.quantity} 
                    onChange={e => setRequestForm({...requestForm, quantity: parseInt(e.target.value) || 0})} 
                    required 
                  />
                </div>
              </div>

              <div>
                <label className="text-label-caps font-label-caps opacity-80 block mb-1">Priority</label>
                <select 
                  className="w-full bg-surface border border-outline-variant rounded-lg p-2 text-sm focus:ring-1 focus:ring-primary focus:border-transparent outline-none text-on-surface" 
                  value={requestForm.priority} 
                  onChange={e => setRequestForm({...requestForm, priority: e.target.value})}
                >
                  <option value="normal">Normal (Standard relief cycle)</option>
                  <option value="urgent">Urgent (Immediate drop-off needed)</option>
                </select>
              </div>

              <div className="flex gap-4 pt-2">
                <button type="submit" className="flex-1 py-3 bg-primary text-on-primary font-bold rounded-lg active:scale-95 transition-transform text-sm">
                  Submit Request
                </button>
                <button type="button" onClick={() => setShowRequestForm(false)} className="flex-1 py-3 border border-outline-variant text-on-surface font-bold rounded-lg active:scale-95 transition-transform text-sm">
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
