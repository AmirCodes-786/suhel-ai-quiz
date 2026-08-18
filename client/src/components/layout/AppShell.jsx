import React, { useState, useEffect } from 'react';
import { useLocation, useOutlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Footer from './Footer';
import { motion, AnimatePresence } from 'framer-motion';

export default function AppShell() {
  const location = useLocation();
  const outlet = useOutlet();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  const isLanding = location.pathname === '/';
  const isQuizPlayer = location.pathname.startsWith('/quiz/') || location.pathname.startsWith('/battle-room/');

  // Reset scroll, close mobile drawer, and pulse top navigation bar on route changes
  useEffect(() => {
    setIsMobileNavOpen(false);
    setIsNavigating(true);

    const mainEl = document.getElementById('app-main-content');
    if (mainEl) {
      mainEl.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }

    const timer = setTimeout(() => {
      setIsNavigating(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  // Landing Page: Full document layout
  if (isLanding) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary-light selection:text-primary">
        <main className="flex-1 w-full">
          <AnimatePresence mode="wait" initial={false}>
            {outlet && React.cloneElement(outlet, { key: location.pathname })}
          </AnimatePresence>
        </main>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-background text-foreground flex flex-col selection:bg-primary-light selection:text-primary relative">
      {/* Top Route Navigation Indicator Bar */}
      <AnimatePresence>
        {isNavigating && (
          <motion.div
            initial={{ scaleX: 0, transformOrigin: '0% 50%' }}
            animate={{ scaleX: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="fixed top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-primary via-indigo-500 to-amber-400 z-50 shadow-sm"
          />
        )}
      </AnimatePresence>

      <Navbar 
        onToggleMobileNav={() => setIsMobileNavOpen(!isMobileNavOpen)} 
        isMobileNavOpen={isMobileNavOpen}
      />

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileNavOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileNavOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="relative w-60 max-w-[80vw] bg-white h-full shadow-2xl z-10 pt-14"
            >
              <Sidebar onItemClick={() => setIsMobileNavOpen(false)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Desktop App Layout */}
      <div className="flex-1 flex w-full overflow-hidden">
        {/* Stationary Left Sidebar */}
        {!isQuizPlayer && (
          <div className="hidden md:block shrink-0 h-full">
            <Sidebar />
          </div>
        )}

        {/* Independent Scrollable Main Panel */}
        <div 
          id="app-main-content" 
          className="flex-1 h-full overflow-y-auto overflow-x-hidden flex flex-col justify-between"
        >
          <main className={isQuizPlayer ? 'w-full flex-1' : 'p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full flex-1'}>
            <AnimatePresence mode="wait" initial={false}>
              {outlet && React.cloneElement(outlet, { key: location.pathname })}
            </AnimatePresence>
          </main>
          {!isQuizPlayer && <Footer />}
        </div>
      </div>
    </div>
  );
}
