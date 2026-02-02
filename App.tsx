import { useEffect, useState } from 'react';
import { User, HelpCircle } from 'lucide-react';
import { Header } from './components/Header';
import { SubscriptionCheck } from './components/SubscriptionCheck';
import { Profile } from './components/Profile';
import { HowItWorks } from './components/HowItWorks';
import { LastResults } from './components/LastResults';
import { AdminPanel } from './components/admin/AdminPanel';
import { WelcomeScreen } from './components/WelcomeScreen';
import { useAppStore, ADMIN_ID } from './store';
import type { TelegramUser } from './types';

export function App() {
  const { 
    currentUser, 
    view, 
    setView, 
    registerUser,
    setIsSubscribed 
  } = useAppStore();
  
  const [showWelcome, setShowWelcome] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Initialize Telegram WebApp
    const tg = window.Telegram?.WebApp;
    
    if (tg) {
      tg.ready();
      tg.expand();
      
      const user: TelegramUser | undefined = tg.initDataUnsafe?.user;
      
      if (user) {
        // Check for referral in start_param
        const startParam = tg.initDataUnsafe?.start_param;
        let referrerId: number | undefined;
        
        if (startParam?.startsWith('ref_')) {
          // In real app, you'd decode the ref code to get referrer ID via backend
          // This is simplified for demo
        }
        
        // Register or get user
        registerUser(
          user.id,
          user.username ? `@${user.username}` : '',
          `${user.first_name}${user.last_name ? ' ' + user.last_name : ''}`,
          referrerId
        );
        
        // Skip welcome for returning users
        const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
        if (hasSeenWelcome === 'true') {
          setShowWelcome(false);
        }
      }
    } else {
      // Demo mode - simulate a user for testing in browser
      const demoUserId = Math.random() > 0.5 ? ADMIN_ID : 12345678;
      registerUser(
        demoUserId,
        demoUserId === ADMIN_ID ? '@admin' : '@demo_user',
        demoUserId === ADMIN_ID ? 'Администратор' : 'Демо Пользователь'
      );
      // Auto-validate for demo
      setIsSubscribed(true);
      
      // Skip welcome in demo
      const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
      if (hasSeenWelcome === 'true') {
        setShowWelcome(false);
      }
    }
    
    setIsInitialized(true);
  }, [registerUser, setIsSubscribed]);
  
  const handleStartFromWelcome = () => {
    localStorage.setItem('hasSeenWelcome', 'true');
    setShowWelcome(false);
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('medium');
  };
  
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-600 to-purple-600 flex items-center justify-center">
        <div className="animate-pulse text-white text-xl">Загрузка...</div>
      </div>
    );
  }
  
  if (showWelcome) {
    return <WelcomeScreen onStart={handleStartFromWelcome} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <Header />
      
      <main className="px-4 py-6 pb-24">
        {view === 'admin' ? (
          <AdminPanel />
        ) : view === 'howto' ? (
          <HowItWorks />
        ) : (
          <div className="space-y-6">
            {/* Subscription / Welcome */}
            <SubscriptionCheck />
            
            {/* Profile section - only show if validated */}
            {currentUser?.is_validated && (
              <Profile />
            )}
            
            {/* Last Results */}
            <LastResults />
          </div>
        )}
      </main>

      {/* Bottom Navigation - only for users */}
      {view !== 'admin' && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
          <div className="grid grid-cols-2 gap-1 p-2">
            <button
              onClick={() => setView('main')}
              className={`flex flex-col items-center gap-1 rounded-xl py-3 transition-all ${
                view === 'main' 
                  ? 'bg-indigo-50 text-indigo-600' 
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <User className="h-6 w-6" />
              <span className="text-xs font-medium">Профиль</span>
            </button>
            
            <button
              onClick={() => setView('howto')}
              className={`flex flex-col items-center gap-1 rounded-xl py-3 transition-all ${
                view === 'howto' 
                  ? 'bg-indigo-50 text-indigo-600' 
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <HelpCircle className="h-6 w-6" />
              <span className="text-xs font-medium">Как работает?</span>
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}
