import React from 'react';
import { useAuth } from './hooks/useAuth';
import Splash from './components/Splash';
import AuthScreen from './components/AuthScreen';
import PartnerDashboard from './components/PartnerDashboard';
import AdminDashboard from './components/AdminDashboard';
import { auth, db } from './lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { doc, onSnapshot } from 'firebase/firestore';

export default function App() {
  const { user, profile, loading, profileMissing, refreshProfile } = useAuth();
  const [showSplash, setShowSplash] = React.useState(true);
  const [appConfig, setAppConfig] = React.useState({
    companyName: 'UP TORQUE',
    primaryColor: '#00FF88',
    logoUrl: ''
  });

  React.useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'app_config'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setAppConfig(data as any);
      }
    });
    return () => unsub();
  }, []);

  React.useEffect(() => {
    if (appConfig?.primaryColor) {
      document.documentElement.style.setProperty('--neon-green-color', appConfig.primaryColor);
      document.documentElement.style.setProperty('--color-neon-green', appConfig.primaryColor);
    }
    if (appConfig?.companyName) {
      document.title = appConfig.companyName;
    }
  }, [appConfig]);

  if (showSplash) {
    return <Splash appConfig={appConfig} onFinish={() => setShowSplash(false)} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-surface flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-neon-green/30 border-t-neon-green rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-surface selection:bg-neon-green selection:text-black">
      <AnimatePresence mode="wait">
        {!user || !profile ? (
          <motion.div
            key="auth"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <AuthScreen 
              appConfig={appConfig} 
              profileMissing={profileMissing}
              onAuthSuccess={() => {
                if (auth.currentUser) refreshProfile(auth.currentUser.uid);
              }} 
            />
          </motion.div>
        ) : (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative"
          >
            {profile.role === 'ADMIN' ? (
              <AdminDashboard profile={profile} initialAppConfig={appConfig} />
            ) : (
              <PartnerDashboard profile={profile} appConfig={appConfig} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
