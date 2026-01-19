import { createContext } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { User, Operator, Cafe, Booking, ChatMessage, PCStatus, RegisteredUser, CafeWallet } from '../App';

export interface AppContextType {
  user: User | null;
  setUser: Dispatch<SetStateAction<User | null>>;
  operator: Operator | null;
  setOperator: (operator: Operator | null) => void;
  cafes: Cafe[];
  bookings: Booking[];
  getUserBookings: () => Booking[]; // Get bookings for current user only
  addBooking: (booking: Booking) => void;
  cancelBooking: (bookingId: string) => void;
  updateBooking: (bookingId: string, updates: Partial<Booking>) => void;
  updateBookingStatus: (bookingId: string, status: 'active' | 'completed' | 'cancelled') => void;
  updateWallet: (cafeId: string, minutes: number, isActive: boolean) => void;
  extendWallet: (cafeId: string, minutes: number) => void;
  updateMemberWallet: (userId: string, cafeId: string, updates: Partial<CafeWallet>) => void;
  chatMessages: { [cafeId: string]: ChatMessage[] };
  setChatMessages: Dispatch<SetStateAction<{ [cafeId: string]: ChatMessage[] }>>;
  addChatMessage: (cafeId: string, message: ChatMessage) => void;
  pcStatuses: { [cafeId: string]: PCStatus[] };
  setPcStatuses: Dispatch<SetStateAction<{ [cafeId: string]: PCStatus[] }>>;
  getPCsForCafe: (cafeId: string) => PCStatus[];
  registeredUsers: RegisteredUser[];
  operators: Operator[];
  registerUser: (user: RegisteredUser) => void;
  findUserByCredentials: (username: string, password: string, role: 'regular' | 'member') => User | null;
}

export const AppContext = createContext<AppContextType | null>(null);

