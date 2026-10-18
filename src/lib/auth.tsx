import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { initializeApp } from 'firebase/app';
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as fbSignOut,
  updateProfile,
  type Auth,
} from 'firebase/auth';

export interface User {
  uid: string;
  name: string;
  email: string;
  photoURL?: string | null;
}

interface AuthCtx {
  user: User | null;
  loading: boolean;
  demo: boolean;
  signIn(email: string, password: string): Promise<void>;
  signUp(name: string, email: string, password: string): Promise<void>;
  signInWithGoogle(): Promise<void>;
  resetPassword(email: string): Promise<void>;
  signOut(): Promise<void>;
}

const env = import.meta.env;
const auth: Auth | null = env.VITE_FIREBASE_API_KEY
  ? getAuth(
      initializeApp({
        apiKey: env.VITE_FIREBASE_API_KEY,
        authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: env.VITE_FIREBASE_PROJECT_ID,
        appId: env.VITE_FIREBASE_APP_ID,
      }),
    )
  : null;

const DEMO_KEY = 'funda:demo-session';
const Ctx = createContext<AuthCtx | null>(null);

const ERRORS: Record<string, string> = {
  'auth/invalid-credential': 'Correo o contraseña incorrectos.',
  'auth/wrong-password': 'Correo o contraseña incorrectos.',
  'auth/user-not-found': 'No existe una cuenta con ese correo.',
  'auth/email-already-in-use': 'Ya existe una cuenta con ese correo.',
  'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
  'auth/invalid-email': 'El correo no es válido.',
  'auth/too-many-requests': 'Demasiados intentos. Espera un momento e inténtalo de nuevo.',
  'auth/popup-closed-by-user': 'Se cerró la ventana de Google antes de terminar.',
  'auth/network-request-failed': 'Sin conexión. Revisa tu internet.',
};

export function authError(e: unknown): string {
  const code = (e as { code?: string })?.code ?? '';
  return ERRORS[code] ?? (e instanceof Error ? e.message : 'Ocurrió un error inesperado.');
}

function validate(email: string, password: string) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error(ERRORS['auth/invalid-email']);
  if (password.length < 6) throw new Error(ERRORS['auth/weak-password']);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      try {
        setUser(JSON.parse(localStorage.getItem(DEMO_KEY) ?? 'null'));
      } catch {
        /* no stored session */
      }
      setLoading(false);
      return;
    }
    return onAuthStateChanged(auth, (u) => {
      setUser(u ? { uid: u.uid, name: u.displayName || u.email!.split('@')[0], email: u.email ?? '', photoURL: u.photoURL } : null);
      setLoading(false);
    });
  }, []);

  // shortcut: demo mode keeps only name+email locally (no password), switch to Firebase before going public.
  const demoLogin = (name: string, email: string) => {
    const u = { uid: `demo-${email.toLowerCase()}`, name, email };
    localStorage.setItem(DEMO_KEY, JSON.stringify(u));
    setUser(u);
  };

  const value: AuthCtx = {
    user,
    loading,
    demo: !auth,
    async signIn(email, password) {
      validate(email, password);
      if (!auth) return demoLogin(email.charAt(0).toUpperCase() + email.slice(1).split('@')[0], email);
      await signInWithEmailAndPassword(auth, email, password);
    },
    async signUp(name, email, password) {
      if (!name.trim()) throw new Error('Escribe tu nombre.');
      validate(email, password);
      if (!auth) return demoLogin(name.trim(), email);
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: name.trim() });
      setUser({ uid: cred.user.uid, name: name.trim(), email, photoURL: null });
    },
    async signInWithGoogle() {
      if (!auth) throw new Error('El acceso con Google requiere configurar Firebase.');
      await signInWithPopup(auth, new GoogleAuthProvider());
    },
    async resetPassword(email) {
      if (!auth) throw new Error('La recuperación de contraseña requiere configurar Firebase.');
      await sendPasswordResetEmail(auth, email);
    },
    async signOut() {
      if (auth) await fbSignOut(auth);
      localStorage.removeItem(DEMO_KEY);
      setUser(null);
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
