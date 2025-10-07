'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { login } from '@/lib/api';

export default function LoginPage() {
  const [username, setU] = useState('');
  const [password, setP] = useState('');
  const [loading, setL] = useState(false);
  const [error, setE] = useState<string | null>(null);
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get('next') || '/courses';

  useEffect(() => { setE(null); }, [username, password]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setL(true);
    try {
      await login(username, password);
      router.replace(next);
    } catch (err: any) {
      setE(err?.message ?? 'Error al iniciar sesión');
    } finally { setL(false); }
  }

  return (
    <main style={{maxWidth:420, margin:'64px auto', padding:24}}>
      <h1>Iniciar sesión</h1>
      <form onSubmit={onSubmit} style={{display:'grid', gap:12}}>
        <label>Usuario</label>
        <input value={username} onChange={e=>setU(e.target.value)} required />
        <label>Contraseña</label>
        <input type="password" value={password} onChange={e=>setP(e.target.value)} required />
        <button disabled={loading} type="submit">{loading?'Entrando…':'Entrar'}</button>
      </form>
      {error && <p style={{color:'crimson'}}>{error}</p>}
    </main>
  );
}
