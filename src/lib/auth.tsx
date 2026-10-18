import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { store } from './storage';

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

const configured = !!import.meta.env.VITE_FIREBASE_API_KEY;
const fb = configured ? import('./firebase') : null;

const DEMO_KEY = 'funda:demo-session';
const Ctx = createContext<AuthCtx | null>(null);

/** Validation errors written for the user; anything else gets a generic message. */
export class FormError extends Error {
  field?: 'name' | 'email' | 'password';
  constructor(message: string, field?: FormError['field']) {
    super(message);
    this.field = field;
  }
}

const ERRORS: Record<string, string> = {
  'auth/invalid-credential': 'Correo o contraseña incorrectos.',
  'auth/wrong-password': 'Correo o contraseña incorrectos.',
  'auth/user-not-found': 'No existe una cuenta con ese correo.',
  'auth/email-already-in-use': 'Ya existe una cuenta con ese correo. Inicia sesión.',
  'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
  'auth/invalid-email': 'El correo no es válido.',
  'auth/missing-password': 'Escribe tu contraseña.',
  'auth/too-many-requests': 'Demasiados intentos. Espera un momento e inténtalo de nuevo.',
  'auth/popup-closed-by-user': 'Se cerró la ventana de Google antes de terminar.',
  'auth/popup-blocked': 'Tu navegador bloqueó la ventana de Google. Permite las ventanas emergentes e inténtalo de nuevo.',
  'auth/account-exists-with-different-credential': 'Ese correo ya está registrado con otro método. Entra con tu correo y contraseña.',
  'auth/user-disabled': 'Esta cuenta está desactivada.',
  'auth/unauthorized-domain': 'El inicio de sesión aún no está habilitado en este sitio.',
  'auth/operation-not-allowed': 'Este método de acceso no está habilitado.',
  'auth/network-request-failed': 'Sin conexión. Revisa tu internet.',
  // User cancelled; not an error worth showing
  'auth/cancelled-popup-request': '',
};

export function authError(e: unknown): string {
  if (e instanceof FormError) return e.message;
  const code = (e as { code?: string })?.code ?? '';
  if (code in ERRORS) return ERRORS[code];
  console.error(e);
  return 'No pudimos completar el acceso. Inténtalo de nuevo en unos segundos.';
}

export function authErrorField(e: unknown): FormError['field'] {
  if (e instanceof FormError) return e.field;
  const code = (e as { code?: string })?.code ?? '';
  if (code === 'auth/invalid-email' || code === 'auth/user-not-found' || code === 'auth/email-already-in-use') return 'email';
  if (code === 'auth/weak-password' || code === 'auth/missing-password' || code === 'auth/invalid-credential' || code === 'auth/wrong-password') return 'password';
  return undefined;
}

export const isEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

function validate(email: string, password: string) {
  if (!isEmail(email)) throw new FormError('Escribe un correo válido, por ejemplo tu@correo.com.', 'email');
  if (password.length < 6) throw new FormError('La contraseña debe tener al menos 6 caracteres.', 'password');
}

const nameFromEmail = (email: string) => {
  const n = email.split('@')[0];
  return n.charAt(0).toUpperCase() + n.slice(1);
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!fb) {
      setUser(store.get<User | null>(DEMO_KEY, null));
      setLoading(false);
      return;
    }
    let unsub = () => {};
    let live = true;
    fb.then((m) => {
      if (!live) return;
      unsub = m.onAuthStateChanged(m.auth, (u) => {
        setUser(u ? { uid: u.uid, name: u.displayName || nameFromEmail(u.email ?? 'usuario'), email: u.email ?? '', photoURL: u.photoURL } : null);
        setLoading(false);
      });
    }).catch((e) => {
      console.error(e);
      setLoading(false);
    });
    return () => {
      live = false;
      unsub();
    };
  }, []);

  // shortcut: demo mode keeps only name+email locally (no password); configure Firebase before going public.
  const demoLogin = (name: string, email: string) => {
    const u = { uid: `demo-${email.trim().toLowerCase()}`, name, email: email.trim() };
    store.set(DEMO_KEY, u);
    setUser(u);
  };

  const value: AuthCtx = {
    user,
    loading,
    demo: !configured,
    async signIn(email, password) {
      validate(email, password);
      if (!fb) return demoLogin(nameFromEmail(email.trim()), email);
      const m = await fb;
      await m.signInWithEmailAndPassword(m.auth, email.trim(), password);
    },
    async signUp(name, email, password) {
      if (!name.trim()) throw new FormError('Escribe tu nombre.', 'name');
      validate(email, password);
      if (!fb) return demoLogin(name.trim(), email);
      const m = await fb;
      const cred = await m.createUserWithEmailAndPassword(m.auth, email.trim(), password);
      await m.updateProfile(cred.user, { displayName: name.trim() });
      setUser({ uid: cred.user.uid, name: name.trim(), email: email.trim(), photoURL: null });
    },
    async signInWithGoogle() {
      if (!fb) throw new FormError('Esta opción no está disponible por ahora.');
      const m = await fb;
      const provider = new m.GoogleAuthProvider();
      try {
        await m.signInWithPopup(m.auth, provider);
      } catch (e) {
        // Mobile Safari and embedded previews block popups: fall back to a full-page redirect
        if ((e as { code?: string })?.code === 'auth/popup-blocked') return m.signInWithRedirect(m.auth, provider);
        throw e;
      }
    },
    async resetPassword(email) {
      if (!fb) throw new FormError('La recuperación de contraseña no está disponible por ahora.');
      if (!isEmail(email)) throw new FormError('Escribe tu correo arriba para enviarte el enlace.', 'email');
      const m = await fb;
      await m.sendPasswordResetEmail(m.auth, email.trim());
    },
    async signOut() {
      if (fb) {
        const m = await fb;
        await m.signOut(m.auth);
      }
      store.del(DEMO_KEY);
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
