import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AdminDashboard } from './components/AdminDashboard';
import { LandingPage } from './components/LandingPage';
import { ManagerDashboard } from './components/ManagerDashboard';
import { VolunteerDashboard } from './components/VolunteerDashboard';
import { CitizenDashboard } from './components/CitizenDashboard';
import { Activity, ShieldAlert, Heart, MapPin, User, Lock, Mail } from 'lucide-react';
import './App.css';

// Protected Route Wrapper
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center', backgroundColor: '#060816' }}>
        <div className="pulse-dot" style={{ width: '20px', height: '20px' }}></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Support legacy mappings and robust array checks
  const normalizedUserRoles = (user.roles || []).map(r => r === 'refugee' ? 'Victim' : r);
  const normalizedAllowedRoles = allowedRoles.map(r => r === 'refugee' ? 'Victim' : r);

  const hasAccess = normalizedUserRoles.some(role => normalizedAllowedRoles.includes(role));

  if (allowedRoles && allowedRoles.length > 0 && !hasAccess) {
    console.warn(`Access denied. User roles: ${normalizedUserRoles}, Allowed roles: ${normalizedAllowedRoles}`);
    return <Navigate to="/" replace />;
  }

  return children;
};

// Login Page Component
const Login = () => {
  const { login, error } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const result = await login(username, password);
    setSubmitting(false);
    if (result.success) {
      navigate('/dashboard');
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="card" style={{ width: '100%', maxWidth: '380px', padding: '2rem', border: '1px solid var(--border-mid)', background: 'rgba(10, 16, 32, 0.7)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div onClick={() => navigate('/')} style={{ display: 'inline-flex', background: 'rgba(59, 130, 246, 0.1)', padding: '0.75rem', borderRadius: '50%', color: 'var(--primary)', marginBottom: '0.75rem', cursor: 'pointer' }}>
            <Activity size={32} />
          </div>
          <h2 onClick={() => navigate('/')} style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '-0.03em', cursor: 'pointer', transition: 'opacity 0.2s' }} onMouseOver={e => e.target.style.opacity = 0.8} onMouseOut={e => e.target.style.opacity = 1}>
            AidFlow AI v2
          </h2>
          <p className="text-muted" style={{ fontSize: '12px', marginTop: '0.25rem' }}>Crisis Response Command Portal</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="text-muted" style={{ fontSize: '11px', display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>User Identifier (Email)</label>
            <div style={{ position: 'relative' }}>
              <Mail size={14} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                className="input" 
                style={{ paddingLeft: '2.5rem' }}
                value={username} 
                onChange={e => setUsername(e.target.value)} 
                placeholder="admin@edu.in" 
                required 
              />
            </div>
          </div>

          <div>
            <label className="text-muted" style={{ fontSize: '11px', display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Access Key (Password)</label>
            <div style={{ position: 'relative' }}>
              <Lock size={14} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="password" 
                className="input" 
                style={{ paddingLeft: '2.5rem' }}
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                placeholder="••••••••••••" 
                required 
              />
            </div>
          </div>

          {error && (
            <div style={{ fontSize: '12px', color: 'var(--severity-critical)', background: 'rgba(239, 68, 68, 0.1)', padding: '8px', borderRadius: '6px', border: '1px solid rgba(239,68,68,0.2)' }}>
              {error}
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={submitting}>
            {submitting ? 'Authenticating...' : 'Establish Connection'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '12px' }}>
          <span className="text-muted">New deployment operator? </span>
          <button onClick={() => navigate('/register')} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }}>
            Register here
          </button>
        </div>
      </div>
    </div>
  );
};

// Register Page Component
const Register = () => {
  const { register, error } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    username: '', password: '', firstName: '', lastName: '',
    country: 'India', state: 'Punjab', city: 'Chandigarh',
    address: '', companyType: 'Individual', occupation: '',
    roles: ['Volunteer'], verificationDetails: ''
  });
  const [isAdminRegistration, setIsAdminRegistration] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRoleChange = (e) => {
    const value = e.target.value;
    if (e.target.checked) {
      setFormData({ ...formData, roles: [...formData.roles, value] });
    } else {
      setFormData({ ...formData, roles: formData.roles.filter(r => r !== value) });
    }
  };

  const handleAdminRoleChange = (e) => {
    setFormData({ ...formData, roles: [e.target.value] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const result = await register(formData);
    setSubmitting(false);
    if (result.success) {
      navigate('/dashboard');
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center', padding: '1rem', overflowY: 'auto' }}>
      <div className="card" style={{ width: '100%', maxWidth: '480px', padding: '2rem', border: '1px solid var(--border-mid)', background: 'rgba(10, 16, 32, 0.7)', margin: 'auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h2 onClick={() => navigate('/')} style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '-0.02em', cursor: 'pointer', transition: 'opacity 0.2s' }} onMouseOver={e => e.target.style.opacity = 0.8} onMouseOut={e => e.target.style.opacity = 1}>
            Field Operator Registration
          </h2>
          <p className="text-muted" style={{ fontSize: '11px', marginTop: '0.25rem' }}>Register credentials to join relief networks</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <div>
              <label className="text-muted" style={{ fontSize: '10px', display: 'block', marginBottom: '2px' }}>First Name</label>
              <input type="text" name="firstName" className="input" onChange={handleChange} required />
            </div>
            <div>
              <label className="text-muted" style={{ fontSize: '10px', display: 'block', marginBottom: '2px' }}>Last Name</label>
              <input type="text" name="lastName" className="input" onChange={handleChange} required />
            </div>
          </div>

          <div>
            <label className="text-muted" style={{ fontSize: '10px', display: 'block', marginBottom: '2px' }}>Email Address</label>
            <input type="email" name="username" className="input" onChange={handleChange} placeholder="name@domain.com" required />
          </div>

          <div>
            <label className="text-muted" style={{ fontSize: '10px', display: 'block', marginBottom: '2px' }}>Password</label>
            <input type="password" name="password" className="input" onChange={handleChange} required />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label className="text-muted" style={{ fontSize: '10px', display: 'block', marginBottom: '4px' }}>
              <input type="checkbox" checked={isAdminRegistration} onChange={() => setIsAdminRegistration(!isAdminRegistration)} style={{ marginRight: '4px' }} />
              I am applying for an Administrative Role
            </label>
            
            {!isAdminRegistration ? (
              <div>
                <label className="text-muted" style={{ fontSize: '10px', display: 'block', marginBottom: '2px' }}>General Roles (Select all that apply)</label>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  {['Victim', 'Volunteer', 'Donor', 'Reporter', 'Community Member'].map(role => (
                    <label key={role} style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <input type="checkbox" value={role} checked={formData.roles.includes(role)} onChange={handleRoleChange} />
                      {role}
                    </label>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div>
                  <label className="text-muted" style={{ fontSize: '10px', display: 'block', marginBottom: '2px' }}>Admin Role</label>
                  <select className="input select" onChange={handleAdminRoleChange} value={formData.roles[0] || 'Admin'}>
                    <option value="Admin">Admin</option>
                    <option value="Branch Manager">Branch Manager</option>
                    <option value="Super Admin">Super Admin</option>
                  </select>
                </div>
                <div>
                  <label className="text-muted" style={{ fontSize: '10px', display: 'block', marginBottom: '2px' }}>Verification Details (e.g. LinkedIn URL)</label>
                  <input type="text" name="verificationDetails" className="input" onChange={handleChange} required={isAdminRegistration} placeholder="https://linkedin.com/in/..." />
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <div>
              <label className="text-muted" style={{ fontSize: '10px', display: 'block', marginBottom: '2px' }}>Occupation</label>
              <input type="text" name="occupation" className="input" onChange={handleChange} placeholder="e.g. Student, Driver" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '0.5rem' }}>
            <div>
              <label className="text-muted" style={{ fontSize: '10px', display: 'block', marginBottom: '2px' }}>District / City</label>
              <input type="text" name="city" className="input" value={formData.city} onChange={handleChange} required />
            </div>
            <div>
              <label className="text-muted" style={{ fontSize: '10px', display: 'block', marginBottom: '2px' }}>State</label>
              <input type="text" name="state" className="input" value={formData.state} onChange={handleChange} required />
            </div>
          </div>

          <div>
            <label className="text-muted" style={{ fontSize: '10px', display: 'block', marginBottom: '2px' }}>Physical Address</label>
            <input type="text" name="address" className="input" onChange={handleChange} placeholder="Street, landmark, sector details" required />
          </div>

          {error && (
            <div style={{ fontSize: '11px', color: 'var(--severity-critical)', background: 'rgba(239, 68, 68, 0.1)', padding: '6px', borderRadius: '4px' }}>
              {error}
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={submitting}>
            {submitting ? 'Registering...' : 'Register Operator'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '12px' }}>
          <span className="text-muted">Already registered? </span>
          <button onClick={() => navigate('/login')} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }}>
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
};

// Dashboard Router Switchboard
const DashboardRouter = () => {
  const { user, logout } = useAuth();
  const [currentTab, setCurrentTab] = useState('');
  const [isLightMode, setIsLightMode] = useState(false);
  const navigate = useNavigate();

  const toggleTheme = () => {
    const newMode = !isLightMode;
    setIsLightMode(newMode);
    if (newMode) {
      document.body.classList.add('light');
    } else {
      document.body.classList.remove('light');
    }
  };

  // Set default tab based on user class/roles
  useEffect(() => {
    if (user && user.roles) {
      if (user.userClass === 'Admin' && user.roles.some(r => ['Super Admin', 'Admin'].includes(r))) setCurrentTab('dashboard');
      else if (user.roles.includes('Branch Manager')) setCurrentTab('inventory');
      else if (user.roles.includes('Volunteer')) setCurrentTab('map');
      else setCurrentTab('report');
    }
  }, [user]);

  if (!user) return <Navigate to="/login" replace />;
  
  if (!currentTab) {
    return (
      <div style={{ display: 'flex', height: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center', backgroundColor: '#060816' }}>
        <div className="pulse-dot" style={{ width: '20px', height: '20px' }}></div>
      </div>
    );
  }

  const renderView = () => {
    const isAdmin = user.userClass === 'Admin';
    const isVolunteer = user.roles.includes('Volunteer');
    const isVictim = user.roles.includes('Victim') || user.roles.includes('Reporter') || user.roles.includes('Donor');

    if (isAdmin) {
      switch (currentTab) {
        case 'map': return <VolunteerDashboard subView="map" setActiveTab={setCurrentTab} />;
        case 'report': return <CitizenDashboard subView="report" setActiveTab={setCurrentTab} />;
        case 'dashboard': return <AdminDashboard setActiveTab={setCurrentTab} />;
        case 'inventory': return <ManagerDashboard setActiveTab={setCurrentTab} />;
        default: return null;
      }
    }

    if (isVolunteer && (currentTab === 'map' || currentTab === 'dashboard' || currentTab === 'inventory')) {
      return <VolunteerDashboard subView={currentTab} setActiveTab={setCurrentTab} />;
    }

    if (isVictim || currentTab === 'report') {
      return <CitizenDashboard subView={currentTab} setActiveTab={setCurrentTab} />;
    }

    return null;
  };

  return (
    <div className="bg-background min-h-screen flex flex-col text-on-surface">
      {/* TopAppBar */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-margin-mobile h-16 bg-surface border-b border-outline-variant">
        <div className="flex items-center gap-2 cursor-pointer transition-opacity hover:opacity-80" onClick={() => navigate('/')}>
          <span className="material-symbols-outlined text-primary">wifi</span>
          <span className="text-headline-md font-headline-md font-bold text-primary">AidFlow</span>
        </div>
        
        {/* Desktop Navbar */}
        <div className="hidden md:flex items-center gap-6">
          <button 
            onClick={() => setCurrentTab('map')} 
            className={`text-label-caps font-label-caps font-bold transition-all border-b-2 py-1 px-1 ${
              currentTab === 'map' ? 'text-primary border-primary' : 'text-on-surface-variant border-transparent hover:text-primary'
            }`}
          >
            LIVE MAP
          </button>
          <button 
            onClick={() => setCurrentTab('report')} 
            className={`text-label-caps font-label-caps font-bold transition-all border-b-2 py-1 px-1 ${
              currentTab === 'report' ? 'text-primary border-primary' : 'text-on-surface-variant border-transparent hover:text-primary'
            }`}
          >
            REPORT
          </button>
          <button 
            onClick={() => setCurrentTab('dashboard')} 
            className={`text-label-caps font-label-caps font-bold transition-all border-b-2 py-1 px-1 ${
              currentTab === 'dashboard' ? 'text-primary border-primary' : 'text-on-surface-variant border-transparent hover:text-primary'
            }`}
          >
            DASHBOARD
          </button>
          <button 
            onClick={() => setCurrentTab('inventory')} 
            className={`text-label-caps font-label-caps font-bold transition-all border-b-2 py-1 px-1 ${
              currentTab === 'inventory' ? 'text-primary border-primary' : 'text-on-surface-variant border-transparent hover:text-primary'
            }`}
          >
            INVENTORY
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={toggleTheme}
            className="material-symbols-outlined p-2 rounded-full hover:bg-surface-variant text-on-surface-variant hover:text-primary transition-all"
            title="Toggle Theme"
          >
            {isLightMode ? 'dark_mode' : 'light_mode'}
          </button>
          <span className="hidden sm:inline-block text-xs font-mono bg-surface-variant/30 text-on-surface-variant px-3 py-1 rounded-full border border-outline-variant uppercase">
            {user.roles && user.roles.length > 0 ? user.roles[0] : 'User'}
          </span>
          <button 
            onClick={logout} 
            className="material-symbols-outlined p-2 rounded-full hover:bg-surface-variant text-on-surface-variant hover:text-primary transition-all"
            title="Disconnect"
          >
            logout
          </button>
          <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container font-bold text-xs uppercase border border-outline-variant">
            {user.firstName ? user.firstName.substring(0, 2) : (user.roles && user.roles.length > 0 ? user.roles[0].substring(0, 2) : 'US')}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-grow pt-16 pb-20 md:pb-4">
        {renderView()}
      </div>

      {/* Mobile BottomNavBar */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-margin-mobile py-2 bg-surface border-t border-outline-variant md:hidden">
        <div 
          onClick={() => setCurrentTab('map')}
          className={`flex flex-col items-center justify-center px-4 py-1 cursor-pointer transition-all ${
            currentTab === 'map' ? 'bg-primary-container text-on-primary-container rounded-xl' : 'text-on-surface-variant hover:text-primary'
          }`}
        >
          <span className="material-symbols-outlined">map</span>
          <span className="text-label-caps font-label-caps">Live Map</span>
        </div>
        
        <div 
          onClick={() => setCurrentTab('report')}
          className={`flex flex-col items-center justify-center px-4 py-1 cursor-pointer transition-all ${
            currentTab === 'report' ? 'bg-primary-container text-on-primary-container rounded-xl' : 'text-on-surface-variant hover:text-primary'
          }`}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: currentTab === 'report' ? "'FILL' 1" : undefined }}>emergency</span>
          <span className="text-label-caps font-label-caps">Report</span>
        </div>

        <div 
          onClick={() => setCurrentTab('dashboard')}
          className={`flex flex-col items-center justify-center px-4 py-1 cursor-pointer transition-all ${
            currentTab === 'dashboard' ? 'bg-primary-container text-on-primary-container rounded-xl' : 'text-on-surface-variant hover:text-primary'
          }`}
        >
          <span className="material-symbols-outlined">dashboard</span>
          <span className="text-label-caps font-label-caps">Dashboard</span>
        </div>

        <div 
          onClick={() => setCurrentTab('inventory')}
          className={`flex flex-col items-center justify-center px-4 py-1 cursor-pointer transition-all ${
            currentTab === 'inventory' ? 'bg-primary-container text-on-primary-container rounded-xl' : 'text-on-surface-variant hover:text-primary'
          }`}
        >
          <span className="material-symbols-outlined">inventory_2</span>
          <span className="text-label-caps font-label-caps">Inventory</span>
        </div>
      </nav>
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={['Super Admin', 'Admin', 'Branch Manager', 'Volunteer', 'Victim', 'Reporter', 'Donor', 'Community Member']}>
              <DashboardRouter />
            </ProtectedRoute>
          } />

          <Route path="/" element={<LandingPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;
