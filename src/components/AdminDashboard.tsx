import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc, getDocs, addDoc, where, setDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { Lead, UserProfile, Invoice } from '../types';
import { 
  Users, LayoutDashboard, FileText, CheckCircle, Search, 
  MoreVertical, X, Check, Save, Download, Filter, 
  ArrowLeft, ArrowUp, Settings, Trash2, Camera, 
  List, LogOut, UserPlus, Fingerprint, Copy, RefreshCw,
  Zap, TrendingUp, Activity, ShieldCheck, Database
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { formatCurrency, formatDate, cn } from '../lib/utils';

export default function AdminDashboard({ profile, initialAppConfig }: { profile: UserProfile, initialAppConfig: any }) {
  const [leads, setLeads] = React.useState<Lead[]>([]);
  const [users, setUsers] = React.useState<UserProfile[]>([]);
  const [invoices, setInvoices] = React.useState<Invoice[]>([]);
  const [view, setView] = React.useState<'HOME' | 'LEADS_MANAGEMENT' | 'USER_MANAGEMENT' | 'FINANCIAL' | 'SETTINGS' | 'PARTNER_INVITE'>('HOME');
  const [selectedLead, setSelectedLead] = React.useState<Lead | null>(null);
  const [editLeadValue, setEditLeadValue] = React.useState('');
  const [editCommissionPercent, setEditCommissionPercent] = React.useState('10');
  const [inviteCode, setInviteCode] = React.useState('');
  const [broadcastMessage, setBroadcastMessage] = React.useState('');
  const [appConfig, setAppConfig] = React.useState(initialAppConfig || {
    companyName: 'UP TORQUE',
    primaryColor: '#39FF14',
    logoUrl: ''
  });

  React.useEffect(() => {
    const unsubLeads = onSnapshot(collection(db, 'leads'), (snap) => {
      setLeads(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lead)));
    }, (err) => console.error("Admin leads snapshot error:", err));
    
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      setUsers(snap.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile)));
    }, (err) => console.error("Admin users snapshot error:", err));
    
    const unsubInv = onSnapshot(collection(db, 'invoices'), (snap) => {
      setInvoices(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invoice)));
    }, (err) => console.error("Admin invoices snapshot error:", err));
    
    const unsubConfig = onSnapshot(doc(db, 'settings', 'app_config'), (snap) => {
      if (snap.exists()) {
        setAppConfig(snap.data() as any);
      }
    }, (err) => console.error("Admin config snapshot error:", err));

    return () => {
      unsubLeads();
      unsubUsers();
      unsubInv();
      unsubConfig();
    };
  }, []);

  const handleUpdateLead = async () => {
    if (!selectedLead) return;
    const value = parseFloat(editLeadValue);
    const percent = parseFloat(editCommissionPercent);
    
    if (isNaN(value) || isNaN(percent)) {
      alert('Por favor, insira valores numéricos válidos.');
      return;
    }

    const commission = (value * percent) / 100;

    await updateDoc(doc(db, 'leads', selectedLead.id), {
      serviceValue: value,
      commissionPercent: percent,
      commissionValue: commission,
      status: 'COMPLETED'
    });
    setSelectedLead(null);
  };

  const handleToggleUserStatus = async (user: UserProfile) => {
    const newStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    await updateDoc(doc(db, 'users', user.uid), { status: newStatus });
  };

  const handleExportCSV = async (type: 'leads' | 'invoices') => {
    // In a real app, this would trigger a download or API call
    console.log(`Exporting ${type} as CSV...`);
  };

  const statusMap: Record<string, string> = {
    'PENDING': 'PENDENTE',
    'IN_SERVICE': 'EM SERVIÇO',
    'COMPLETED': 'CONCLUÌDO',
    'REJECTED': 'REJEITADO',
    'PAID': 'PAGO',
    'OVERDUE': 'ATRASADO'
  };

  const handleResetPassword = async (email: string) => {
    if (!confirm(`Deseja enviar um e-mail de recuperação de senha para ${email}?`)) return;
    try {
      await sendPasswordResetEmail(auth, email);
      alert('E-mail de recuperação enviado com sucesso!');
    } catch (error: any) {
      alert('Erro ao enviar e-mail de recuperação: ' + error.message);
    }
  };

  const getTier = (count: number) => {
    if (count >= 50) return { name: 'Black Torque', color: 'text-neon-green', bg: 'bg-neon-green/10', glow: 'shadow-[0_0_20px_#39FF14]' };
    if (count >= 25) return { name: 'Ouro', color: 'text-yellow-400', bg: 'bg-yellow-400/10', glow: 'shadow-[0_0_20px_rgba(250,204,21,0.3)]' };
    if (count >= 10) return { name: 'Prata', color: 'text-zinc-400', bg: 'bg-zinc-400/10', glow: 'shadow-none' };
    return { name: 'Bronze', color: 'text-orange-600', bg: 'bg-orange-600/10', glow: 'shadow-none' };
  };

  const handleMonthlyClosure = async () => {
    const currentMonth = new Date().toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
    const partners = [...new Set(leads.map(l => l.partnerId))];
    
    for (const pId of partners) {
      const pLeads = leads.filter(l => l.partnerId === pId && l.status === 'COMPLETED');
      const total = pLeads.reduce((acc, l) => acc + (l.commissionValue || 0), 0);
      if (total > 0) {
        await addDoc(collection(db, 'invoices'), {
          partnerId: pId,
          month: currentMonth,
          totalAmount: total,
          status: 'PENDING',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString()
        });
      }
    }
    alert('Faturas geradas!');
  };

  const handleLogout = () => {
    auth.signOut();
  };

  const generateInviteCode = () => {
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    setInviteCode(code);
  };

  const handleSaveQRCode = () => {
    const svg = document.getElementById('qr-code-save-id');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      }
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `qrcode-invite-${inviteCode}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  const NavItem = ({ active, icon, label, onClick }: { active: boolean, icon: React.ReactNode, label: string, onClick: () => void }) => (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-center lg:justify-start gap-4 p-4 rounded-3xl transition-all duration-300 relative group",
        active ? "bg-neon-green text-black shadow-neon-glow" : "text-zinc-500 hover:text-white hover:bg-white/5"
      )}
    >
      <div className={cn("transition-transform group-hover:scale-110", active ? "scale-110" : "")}>
        {icon}
      </div>
      <span className="hidden lg:block text-xs font-display font-black uppercase tracking-widest">{label}</span>
      {active && (
        <motion.div 
          layoutId="nav-active"
          className="absolute inset-0 bg-neon-green rounded-3xl -z-10"
        />
      )}
    </button>
  );

  const StatCard = ({ label, value, subValue, icon: Icon, trend, colorClass }: any) => (
    <div className="bento-card group flex flex-col justify-between">
      <div className="flex justify-between items-start mb-6">
        <div className={cn("p-4 rounded-2xl bg-zinc-900 border border-zinc-800 transition-all duration-500 group-hover:border-neon-green/40 group-hover:bg-neon-green/5 group-hover:neon-glow", colorClass)}>
          <Icon size={24} />
        </div>
        {trend && (
          <div className="flex items-center gap-1 text-neon-green font-mono text-[10px] font-bold">
            <ArrowUp size={10} />
            {trend}
          </div>
        )}
      </div>
      <div>
        <span className="text-[10px] font-mono font-black text-zinc-600 uppercase tracking-[0.4em] mb-1 block">{label}</span>
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-display font-black text-white italic tracking-tighter">{value}</span>
          {subValue && <span className="text-[10px] font-mono text-zinc-500 uppercase">{subValue}</span>}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-dark-surface flex relative font-sans">
      <div className="fixed inset-0 tech-grid opacity-10 pointer-events-none" />

      {/* Sidebar */}
      <aside className="w-20 lg:w-72 bg-dark-card border-r border-dark-border flex flex-col p-6 sticky top-0 h-screen z-50 backdrop-blur-3xl bg-opacity-80">
        <div className="flex flex-col items-center lg:items-start gap-8 mb-12">
          {appConfig.logoUrl ? (
            <img src={appConfig.logoUrl} alt="Logo" className="h-14 w-auto object-contain filter drop-shadow-[0_0_15px_rgba(57,255,20,0.3)]" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-14 h-14 bg-neon-green rounded-2xl flex items-center justify-center font-display font-black italic text-black shadow-neon-glow text-xl">UP</div>
          )}
          <div className="hidden lg:block">
            <div className="text-xl font-display font-black italic text-white tracking-tighter uppercase leading-none">
              CENTRAL <span className="text-neon-green neon-text">TORQUE</span>
            </div>
            <div className="text-[9px] font-mono text-zinc-600 uppercase tracking-[0.4em] mt-1 font-bold">Protocolo Ativo</div>
          </div>
        </div>

        <nav className="flex-1 flex flex-col gap-2">
          <NavItem active={view === 'HOME'} icon={<LayoutDashboard size={20} />} label="Centro de Comando" onClick={() => setView('HOME')} />
          <NavItem active={view === 'LEADS_MANAGEMENT'} icon={<Zap size={20} />} label="Matriz de Leads" onClick={() => setView('LEADS_MANAGEMENT')} />
          <NavItem active={view === 'USER_MANAGEMENT'} icon={<Users size={20} />} label="Células de Parceiros" onClick={() => setView('USER_MANAGEMENT')} />
          <NavItem active={view === 'PARTNER_INVITE'} icon={<UserPlus size={20} />} label="Fidelizar Rede" onClick={() => setView('PARTNER_INVITE')} />
          <NavItem active={view === 'FINANCIAL'} icon={<Database size={20} />} label="Nexus Fiscal" onClick={() => setView('FINANCIAL')} />
          <NavItem active={view === 'SETTINGS'} icon={<Settings size={20} />} label="Config. Hardware" onClick={() => setView('SETTINGS')} />
        </nav>

        <div className="pt-8 flex flex-col gap-3">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center lg:justify-start gap-4 p-4 rounded-2xl text-zinc-600 hover:text-white transition-all hover:bg-white/5 font-display font-black uppercase text-[10px] tracking-widest"
          >
            <LogOut size={20} />
            <span className="hidden lg:block">ENCERRAR SESSÃO</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 lg:p-12 relative z-10 overflow-x-hidden">
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-1.5 h-6 bg-neon-green shadow-neon-glow" />
              <h2 className="text-3xl font-display font-black text-white italic tracking-tighter uppercase leading-none">
                {view === 'HOME' && 'Monitoramento de Rede'}
                {view === 'LEADS_MANAGEMENT' && 'Controle Operacional'}
                {view === 'USER_MANAGEMENT' && 'Matriz de Parceiros'}
                {view === 'PARTNER_INVITE' && 'Injeção de Rede'}
                {view === 'FINANCIAL' && 'Compensação Fiscal'}
                {view === 'SETTINGS' && 'Hardware & Scripts'}
              </h2>
            </div>
            <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.6em] font-bold">Status: Online // Admin: {profile.name.split(' ')[0]}</p>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => handleExportCSV('leads')}
              className="glass-card hover:bg-white/10 px-6 py-3 flex items-center gap-3 text-[10px] font-display font-black text-white uppercase tracking-widest transition-all"
            >
              <Download size={14} className="text-neon-green" /> DOWNLOAD_DATA
            </button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {view === 'HOME' && (
            <motion.div 
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              <StatCard label="Leads Totais" value={leads.length} subValue="Nós de dados" icon={Activity} trend="12.5%" colorClass="text-neon-green" />
              <StatCard label="Pendentes" value={leads.filter(l => l.status === 'PENDING').length} subValue="Processando" icon={RefreshCw} colorClass="text-orange-500" />
              <StatCard label="Receita Bruta" value={formatCurrency(leads.reduce((a, b) => a + (b.serviceValue || 0), 0))} icon={TrendingUp} trend="24%" colorClass="text-neon-green" />
              <StatCard label="Nexus Fiscal" value={formatCurrency(leads.reduce((a, b) => a + (b.commissionValue || 0), 0))} subValue="Retenção" icon={ShieldCheck} colorClass="text-neon-green" />

              <div className="col-span-1 md:col-span-2 bento-card p-0 overflow-hidden border-neon-green/20">
                <div className="p-8 border-b border-dark-border flex items-center justify-between">
                  <h3 className="text-sm font-display font-black text-white uppercase italic tracking-widest">Leads Críticos</h3>
                  <div className="h-2 w-2 bg-orange-500 rounded-full animate-pulse shadow-[0_0_10px_#f97316]" />
                </div>
                <div className="divide-y divide-dark-border">
                  {leads.filter(l => l.status === 'PENDING').slice(0, 5).map(lead => (
                    <div key={lead.id} className="p-6 flex items-center justify-between group hover:bg-white/5 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-dark-border flex items-center justify-center font-mono font-black italic text-neon-green group-hover:neon-glow transition-all">
                          {lead.clientName.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-display font-black text-white uppercase tracking-tight italic">{lead.clientName}</div>
                          <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest mt-0.5">{lead.vehicleType} // {formatDate(lead.createdAt)}</div>
                        </div>
                      </div>
                      <button 
                        onClick={() => setSelectedLead(lead)}
                        className="tech-button py-2 px-6 text-xs h-10 italic"
                      >
                        RESOLVER
                      </button>
                    </div>
                  ))}
                  {leads.filter(l => l.status === 'PENDING').length === 0 && (
                    <div className="p-12 text-center text-[10px] font-mono text-zinc-600 uppercase tracking-widest italic opacity-50">SISTEMA ESTÁVEL // NENHUM PENDENTE</div>
                  )}
                </div>
              </div>

              <div className="col-span-1 md:col-span-2 bento-card p-10 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-display font-black text-white uppercase italic tracking-widest mb-6">Desempenho da Rede</h3>
                  <div className="space-y-6">
                    {users.filter(u => u.role === 'PARTNER').slice(0, 3).map(user => {
                      const count = leads.filter(l => l.partnerId === user.uid && l.status === 'COMPLETED').length;
                      const tier = getTier(count);
                      return (
                        <div key={user.uid} className="space-y-2">
                          <div className="flex justify-between items-end">
                            <span className="text-xs font-display font-black text-zinc-400 uppercase tracking-tight">{user.name}</span>
                            <span className={cn("text-[9px] font-mono font-black uppercase tracking-widest", tier.color)}>{tier.name} // {count} LEADS</span>
                          </div>
                          <div className="h-1.5 bg-zinc-900 rounded-full border border-dark-border overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${(count / 50) * 100}%` }}
                              className={cn("h-full", tier.color.replace('text-', 'bg-'))}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <button 
                  onClick={() => setView('USER_MANAGEMENT')}
                  className="w-full py-4 text-[10px] font-mono text-zinc-600 hover:text-white transition-all uppercase tracking-[0.3em] font-black border-t border-dark-border mt-8 pt-6"
                >
                  VER TODA A ESTRUTURA DE REDE →
                </button>
              </div>
            </motion.div>
          )}

          {view === 'LEADS_MANAGEMENT' && (
            <motion.div 
              key="leads"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              {leads.map(lead => (
                <div key={lead.id} className="bento-card p-6 flex flex-col md:flex-row lg:items-center justify-between gap-6 group">
                  <div className="flex items-center gap-6">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center font-mono font-black italic shadow-2xl transition-all duration-500",
                      lead.status === 'PENDING' ? "bg-orange-500/20 text-orange-500 border border-orange-500/30" : "bg-neon-green/20 text-neon-green border border-neon-green/30 neon-glow"
                    )}>
                      {lead.clientName.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-xl font-display font-black text-white italic tracking-tighter uppercase">{lead.clientName}</h4>
                      <div className="flex flex-wrap items-center gap-4 mt-1">
                        <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest font-bold">{lead.vehicleType}</span>
                        <span className="text-[10px] font-mono text-zinc-700">//</span>
                        <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest font-bold">Origem: {users.find(u => u.uid === lead.partnerId)?.name || 'Rede Privada'}</span>
                        <span className="text-[10px] font-mono text-zinc-700">//</span>
                        <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest font-bold italic">{formatDate(lead.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="text-right hidden sm:block">
                      <div className="text-[9px] font-mono text-zinc-600 uppercase tracking-[0.2em] mb-1">Status_Atual</div>
                      <div className={cn(
                        "text-xs font-display font-black uppercase italic tracking-widest",
                        lead.status === 'PENDING' ? "text-orange-500" : "text-neon-green"
                      )}>{statusMap[lead.status]}</div>
                    </div>
                    <div className="flex gap-2">
                       {lead.status === 'PENDING' ? (
                         <button 
                           onClick={() => setSelectedLead(lead)}
                           className="tech-button px-8 h-12 text-xs"
                         >
                           PROCESSAR_NÓ
                         </button>
                       ) : (
                         <div className="text-right">
                           <div className="text-[9px] font-mono text-zinc-600 uppercase tracking-[0.2em] mb-1">Comissão_Devida</div>
                           <div className="text-2xl font-display font-black text-neon-green italic tracking-tighter neon-text">{formatCurrency(lead.commissionValue || 0)}</div>
                         </div>
                       )}
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {view === 'USER_MANAGEMENT' && (
            <motion.div 
              key="users"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {users.filter(u => u.role === 'PARTNER').map(user => {
                const count = leads.filter(l => l.partnerId === user.uid && l.status === 'COMPLETED').length;
                const tier = getTier(count);
                return (
                  <div key={user.uid} className="bento-card p-8 group relative overflow-hidden">
                    <div className={cn("absolute top-0 right-0 px-4 py-1 text-[8px] font-mono font-black uppercase tracking-[0.3em] rounded-bl-2xl", tier.bg, tier.color)}>
                      Nível {tier.name}
                    </div>
                    <div className="flex items-center gap-6 mb-8">
                      <div className="w-16 h-16 rounded-3xl bg-zinc-900 border border-dark-border flex items-center justify-center font-mono font-black italic text-zinc-700 group-hover:text-neon-green group-hover:border-neon-green transition-all duration-500">
                        {user.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-xl font-display font-black text-white italic tracking-tighter uppercase">{user.name}</h4>
                        <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">{user.email}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-8">
                      <div className="bg-black/40 p-4 rounded-2xl border border-white/5 italic">
                        <span className="text-[9px] font-mono text-zinc-600 uppercase mb-1 block">IDENTIFICADOR_CPF</span>
                        <span className="text-xs font-mono text-white tracking-widest">{user.cpf}</span>
                      </div>
                      <div className="bg-black/40 p-4 rounded-2xl border border-white/5 italic">
                        <span className="text-[9px] font-mono text-zinc-600 uppercase mb-1 block">CONVERSÕES_TOTIAS</span>
                        <span className="text-xs font-mono text-neon-green font-black">{count} LEADS</span>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button 
                        onClick={() => handleToggleUserStatus(user)}
                        className={cn(
                          "flex-1 h-12 rounded-2xl font-display font-black uppercase text-[10px] tracking-widest transition-all",
                          user.status === 'ACTIVE' ? "bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20" : "bg-neon-green/10 text-neon-green border border-neon-green/20 hover:bg-neon-green/20"
                        )}
                      >
                        {user.status === 'ACTIVE' ? 'REVOGAR ACESSO' : 'RESTAURAR ACESSO'}
                      </button>
                      <button 
                        onClick={() => handleResetPassword(user.email)}
                        className="w-12 h-12 bg-zinc-900 rounded-2xl flex items-center justify-center text-zinc-600 hover:text-white transition-all border border-dark-border"
                      >
                        <RefreshCw size={18} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}

          {view === 'PARTNER_INVITE' && (
            <motion.div 
              key="invite"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-2xl mx-auto space-y-8 py-12"
            >
              <div className="bento-card p-12 text-center space-y-8">
                <div className="w-24 h-24 bg-neon-green/10 rounded-[2.5rem] flex items-center justify-center mx-auto border border-neon-green/20 shadow-neon-glow mb-4">
                  <Fingerprint size={48} className="text-neon-green" />
                </div>
                <div>
                  <h3 className="text-3xl font-display font-black text-white italic tracking-tighter uppercase mb-2">Geração de Handshake</h3>
                  <p className="text-zinc-500 text-sm font-light leading-relaxed max-w-sm mx-auto">Gere um código de autorização temporária para novos parceiros escalarem a rede Up Torque.</p>
                </div>

                <div className="bg-black/60 p-8 rounded-3xl border border-white/5 space-y-6">
                  {inviteCode ? (
                    <div className="space-y-6 animate-in zoom-in-95 duration-500">
                      <div className="relative group inline-block mx-auto mb-4">
                        <div className="absolute inset-0 bg-neon-green blur-[40px] opacity-10 group-hover:opacity-20 transition-all rounded-full" />
                        <div className="bg-white p-6 rounded-3xl shadow-2xl relative z-10 transition-transform hover:scale-105 duration-500">
                          <QRCodeSVG 
                            id="qr-code-save-id"
                            value={inviteCode} 
                            size={180}
                            level="H"
                            includeMargin={false}
                          />
                        </div>
                      </div>
                      <div className="text-4xl font-mono font-black text-neon-green tracking-[0.2em] neon-text">{inviteCode}</div>
                      
                      <div className="flex flex-col items-center gap-6 mt-8">
                        <button 
                          onClick={handleSaveQRCode}
                          className="tech-button px-12 py-5 flex items-center justify-center gap-4 shadow-neon-glow-lg group"
                        >
                          <div className="bg-black/20 p-2 rounded-lg group-hover:bg-black/30 transition-colors">
                            <Save size={20} className="text-black" />
                          </div>
                          <span className="text-lg">SALVAR ARQUIVO</span>
                        </button>

                        <div className="flex gap-4 w-full">
                          <button 
                            onClick={() => { navigator.clipboard.writeText(inviteCode); alert('Código copiado!'); }}
                            className="flex-1 glass-card bg-white/5 border-white/10 hover:bg-white/10 flex items-center justify-center gap-3 py-4 text-xs font-display font-black uppercase tracking-widest"
                          >
                            <Copy size={16} /> COPIAR_TOKEN
                          </button>
                          <button 
                            onClick={generateInviteCode}
                            className="w-14 h-14 glass-card flex items-center justify-center text-zinc-400 hover:text-neon-green transition-all"
                          >
                            <RefreshCw size={20} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button 
                      onClick={generateInviteCode}
                      className="tech-button w-full h-20 text-xl italic"
                    >
                      GERAR TOKEN DE ACESSO
                    </button>
                  )}
                </div>
                <p className="text-[10px] font-mono text-zinc-800 uppercase tracking-[0.5em] font-black">Protocolo de Criptografia Ativo: RSA-4096</p>
              </div>
            </motion.div>
          )}

          {view === 'SETTINGS' && (
            <motion.div 
               key="settings"
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               className="grid grid-cols-1 md:grid-cols-2 gap-8"
            >
              <div className="bento-card p-10 space-y-8">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-neon-green/10 rounded-xl flex items-center justify-center text-neon-green">
                    <Settings size={20} />
                  </div>
                  <h3 className="text-xl font-display font-black text-white italic uppercase tracking-widest leading-none">Arquitetura de Marca</h3>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-mono font-black text-zinc-600 uppercase tracking-widest ml-1">Label Operacional</label>
                    <input 
                      className="tech-input h-14"
                      value={appConfig.companyName}
                      onChange={(e) => setAppConfig({...appConfig, companyName: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-mono font-black text-zinc-600 uppercase tracking-widest ml-1">Matriz de Imagem (Logo URL)</label>
                    <div className="flex gap-4">
                      <input 
                        className="tech-input h-14 flex-1"
                        value={appConfig.logoUrl}
                        onChange={(e) => setAppConfig({...appConfig, logoUrl: e.target.value})}
                      />
                      <div className="w-14 h-14 glass-card p-2 flex items-center justify-center overflow-hidden shrink-0">
                        {appConfig.logoUrl ? <img src={appConfig.logoUrl} className="w-full h-full object-contain" referrerPolicy="no-referrer" /> : <Camera size={20} className="text-zinc-700" />}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setDoc(doc(db, 'settings', 'app_config'), appConfig).then(() => alert('Configurações salvas!'))}
                    className="tech-button w-full mt-4 italic"
                  >
                    SALVAR_ARQUITETURA
                  </button>
                </div>
              </div>

              <div className="bento-card p-10 space-y-8">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 bg-neon-green/10 rounded-xl flex items-center justify-center text-neon-green">
                    <Activity size={20} />
                  </div>
                  <h3 className="text-xl font-display font-black text-white italic uppercase tracking-widest leading-none">Broadcast Global</h3>
                </div>
                <p className="text-zinc-500 text-xs font-light tracking-wide leading-relaxed">Dispare uma diretriz operacional para todos os nós da rede instantaneamente.</p>
                <textarea 
                  className="tech-input min-h-[160px] py-6 resize-none"
                  placeholder="DIGITE O PROTOCOLO DE MENSAGEM..."
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                />
                <button 
                   onClick={async () => {
                     if (!broadcastMessage.trim()) return;
                     await setDoc(doc(db, 'settings', 'broadcast'), { message: broadcastMessage, timestamp: new Date().toISOString(), author: profile.name });
                     alert('Broadcast enviado!');
                     setBroadcastMessage('');
                   }}
                   className="tech-button w-full italic bg-white text-black hover:bg-neon-green"
                >
                  DISPARAR COMUNICADO
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Selected Lead Modal */}
        {selectedLead && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-12">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="absolute inset-0 bg-black/90 backdrop-blur-3xl"
              onClick={() => setSelectedLead(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="w-full max-w-xl bento-card border-neon-green/30 bg-black relative z-10 p-10 space-y-10"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-3xl font-display font-black text-white italic tracking-tighter uppercase leading-none">Resolução de Lead</h3>
                  <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.4em] mt-2 font-bold italic">Processamento Final de Transação</p>
                </div>
                <button onClick={() => setSelectedLead(null)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-zinc-600 hover:text-white transition-all">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="bg-zinc-900 border border-dark-border p-6 rounded-3xl space-y-2">
                  <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest font-black italic">Identidade_do_Lead</span>
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-neon-green/10 flex items-center justify-center text-neon-green text-[10px] font-mono font-bold border border-neon-green/20 italic">ID</div>
                    <span className="text-lg font-display font-black text-white uppercase italic tracking-tight">{selectedLead.clientName}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono font-black text-zinc-600 uppercase tracking-widest ml-1 italic">Valor do Serviço</label>
                    <input 
                      type="number"
                      className="tech-input h-16 text-2xl font-display font-black italic italic tracking-tighter"
                      placeholder="0.00"
                      value={editLeadValue}
                      onChange={(e) => setEditLeadValue(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono font-black text-zinc-600 uppercase tracking-widest ml-1 italic">Razão de Comiss. %</label>
                    <input 
                      type="number"
                      className="tech-input h-16 text-2xl font-display font-black italic italic tracking-tighter"
                      placeholder="10"
                      value={editCommissionPercent}
                      onChange={(e) => setEditCommissionPercent(e.target.value)}
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    onClick={handleUpdateLead}
                    className="tech-button w-full h-20 text-lg italic shadow-[0_0_50px_rgba(57,255,20,0.3)]"
                  >
                    FINALIZAR LIQUIDAÇÃO
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
}
