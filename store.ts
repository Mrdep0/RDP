import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Settings, LastResults } from './types';

const ADMIN_ID = 988720538;
const CHANNEL_ID = '@samuraichert';

interface AppState {
  // Current user
  currentUser: User | null;
  isAdmin: boolean;
  isSubscribed: boolean;
  
  // Data
  users: User[];
  permanentUsers: User[];
  settings: Settings;
  lastResults: LastResults | null;
  
  // UI State
  view: 'main' | 'profile' | 'howto' | 'admin';
  adminView: 'main' | 'broadcast' | 'winners' | 'users' | 'export' | 'settings' | 'reset';
  
  // Actions
  setCurrentUser: (user: User | null) => void;
  setIsSubscribed: (value: boolean) => void;
  setView: (view: 'main' | 'profile' | 'howto' | 'admin') => void;
  setAdminView: (view: 'main' | 'broadcast' | 'winners' | 'users' | 'export' | 'settings' | 'reset') => void;
  
  // User actions
  registerUser: (userId: number, username: string, fullName: string, referrerId?: number) => void;
  validateSubscription: (userId: number) => boolean;
  getRefLink: (userId: number) => string;
  
  // Admin actions
  updateHowto: (text: string) => void;
  resetContest: () => void;
  drawWinners: (count: number) => User[];
  saveResults: (text: string) => void;
}

// Generate random ref code
const generateRefCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Demo data for testing
const demoUsers: User[] = [
  { user_id: 123456789, username: '@ivan_petrov', full_name: 'Иван Петров', score: 5, is_validated: true, join_date: '2024-01-15' },
  { user_id: 234567890, username: '@anna_sidorova', full_name: 'Анна Сидорова', score: 3, is_validated: true, join_date: '2024-01-16' },
  { user_id: 345678901, username: '@dmitry_k', full_name: 'Дмитрий Козлов', score: 8, is_validated: true, join_date: '2024-01-17' },
  { user_id: 456789012, username: '@elena_m', full_name: 'Елена Морозова', score: 2, is_validated: true, join_date: '2024-01-18' },
  { user_id: 567890123, username: '@alex_novikov', full_name: 'Александр Новиков', score: 4, is_validated: true, join_date: '2024-01-19' },
  { user_id: 678901234, username: '@maria_volkova', full_name: 'Мария Волкова', score: 1, is_validated: true, join_date: '2024-01-20' },
  { user_id: 789012345, username: '', full_name: 'Сергей Белов', score: 6, is_validated: true, join_date: '2024-01-21' },
  { user_id: 890123456, username: '@olga_kuznetsova', full_name: 'Ольга Кузнецова', score: 0, is_validated: true, join_date: '2024-01-22' },
];

const refCodes: Map<number, string> = new Map();

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      isAdmin: false,
      isSubscribed: false,
      users: demoUsers,
      permanentUsers: demoUsers,
      settings: {
        howto: '🎁 <b>Как участвовать в розыгрыше:</b>\n\n1️⃣ Подпишитесь на канал ' + CHANNEL_ID + '\n2️⃣ Нажмите кнопку "Проверить подписку"\n3️⃣ Пригласите друзей по своей реферальной ссылке\n4️⃣ За каждого друга получите +1 балл\n\n🏆 Чем больше баллов, тем выше шанс победить!',
      },
      lastResults: null,
      view: 'main',
      adminView: 'main',

      setCurrentUser: (user) => {
        const isAdmin = user?.user_id === ADMIN_ID;
        set({ currentUser: user, isAdmin });
      },

      setIsSubscribed: (value) => set({ isSubscribed: value }),
      setView: (view) => set({ view }),
      setAdminView: (adminView) => set({ adminView }),

      registerUser: (userId, username, fullName, referrerId) => {
        const { users, permanentUsers } = get();
        
        const existingUser = users.find(u => u.user_id === userId);
        if (existingUser) {
          set({ currentUser: existingUser });
          return;
        }

        const newUser: User = {
          user_id: userId,
          username: username || '',
          full_name: fullName,
          referrer_id: referrerId,
          is_validated: false,
          score: 0,
          join_date: new Date().toISOString().split('T')[0],
        };

        set({
          users: [...users, newUser],
          permanentUsers: [...permanentUsers, newUser],
          currentUser: newUser,
        });
      },

      validateSubscription: (userId) => {
        const { users, isSubscribed } = get();
        
        if (!isSubscribed) return false;

        const userIndex = users.findIndex(u => u.user_id === userId);
        if (userIndex === -1) return false;

        const user = users[userIndex];
        if (user.is_validated) return true;

        const updatedUsers = [...users];
        updatedUsers[userIndex] = { ...user, is_validated: true };

        // Award referrer
        if (user.referrer_id) {
          const referrerIndex = updatedUsers.findIndex(u => u.user_id === user.referrer_id);
          if (referrerIndex !== -1) {
            updatedUsers[referrerIndex] = {
              ...updatedUsers[referrerIndex],
              score: updatedUsers[referrerIndex].score + 1,
            };
          }
        }

        set({ users: updatedUsers, currentUser: updatedUsers[userIndex] });
        return true;
      },

      getRefLink: (userId) => {
        let code = refCodes.get(userId);
        if (!code) {
          code = generateRefCode();
          refCodes.set(userId, code);
        }
        // В реальном приложении это будет ссылка на бота
        return `https://t.me/YourBotName?start=ref_${code}`;
      },

      updateHowto: (text) => {
        set({ settings: { ...get().settings, howto: text } });
      },

      resetContest: () => {
        set({ 
          users: [], 
          lastResults: null,
        });
        refCodes.clear();
      },

      drawWinners: (count) => {
        const { users } = get();
        const validParticipants = users.filter(u => u.is_validated && u.score > 0);
        
        // Weighted random selection based on score
        const pool: User[] = [];
        validParticipants.forEach(p => {
          for (let i = 0; i < p.score; i++) {
            pool.push(p);
          }
        });

        if (pool.length === 0) return [];

        const uniqueParticipants = [...new Set(pool.map(p => p.user_id))];
        const winnerIds: number[] = [];
        const winners: User[] = [];

        while (winners.length < Math.min(count, uniqueParticipants.length)) {
          const randomIndex = Math.floor(Math.random() * pool.length);
          const winner = pool[randomIndex];
          
          if (!winnerIds.includes(winner.user_id)) {
            winnerIds.push(winner.user_id);
            winners.push(winner);
          }
        }

        return winners;
      },

      saveResults: (text) => {
        set({
          lastResults: {
            text,
            date: new Date().toISOString(),
          },
        });
      },
    }),
    {
      name: 'contest-storage',
    }
  )
);

export { ADMIN_ID, CHANNEL_ID };
