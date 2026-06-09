import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const LandingPage = () => {
  const navigate = useNavigate();
  const [isLightMode, setIsLightMode] = React.useState(false);

  React.useEffect(() => {
    setIsLightMode(document.body.classList.contains('light'));
  }, []);

  const toggleTheme = () => {
    const newMode = !isLightMode;
    setIsLightMode(newMode);
    if (newMode) {
      document.body.classList.add('light');
    } else {
      document.body.classList.remove('light');
    }
  };

  useEffect(() => {
    // Simple parallax or fade-in effects for command-center feel
    const handleScroll = () => {
      const panels = document.querySelectorAll('.glass-panel');
      panels.forEach(panel => {
        const rect = panel.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.9) {
          panel.style.opacity = '1';
          panel.style.transform = 'translateY(0)';
        }
      });
    };

    document.addEventListener('scroll', handleScroll);
    
    // Initialize state
    document.querySelectorAll('.glass-panel').forEach(p => {
      p.style.opacity = '0';
      p.style.transform = 'translateY(20px)';
      p.style.transition = 'all 0.6s cubic-bezier(0.2, 0, 0, 1)';
    });
    
    setTimeout(() => {
      window.dispatchEvent(new Event('scroll'));
    }, 100);

    return () => {
      document.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleGetStarted = () => {
    navigate('/dashboard');
  };

  return (
    <div className="font-body-md text-on-surface bg-background text-on-surface overflow-x-hidden min-h-screen">
      {/* TopAppBar */}
      <header className="bg-surface/80 backdrop-blur-md dark:bg-surface/80 docked full-width fixed top-0 left-0 z-50 border-b border-outline-variant dark:border-outline-variant transition-all duration-300 w-full">
        <nav className="flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop py-4 max-w-container-max mx-auto">
          <div className="flex items-center gap-3">
            <img alt="AidFlow Logo" className="h-8 w-8" src="/logo.svg" />
            <span className="font-display-lg text-headline-md font-bold tracking-tight text-primary dark:text-primary-fixed">ReliefCommand</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a className="font-label-caps text-label-caps text-primary dark:text-primary-fixed border-b-2 border-primary transition-colors" href="#mission">Mission</a>
            <a className="font-label-caps text-label-caps text-on-surface-variant dark:text-on-surface-variant hover:text-primary dark:hover:text-primary-fixed transition-colors" href="#features">Features</a>
            <a className="font-label-caps text-label-caps text-on-surface-variant dark:text-on-surface-variant hover:text-primary dark:hover:text-primary-fixed transition-colors" href="#journey">Journey</a>
            <a className="font-label-caps text-label-caps text-on-surface-variant dark:text-on-surface-variant hover:text-primary dark:hover:text-primary-fixed transition-colors" href="#stats">Impact</a>
            <button onClick={toggleTheme} className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors ml-4" title="Toggle Theme">
              {isLightMode ? 'dark_mode' : 'light_mode'}
            </button>
          </div>
          <div className="flex items-center gap-6">
            <button 
              onClick={() => navigate('/login')}
              className="text-on-surface hover:text-primary font-label-caps text-label-caps font-bold transition-all relative group"
            >
              Sign In
              <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-primary transition-all duration-300 group-hover:w-full"></span>
            </button>
            <button 
              onClick={() => navigate('/register')}
              className="btn-animated-register px-6 py-2 rounded font-label-caps text-label-caps font-bold"
            >
              Register
            </button>
          </div>
        </nav>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative min-h-[90vh] flex items-center pt-20 overflow-hidden hero-gradient">
          <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop grid md:grid-cols-2 gap-12 items-center">
            <div className="z-10">
              <span className="font-data-mono text-data-mono text-secondary mb-4 block uppercase tracking-widest">Global Crisis Network</span>
              <h1 className="font-display-lg text-display-lg mb-6 leading-tight">Help. Hope. Action<br /><span className="text-primary">When It Matters Most.</span></h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant mb-8 max-w-xl">
                AidFlow is the mission-critical infrastructure for modern disaster response. Stay informed, coordinate localized relief, and bridge the gap between crisis and recovery in real-time.
              </p>
              <div className="flex flex-wrap gap-4">
                <button onClick={handleGetStarted} className="bg-[#2563EB] text-white px-8 py-4 rounded-lg font-bold flex items-center gap-2 hover:brightness-110 transition-all">
                  Get Started Now <span className="material-symbols-outlined">arrow_forward</span>
                </button>
                <button onClick={() => navigate('/dashboard')} className="border border-outline-variant px-8 py-4 rounded-lg font-bold text-on-surface hover:bg-surface-container transition-all">
                  Explore Features
                </button>
              </div>
              <div className="mt-12 flex items-center gap-6">
                <div className="flex -space-x-3">
                  <div className="h-10 w-10 rounded-full border-2 border-background bg-secondary-container flex items-center justify-center font-bold text-xs">UN</div>
                  <div className="h-10 w-10 rounded-full border-2 border-background bg-primary-container flex items-center justify-center font-bold text-xs">RC</div>
                  <div className="h-10 w-10 rounded-full border-2 border-background bg-tertiary-container flex items-center justify-center font-bold text-xs">WH</div>
                </div>
                <p className="font-label-caps text-label-caps text-on-surface-variant">Trusted by 200+ global relief agencies</p>
              </div>
            </div>
            <div className="relative flex justify-center items-center">
              <div className="absolute inset-0 bg-primary/10 blur-[100px] rounded-full"></div>
              {/* Phone Mockup Container */}
              <div className="relative z-10 w-[300px] h-[600px] bg-black rounded-[3rem] p-3 border-4 border-slate-800 shadow-2xl">
                <div className="bg-background w-full h-full rounded-[2.5rem] overflow-hidden relative">
                  <img alt="Emergency Alert on Phone" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB4a42SGhNht-fLBcnl8wFR472iVV_APKIBrL3yZhf4wua3aIX6fXh_NrgAPy8pITtb27ToJMu5XWyO7rSeICC26Cik8UvWE1_ST3hpwoOWtgbvT12w4ni8ZjeJRAWWjeaQzUHNU8eE-OUN-BNbILaUcFdM0UpRAShe1nH4LYwI1XOgDfsocLc8mjLEcpQPDtV-82r0O3clUTb5JdWXgS98OLGBi69OuuXK_0mv4qJDk6s8ALTdKSptlWEr8HdRTysQPV8c2T6vFTA" />
                  <div className="absolute top-0 w-full h-8 bg-black/20 backdrop-blur-sm flex justify-between px-6 pt-2 items-center">
                    <span className="text-[10px] font-bold">9:41</span>
                    <div className="flex gap-1">
                      <span className="material-symbols-outlined text-[12px]">signal_cellular_4_bar</span>
                      <span className="material-symbols-outlined text-[12px]">wifi</span>
                      <span className="material-symbols-outlined text-[12px]">battery_full</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section id="mission" className="py-24 bg-surface-container-low">
          <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div className="order-2 md:order-1">
                <div className="relative rounded-xl overflow-hidden shadow-2xl">
                  <img className="w-full h-auto grayscale-[0.2] hover:grayscale-0 transition-all duration-700" alt="Relief workers" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCHDZmSiPE50JU56S_s38LfQfpUyNMZfiDEdbawFcdRcp3T98F-fcyw7JeRv29PpU-jrYdF9P08FP-bwDrC0XVLcHRJCRnzJxGSKJo8Z1eOFAMgKN0yNiWs5Chp35c7Qgcz2t_alrmIr42MifQnaEhXJsbiv72xrKEltaJvs3Ied3V-ux9kZTV7VH7YRByGNcmPl0NaYeGZzyYvunl--FhAsc_kf2GCyOVMJSbdfbNJ4rtnaSEWU8NKT6uxYVu5h2OB3u7v2BruUHQ" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background/90 to-transparent">
                    <p className="font-data-mono text-data-mono text-tertiary">MISSION STATUS: ACTIVE</p>
                  </div>
                </div>
              </div>
              <div className="order-1 md:order-2">
                <h2 className="font-headline-lg text-headline-lg mb-6">Connecting Communities<br />During Crisis</h2>
                <p className="font-body-lg text-body-lg text-on-surface-variant mb-8">
                  In the chaos of a disaster, communication is a lifeline. AidFlow centralizes data from official sources, ground reports, and logistics networks to provide a single source of truth for responders and citizens alike.
                </p>
                <ul className="space-y-4">
                  <li className="flex items-start gap-4">
                    <div className="bg-secondary-container/20 p-2 rounded">
                      <span className="material-symbols-outlined text-secondary">verified_user</span>
                    </div>
                    <div>
                      <h4 className="font-bold">Verified Reporting</h4>
                      <p className="text-on-surface-variant text-sm">Every alert is cross-referenced with satellite data and local agencies.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <div className="bg-primary-container/20 p-2 rounded">
                      <span className="material-symbols-outlined text-primary">speed</span>
                    </div>
                    <div>
                      <h4 className="font-bold">Real-Time Routing</h4>
                      <p className="text-on-surface-variant text-sm">Dynamic supply chain adjustments based on road closures and weather.</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Features Bento Grid */}
        <section id="features" className="py-24 bg-background">
          <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
            <div className="text-center mb-16">
              <h2 className="font-headline-lg text-headline-lg mb-4">Command & Control Infrastructure</h2>
              <p className="text-on-surface-variant max-w-2xl mx-auto">High-performance tools engineered for the most demanding environments on Earth.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-gutter">
              {/* Feature Card 1 */}
              <div onClick={() => navigate('/dashboard')} className="md:col-span-2 lg:col-span-2 glass-panel p-8 rounded-xl severity-critical flex flex-col justify-between group hover:border-primary transition-all cursor-pointer">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="material-symbols-outlined text-4xl text-primary">notifications_active</span>
                    <span className="font-data-mono text-[10px] border border-primary text-primary px-2 py-1 rounded uppercase">System Critical</span>
                  </div>
                  <h3 className="font-headline-md text-headline-md mb-2">Smart Emergency Alerts</h3>
                  <p className="text-on-surface-variant mb-4">Hyper-local push notifications that guide users to safety with precision mapping and offline support.</p>
                </div>
                <div className="mt-4 flex gap-2">
                  <span className="px-2 py-1 bg-surface-container text-[10px] font-bold rounded">GEO-FENCING</span>
                  <span className="px-2 py-1 bg-surface-container text-[10px] font-bold rounded">OFFLINE MAPS</span>
                </div>
              </div>
              {/* Feature Card 2 */}
              <div onClick={() => navigate('/dashboard')} className="glass-panel p-8 rounded-xl flex flex-col group hover:border-secondary transition-all cursor-pointer">
                <span className="material-symbols-outlined text-4xl text-secondary mb-4">map</span>
                <h3 className="font-bold text-xl mb-2">Live Incident Map</h3>
                <p className="text-on-surface-variant text-sm">Real-time visualization of wildfire perimeters, flood zones, and power outages using OSM and proprietary telemetry.</p>
              </div>
              {/* Feature Card 3 */}
              <div onClick={() => navigate('/dashboard')} className="glass-panel p-8 rounded-xl flex flex-col group hover:border-tertiary transition-all cursor-pointer">
                <span className="material-symbols-outlined text-4xl text-tertiary mb-4">inventory_2</span>
                <h3 className="font-bold text-xl mb-2">Inventory Tracking</h3>
                <p className="text-on-surface-variant text-sm">Blockchain-backed supply chain ledger ensures aid reaches the intended destination without loss.</p>
              </div>
              {/* Feature Card 4 */}
              <div onClick={() => navigate('/dashboard')} className="glass-panel p-8 rounded-xl md:col-span-1 lg:col-span-1 flex flex-col group hover:border-outline transition-all cursor-pointer">
                <span className="material-symbols-outlined text-4xl text-outline mb-4">volunteer_activism</span>
                <h3 className="font-bold text-xl mb-2">Volunteer Deployment</h3>
                <p className="text-on-surface-variant text-sm">Automated skills matching and background verification for rapid on-site coordination.</p>
              </div>
              {/* Feature Card 5: Large Image Feature */}
              <div className="md:col-span-2 lg:col-span-3 glass-panel overflow-hidden rounded-xl relative group">
                <img className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-1000" alt="Disaster Response Center" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDZzlVi8y4OYG32oPioyFd8g-Squc8sUhwjRb23bGnTi54_69U0IP4bIRXRuCsCLq-UwYNqd6APsqdSNkImlSUeZyUe9JvAXrewBjgAPVPcM_BPPMMqfAhE3WILwWTgimRpCyQWF0uUEkrABumZwLrBdP7iFZYCGzXdhZQgRv_lgrVO17D4pLYMtGcCjNRpSbXefXeNtMG4RpKRd24x_SnHySGQp7vyA0JuYpAVd8g3MNAbUumrejCmydqL_LTGZ5-nmDJk5Tc_ZgE" />
                <div className="absolute inset-0 bg-gradient-to-r from-background via-background/40 to-transparent p-12 flex flex-col justify-center">
                  <h3 className="font-headline-lg text-headline-lg mb-4 max-w-md">Global Resource Discovery</h3>
                  <p className="text-on-surface-variant mb-6 max-w-sm">Connect with local shelters, medical camps, and supply drops in seconds. AidFlow's intelligent routing optimizes every mile.</p>
                  <button onClick={() => navigate('/dashboard')} className="w-fit border border-primary text-primary px-6 py-2 rounded font-bold hover:bg-primary/10 transition-all cursor-pointer">Launch Registry</button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Journey Steps */}
        <section id="journey" className="py-24 bg-surface-container-low border-y border-outline-variant/30">
          <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
            <div className="flex flex-col md:flex-row justify-between items-center gap-12">
              <div className="text-center flex-1 relative px-8">
                <div className="w-16 h-16 bg-surface-container-highest rounded-full flex items-center justify-center mx-auto mb-6 border border-outline-variant">
                  <span className="material-symbols-outlined text-3xl">event_upcoming</span>
                </div>
                <h4 className="font-bold mb-2">1. Prepare</h4>
                <p className="text-on-surface-variant text-sm">Create family safety plans and store critical documents securely.</p>
              </div>
              <div className="hidden md:block h-px w-full bg-outline-variant flex-[0.5]"></div>
              <div className="text-center flex-1 relative px-8">
                <div className="w-16 h-16 bg-primary-container/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-primary/30">
                  <span className="material-symbols-outlined text-3xl text-primary">sensors</span>
                </div>
                <h4 className="font-bold mb-2">2. Respond</h4>
                <p className="text-on-surface-variant text-sm">Receive verified alerts and evacuate using optimized routes.</p>
              </div>
              <div className="hidden md:block h-px w-full bg-outline-variant flex-[0.5]"></div>
              <div className="text-center flex-1 relative px-8">
                <div className="w-16 h-16 bg-secondary-container/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-secondary/30">
                  <span className="material-symbols-outlined text-3xl text-secondary">groups</span>
                </div>
                <h4 className="font-bold mb-2">3. Coordinate</h4>
                <p className="text-on-surface-variant text-sm">Request resources or volunteer your skills through the live hub.</p>
              </div>
              <div className="hidden md:block h-px w-full bg-outline-variant flex-[0.5]"></div>
              <div className="text-center flex-1 relative px-8">
                <div className="w-16 h-16 bg-tertiary-container/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-tertiary/30">
                  <span className="material-symbols-outlined text-3xl text-tertiary">auto_fix_high</span>
                </div>
                <h4 className="font-bold mb-2">4. Recover</h4>
                <p className="text-on-surface-variant text-sm">Track rebuild status and access long-term community support.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section id="stats" className="py-24 bg-background overflow-hidden relative">
          <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop text-center">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
              <div>
                <p className="text-5xl font-display-lg font-bold text-primary mb-2">14.2M</p>
                <p className="font-label-caps text-label-caps text-on-surface-variant">Active Users</p>
              </div>
              <div>
                <p className="text-5xl font-display-lg font-bold text-secondary mb-2">850k</p>
                <p className="font-label-caps text-label-caps text-on-surface-variant">Trained Volunteers</p>
              </div>
              <div>
                <p className="text-5xl font-display-lg font-bold text-tertiary mb-2">2.4B</p>
                <p className="font-label-caps text-label-caps text-on-surface-variant">Liters of Water Delivered</p>
              </div>
              <div>
                <p className="text-5xl font-display-lg font-bold text-outline mb-2">184</p>
                <p className="font-label-caps text-label-caps text-on-surface-variant">Countries Supported</p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="relative py-32 overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img className="w-full h-full object-cover brightness-50" alt="Resilient community" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBeQXcjlOnQ_4H47-9ttLaNtI5d85AxKfDMxoQSWh5UZJZKmr4IJDU8SJnX4ML8nfBzLbej80wCNEuaV99lHp8K0aSLL41YLSUVLbe24OeZfWzLMNIPrbEP9G4iSe1zRTRjJGmYPliaN-vuvFJscDPR9eqTN-UlfeAW4-Gi8Tlk4bEW8sK6xsjBtgVc1wCwRgQIpP2gFaSD1kNGfln2XRV4R7oR6dB7ewUD3rrqOsRfva31jhxO-1i0QXSq--7FWOErnaVs_EzmATY" />
            <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent"></div>
          </div>
          <div className="relative z-10 max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop text-center">
            <h2 className="font-display-lg text-display-lg mb-6">Prepared Today.<br />Protected Tomorrow.</h2>
            <p className="font-body-lg text-body-lg text-white/80 mb-10 max-w-2xl mx-auto">
              Join the global network that never sleeps. Deploy AidFlow for your agency or register your community to build a more resilient future.
            </p>
            <div className="flex flex-col md:flex-row justify-center gap-6">
              <button onClick={handleGetStarted} className="bg-[#2563EB] text-white px-10 py-5 rounded-lg font-bold text-xl hover:scale-105 transition-transform">
                Launch Dashboard
              </button>
              <button onClick={() => alert('Thank you for your interest! A representative will contact you soon.')} className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-10 py-5 rounded-lg font-bold text-xl hover:bg-white/20 transition-all">
                Contact Sales
              </button>
            </div>
            <div className="mt-12 flex justify-center items-center gap-8 opacity-60">
              <span className="material-symbols-outlined text-4xl">security</span>
              <span className="material-symbols-outlined text-4xl">public</span>
              <span className="material-symbols-outlined text-4xl">lock</span>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-surface-container-lowest dark:bg-surface-container-lowest full-width border-t border-outline-variant">
        <div className="flex flex-col md:flex-row justify-between items-center w-full py-12 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto gap-gutter">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <img alt="AidFlow Logo" className="h-6 w-6" src="/logo.svg" />
              <span className="text-headline-md font-headline-md font-bold text-on-surface">AidFlow</span>
            </div>
            <p className="font-data-mono text-data-mono opacity-60 max-w-xs">
              © 2024 ReliefCommand. Global Emergency Response Network. Data encrypted via AES-256 standards.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-8">
            <span onClick={() => alert('Privacy Policy is currently being updated.')} className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors cursor-pointer">Privacy Policy</span>
            <span onClick={() => alert('Terms of Service are currently being updated.')} className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors cursor-pointer">Terms of Service</span>
            <span onClick={() => alert('Agency Partners list is available in the dashboard.')} className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors cursor-pointer">Agency Partners</span>
            <span onClick={() => alert('Please email contact@reliefcommand.org for support.')} className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors cursor-pointer">Contact Us</span>
          </div>
          <div className="flex gap-4">
            <button onClick={() => alert('Share link copied to clipboard!')} className="w-10 h-10 rounded-full border border-outline-variant flex items-center justify-center hover:bg-surface-container transition-colors">
              <span className="material-symbols-outlined text-sm">share</span>
            </button>
            <button onClick={() => alert('Language options coming soon.')} className="w-10 h-10 rounded-full border border-outline-variant flex items-center justify-center hover:bg-surface-container transition-colors">
              <span className="material-symbols-outlined text-sm">language</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom NavBar */}
      <div className="fixed bottom-0 left-0 w-full flex justify-around items-center h-16 md:hidden px-margin-mobile bg-surface border-t border-outline-variant z-[100] glass-panel">
        <div onClick={handleGetStarted} className="flex flex-col items-center justify-center text-primary dark:text-primary-fixed cursor-pointer">
          <span className="material-symbols-outlined">home</span>
          <span className="font-label-caps text-[10px] uppercase">Home</span>
        </div>
        <div onClick={handleGetStarted} className="flex flex-col items-center justify-center text-on-surface-variant dark:text-on-surface-variant cursor-pointer">
          <span className="material-symbols-outlined">notifications_active</span>
          <span className="font-label-caps text-[10px] uppercase">Alerts</span>
        </div>
        <div onClick={handleGetStarted} className="flex flex-col items-center justify-center text-on-surface-variant dark:text-on-surface-variant cursor-pointer">
          <span className="material-symbols-outlined">map</span>
          <span className="font-label-caps text-[10px] uppercase">Map</span>
        </div>
        <div onClick={handleGetStarted} className="flex flex-col items-center justify-center text-on-surface-variant dark:text-on-surface-variant cursor-pointer">
          <span className="material-symbols-outlined">volunteer_activism</span>
          <span className="font-label-caps text-[10px] uppercase">Volunteer</span>
        </div>
      </div>
    </div>
  );
};
