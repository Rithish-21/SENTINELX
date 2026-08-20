import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type {
  UserProfile,
  SendOtpPayload,
  LoginPayload,
  AuthResponse,
} from '../types/sentinel';
import { sentinelApi } from '../api/sentinel';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  authModalMode: 'signin' | 'signup' | 'verify-otp';
  pendingOtpSession: {
    sessionId: string;
    destination: string;
    channel: 'email' | 'sms';
    debugOtp?: string;
    name: string;
  } | null;
  signin: (payload: LoginPayload) => Promise<AuthResponse>;
  demoLogin: (user: UserProfile) => void;
  signupSendOtp: (payload: SendOtpPayload) => Promise<AuthResponse>;
  signupVerifyOtp: (otpCode: string) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  openAuthModal: (mode?: 'signin' | 'signup' | 'verify-otp') => void;
  closeAuthModal: () => void;
  setAuthModalMode: (mode: 'signin' | 'signup' | 'verify-otp') => void;
  setCurrentUser: (user: UserProfile) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_USER_KEY = 'sentinelx_auth_user';
const LOCAL_STORAGE_TOKEN_KEY = 'sentinelx_auth_token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup' | 'verify-otp'>('signin');
  const [pendingOtpSession, setPendingOtpSession] = useState<{
    sessionId: string;
    destination: string;
    channel: 'email' | 'sms';
    debugOtp?: string;
    name: string;
  } | null>(null);

  // Initialize from LocalStorage or Default Demo User
  useEffect(() => {
    const initAuth = async () => {
      try {
        const savedToken = localStorage.getItem(LOCAL_STORAGE_TOKEN_KEY);
        const savedUserJson = localStorage.getItem(LOCAL_STORAGE_USER_KEY);

        if (savedToken && savedUserJson) {
          setToken(savedToken);
          setUser(JSON.parse(savedUserJson));
        } else {
          // Default to null (Guest Operator mode) so dashboard opens cleanly
          setUser(null);
          setToken(null);
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
      } finally {
        setIsLoading(false);
        setIsAuthModalOpen(false); // Dashboard opens first
      }
    };

    initAuth();
  }, []);

  const openAuthModal = useCallback((mode: 'signin' | 'signup' | 'verify-otp' = 'signin') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  const signin = async (payload: LoginPayload): Promise<AuthResponse> => {
    setIsLoading(true);
    try {
      const res = await sentinelApi.signin(payload);
      if (res.user && res.token) {
        setUser(res.user);
        setToken(res.token);
        localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(res.user));
        localStorage.setItem(LOCAL_STORAGE_TOKEN_KEY, res.token);
        setIsAuthModalOpen(false);
      }
      return res;
    } finally {
      setIsLoading(false);
    }
  };

  const demoLogin = (selectedUser: UserProfile) => {
    const fakeToken = `demo_token_${selectedUser.user_id}`;
    setUser(selectedUser);
    setToken(fakeToken);
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(selectedUser));
    localStorage.setItem(LOCAL_STORAGE_TOKEN_KEY, fakeToken);
    setIsAuthModalOpen(false);
  };

  const signupSendOtp = async (payload: SendOtpPayload): Promise<AuthResponse> => {
    setIsLoading(true);
    try {
      const res = await sentinelApi.signupSendOtp(payload);
      if (res.otp_session_id) {
        setPendingOtpSession({
          sessionId: res.otp_session_id,
          destination: res.destination || (payload.channel === 'email' ? payload.email! : payload.phone!),
          channel: payload.channel,
          debugOtp: res.debug_otp,
          name: payload.name,
        });
        setAuthModalMode('verify-otp');
      }
      return res;
    } finally {
      setIsLoading(false);
    }
  };

  const signupVerifyOtp = async (otpCode: string): Promise<AuthResponse> => {
    if (!pendingOtpSession) {
      throw new Error('No active OTP session found. Please register again.');
    }
    setIsLoading(true);
    try {
      const res = await sentinelApi.signupVerifyOtp({
        otp_session_id: pendingOtpSession.sessionId,
        otp_code: otpCode,
      });
      if (res.user && res.token) {
        setUser(res.user);
        setToken(res.token);
        localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(res.user));
        localStorage.setItem(LOCAL_STORAGE_TOKEN_KEY, res.token);
        setPendingOtpSession(null);
        setIsAuthModalOpen(false);
      }
      return res;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await sentinelApi.logout();
    } catch {
      // ignore
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
      localStorage.removeItem(LOCAL_STORAGE_TOKEN_KEY);
      setIsLoading(false);
      setIsAuthModalOpen(false); // Do not force open modal on logout
      setAuthModalMode('signin');
    }
  };

  const setCurrentUser = (newUser: UserProfile) => {
    setUser(newUser);
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(newUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        isAuthModalOpen,
        authModalMode,
        pendingOtpSession,
        signin,
        demoLogin,
        signupSendOtp,
        signupVerifyOtp,
        logout,
        openAuthModal,
        closeAuthModal,
        setAuthModalMode,
        setCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
