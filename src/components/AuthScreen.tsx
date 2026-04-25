import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, UserPlus, AlertCircle, Phone, LogOut } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { cn } from '../lib/utils';

type AuthMode = 'INITIAL' | 'LOGIN' | 'REGISTER_CHOICE' | 'REGISTER_PARTNER' | 'REGISTER_ADMIN' | 'SUCCESS';

export default function AuthScreen({ onAuthSuccess, appConfig, profileMissing }: { onAuthSuccess: () => void, appConfig: { companyName: string, logoUrl: string }, profileMissing?: boolean }) {
  const [mode, setMode] = React.useState<AuthMode>('INITIAL');

  const companyParts = appConfig.companyName.split(' ');
  const part1 = companyParts[0];
  const part2 = companyParts.slice(1).join(' ');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [name, setName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [cpf, setCpf] = React.useState('');
  const [adminCode, setAdminCode] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [attempts, setAttempts] = React.useState(0);
  const [loading, setLoading] = React.useState(false);

  // Auto-check for existing auth session
  React.useEffect(() => {
    if (auth.currentUser && !profileMissing && (mode === 'INITIAL' || mode === 'LOGIN' || mode === 'SUCCESS')) {
      if (mode !== 'SUCCESS') setMode('SUCCESS');
      const timer = setTimeout(onAuthSuccess, 1000);
      return () => clearTimeout(timer);
    }
  }, [mode, onAuthSuccess, profileMissing]);

  // If profile is missing but user is logged in
  React.useEffect(() => {
    if (auth.currentUser && profileMissing) {
      setError('Perfil não encontrado para esta conta. Você pode tentar registrar novamente.');
    }
  }, [profileMissing]);

  const clearForm = () => {
    setEmail('');
    setPassword('');
    setName('');
    setPhone('');
    setCpf('');
    setAdminCode('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setMode('SUCCESS');
      clearForm();
      setTimeout(onAuthSuccess, 1000);
    } catch (err: any) {
      setAttempts(prev => prev + 1);
      setError('Credenciais inválidas. Verifique seu e-mail e senha.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent, role: 'PARTNER' | 'ADMIN') => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    if (role === 'PARTNER' && !adminCode) {
      setError('O código de administrador é obrigatório para parceiros.');
      setLoading(false);
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    const cleanCpf = cpf.replace(/\D/g, '');

    if (cleanCpf.length !== 11) {
      setError('CPF inválido.');
      setLoading(false);
      return;
    }

    try {
      let user = auth.currentUser;
      if (!user || user.email !== email) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        user = userCredential.user;
      }

      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        name,
        email,
        phone: cleanPhone,
        cpf: cleanCpf,
        role,
        status: 'ACTIVE',
        adminCode: role === 'PARTNER' ? adminCode : null,
        createdAt: new Date().toISOString()
      });
      
      setMode('SUCCESS');
      clearForm();
      setTimeout(onAuthSuccess, 1000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-dark-surface relative overflow-hidden scanline tech-grid">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(57,255,20,0.02),transparent_70%)]" />
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute -top-48 -left-48 w-[600px] h-[600px] bg-neon-green/10 blur-[120px] rounded-full" 
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.05, 0.15, 0.05]
          }}
          transition={{ duration: 15, repeat: Infinity, delay: 2 }}
          className="absolute -bottom-48 -right-48 w-[800px] h-[800px] bg-neon-green/5 blur-[150px] rounded-full" 
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-[1000px] grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10"
      >
        {/* Brand Section */}
        <div className="flex flex-col justify-center items-center lg:items-start p-8 lg:p-12">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center lg:items-start space-y-6"
          >
            {appConfig.logoUrl && (
              <img src={appConfig.logoUrl} alt="Logo" className="h-24 w-auto mb-4 object-contain filter drop-shadow-[0_0_30px_rgba(57,255,20,0.4)]" referrerPolicy="no-referrer" />
            )}
            <h1 className="text-6xl sm:text-8xl font-black italic tracking-tighter text-white leading-none uppercase">
              {part1} <br />
              {part2 && <span className="text-neon-green neon-text drop-shadow-[0_0_20px_rgba(57,255,20,0.5)]">{part2}</span>}
            </h1>
            <div className="h-1 w-24 bg-neon-green/30" />
            <p className="text-zinc-500 font-mono text-sm tracking-[0.5em] uppercase">Tech Infrastructure</p>
          </motion.div>
        </div>

        {/* Auth Interaction Area */}
        <motion.div 
          layout
          className="bento-card border-neon-green/10 bg-black/40 backdrop-blur-3xl flex flex-col justify-center"
        >
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="mb-8 p-5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-[11px] font-mono uppercase tracking-[0.2em] flex items-center gap-4"
              >
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <AlertCircle size={18} />
                </div>
                {error}
              </motion.div>
            )}

            {mode === 'INITIAL' && (
              <motion.div 
                key="initial"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="space-y-4">
                  <h3 className="text-2xl font-display font-black text-white italic tracking-tight uppercase">Protocolo de Acesso</h3>
                  <p className="text-zinc-500 text-sm font-light leading-relaxed">Identifique-se para acessar o núcleo operacional Up Torque. Conectando parceiros ao futuro da performance.</p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <button 
                    onClick={() => setMode('LOGIN')}
                    className="tech-button group"
                  >
                    <span className="flex items-center justify-center gap-3">
                      ENTRAR NO SISTEMA <LogIn size={20} className="group-hover:translate-x-1 transition-transform" />
                    </span>
                  </button>

                  <div className="relative flex items-center py-4">
                    <div className="flex-grow border-t border-white/5"></div>
                    <span className="flex-shrink mx-4 text-[10px] font-mono text-zinc-600 tracking-[0.3em] uppercase">ou</span>
                    <div className="flex-grow border-t border-white/5"></div>
                  </div>

                  <button 
                    onClick={() => setMode('REGISTER_CHOICE')}
                    className="glass-card hover:bg-white/10 flex items-center justify-between group"
                  >
                    <span className="text-xs font-display font-bold text-white/60 group-hover:text-white uppercase tracking-widest transition-colors flex items-center gap-3">
                      <UserPlus size={16} className="text-neon-green" /> SOLICITAR CREDENCIAIS
                    </span>
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-neon-green/20 transition-all">
                      <div className="w-1 h-1 bg-white group-hover:bg-neon-green rounded-full" />
                    </div>
                  </button>
                </div>
              </motion.div>
            )}

            {mode === 'LOGIN' && (
              <motion.form 
                key="login"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleLogin} 
                className="space-y-6"
              >
                <div className="space-y-4">
                  <h3 className="text-2xl font-display font-black text-white italic tracking-tight uppercase flex items-center gap-3">
                    Autenticação <LogIn className="text-neon-green" size={24} />
                  </h3>
                  <div className="space-y-3">
                    <input
                      type="email"
                      placeholder="E-MAIL INSTITUCIONAL"
                      className="tech-input focus:ring-1 ring-neon-green/20"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                    <input
                      type="password"
                      placeholder="CHAVE DE SEGURANÇA"
                      className="tech-input focus:ring-1 ring-neon-green/20"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
                
                <div className="pt-4 flex flex-col gap-4">
                  <button
                    disabled={loading}
                    className="tech-button"
                  >
                    {loading ? 'AUTENTICANDO...' : 'EXECUTAR LOGIN'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('INITIAL')}
                    className="text-[10px] text-zinc-600 hover:text-white font-mono uppercase tracking-[0.4em] transition-all py-2"
                  >
                    [[ VOLTAR AO PROTOCOLO ]]
                  </button>
                </div>
              </motion.form>
            )}

            {mode === 'REGISTER_CHOICE' && (
              <motion.div 
                key="choice"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="space-y-2">
                  <h3 className="text-2xl font-display font-black text-white italic tracking-tight uppercase">Novo Registro</h3>
                  <p className="text-zinc-500 font-mono text-[10px] uppercase tracking-widest">Selecione o setor de operação</p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <button
                    onClick={() => setMode('REGISTER_PARTNER')}
                    className="glass-card hover:bg-white/10 group p-8"
                  >
                    <div className="flex flex-col items-start gap-4">
                      <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center group-hover:bg-neon-green/20 transition-all">
                        <Phone className="text-zinc-500 group-hover:text-neon-green" size={24} />
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-display font-black text-white group-hover:text-neon-green uppercase transition-all mb-1">Setor Parceiro</div>
                        <div className="text-[10px] text-zinc-600 font-mono uppercase tracking-widest">Expedição e Comissões</div>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setMode('REGISTER_ADMIN')}
                    className="glass-card hover:bg-white/10 group p-8"
                  >
                    <div className="flex flex-col items-start gap-4">
                      <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center group-hover:bg-neon-green/20 transition-all">
                        <AlertCircle className="text-zinc-500 group-hover:text-neon-green" size={24} />
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-display font-black text-white group-hover:text-neon-green uppercase transition-all mb-1">Célula Admin</div>
                        <div className="text-[10px] text-zinc-600 font-mono uppercase tracking-widest">Gestão Total e QR Codes</div>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode('INITIAL')}
                    className="text-[10px] text-zinc-600 hover:text-white font-mono uppercase tracking-[0.4em] transition-all py-2 text-center"
                  >
                    [[ CANCELAR SOLICITAÇÃO ]]
                  </button>
                </div>
              </motion.div>
            )}

            {mode === 'SUCCESS' && (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12 space-y-8"
              >
                <div className="relative">
                  <motion.div 
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0.1, 0.5] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="absolute inset-0 bg-neon-green blur-3xl opacity-20 rounded-full"
                  />
                  <div className="w-24 h-24 bg-neon-green text-black rounded-full flex items-center justify-center mx-auto relative z-10 shadow-[0_0_50px_rgba(57,255,20,0.4)]">
                    <LogIn size={40} />
                  </div>
                </div>
                <div className="space-y-3">
                  <h2 className="text-3xl font-display font-black text-white italic tracking-tight uppercase">Bem-vindo</h2>
                  <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-[0.6em] animate-pulse">Iniciando Protocolos Operacionais...</p>
                </div>
              </motion.div>
            )}

            {(mode === 'REGISTER_PARTNER' || mode === 'REGISTER_ADMIN') && (
              <motion.form 
                key="register"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={(e) => handleRegister(e, mode === 'REGISTER_ADMIN' ? 'ADMIN' : 'PARTNER')} 
                className="space-y-6"
              >
                <div className="space-y-4">
                  <h3 className="text-2xl font-display font-black text-white italic tracking-tight uppercase">
                    {mode === 'REGISTER_ADMIN' ? 'Cadastro Admin' : 'Cadastro Parceiro'}
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    <input
                      placeholder="NOME COMPLETO"
                      className="tech-input focus:ring-1 ring-neon-green/20"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        placeholder="CPF"
                        className="tech-input focus:ring-1 ring-neon-green/20"
                        value={cpf}
                        onChange={(e) => setCpf(e.target.value)}
                        required
                      />
                      <input
                        placeholder="WHATSAPP"
                        className="tech-input focus:ring-1 ring-neon-green/20"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                      />
                    </div>
                    <input
                      type="email"
                      placeholder="E-MAIL"
                      className="tech-input focus:ring-1 ring-neon-green/20"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                    <input
                      type="password"
                      placeholder="DEFINIR SENHA"
                      className="tech-input focus:ring-1 ring-neon-green/20"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    {mode === 'REGISTER_PARTNER' && (
                      <input
                        placeholder="TOKEN DE AUTORIZAÇÃO"
                        className="tech-input border-neon-green/30 text-neon-green placeholder:text-neon-green/20 bg-neon-green/5"
                        value={adminCode}
                        onChange={(e) => setAdminCode(e.target.value)}
                        required
                      />
                    )}
                  </div>
                </div>

                <div className="pt-4 flex flex-col gap-4">
                  <button
                    disabled={loading}
                    className="tech-button"
                  >
                    {loading ? 'PROCESSANDO...' : 'FINALIZAR REGISTRO'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('REGISTER_CHOICE')}
                    className="text-[10px] text-zinc-600 hover:text-white font-mono uppercase tracking-[0.4em] transition-all py-2"
                  >
                    [[ ESCOLHER OUTRA CÉLULA ]]
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>

      {/* Footer Info */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-12 text-[9px] font-mono font-bold text-zinc-800 uppercase tracking-[0.5em] pointer-events-none">
        <span>Secure Access V4.2</span>
        <span>Operational Sync: Active</span>
        <span>E2E Encryption: Enabled</span>
      </div>
    </div>
  );
}
