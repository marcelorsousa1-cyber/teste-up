import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, where, onSnapshot, doc, updateDoc, orderBy } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Lead, UserProfile, Invoice } from '../types';
import { 
  Plus, List, Wallet, FileText, CheckCircle, Clock, QrCode, 
  ArrowLeft, LayoutDashboard, LogOut, X, Zap, Target, Shield, Award,
  ArrowUpRight, TrendingUp, Bell, Save
} from 'lucide-react';
import { formatCurrency, formatDate, cn } from '../lib/utils';
import LeadForm from './LeadForm';
import { QRCodeSVG } from 'qrcode.react';

export default function PartnerDashboard({ profile, appConfig }: { profile: UserProfile, appConfig: { companyName: string, logoUrl: string } }) {
  const [leads, setLeads] = React.useState<Lead[]>([]);
  const [invoices, setInvoices] = React.useState<Invoice[]>([]);
  const [view, setView] = React.useState<'HOME' | 'NEW_LEAD' | 'LEADS_LIST' | 'FINANCE' | 'QR_CODE'>('HOME');
  const [selectedLead, setSelectedLead] = React.useState<Lead | null>(null);
  const [broadcast, setBroadcast] = React.useState<any>(null);

  React.useEffect(() => {
    if (!auth.currentUser) return;
    
    const qLeads = query(
      collection(db, 'leads'), 
      where('partnerId', '==', auth.currentUser.uid)
    );
    const unsubLeads = onSnapshot(qLeads, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lead));
      data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setLeads(data);
    }, (err) => console.error("Partner leads error:", err));

    const qInv = query(
      collection(db, 'invoices'),
      where('partnerId', '==', auth.currentUser.uid)
    );
    const unsubInv = onSnapshot(qInv, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invoice));
      data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setInvoices(data);
    }, (err) => console.error("Partner invoices error:", err));

    const unsubBroadcast = onSnapshot(doc(db, 'settings', 'broadcast'), (snap) => {
      if (snap.exists()) {
        setBroadcast(snap.data());
      }
    }, (err) => console.error("Partner broadcast error:", err));

    return () => {
      unsubLeads();
      unsubInv();
      unsubBroadcast();
    };
  }, []);

  const paidCommissions = leads.filter(l => l.status === 'COMPLETED').reduce((acc, lead) => acc + (lead.commissionValue || 0), 0);
  const completedCount = leads.filter(l => l.status === 'COMPLETED').length;
  
  const getTier = (count: number) => {
    if (count >= 50) return { name: 'Black Torque', color: 'text-neon-green', bg: 'bg-neon-green/10', border: 'border-neon-green/30', text: 'Nível Máximo Atingido', icon: Zap, next: null };
    if (count >= 25) return { name: 'Ouro', color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/30', text: 'Rumo ao Black Torque', icon: Award, next: 50 };
    if (count >= 10) return { name: 'Prata', color: 'text-zinc-400', bg: 'bg-zinc-400/10', border: 'border-zinc-400/30', text: 'Rumo ao Ouro', icon: Shield, next: 25 };
    return { name: 'Bronze', color: 'text-orange-600', bg: 'bg-orange-600/10', border: 'border-orange-600/30', text: 'Iniciando Trajetória', icon: Target, next: 10 };
  };

  const currentTier = getTier(completedCount);

  const statusMap: Record<string, string> = {
    'PENDING': 'PENDENTE',
    'IN_SERVICE': 'EM SERVIÇO',
    'COMPLETED': 'EXECUTADO',
    'REJECTED': 'ABORTADO',
    'PAID': 'LIQUIDADO',
    'OVERDUE': 'CRÍTICO'
  };

  const stats = [
    { label: 'Indicações Totais', value: leads.length, icon: List, color: 'text-white' },
    { label: 'Convertidos', value: completedCount, icon: CheckCircle, color: 'text-neon-green' },
    { label: 'Saldo de Comissões', value: formatCurrency(paidCommissions), icon: Wallet, color: 'text-neon-green' },
    { label: 'Processando', value: leads.filter(l => l.status === 'PENDING').length, icon: Clock, color: 'text-orange-500' }
  ];

  const handleLogout = () => {
    auth.signOut();
  };

  const handleSaveQRCode = () => {
    const svg = document.getElementById('qr-code-partner-id');
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
      downloadLink.download = `invite-up-torque.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  const NavItem = ({ active, icon: Icon, label, onClick }: any) => (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-center lg:justify-start gap-4 p-4 rounded-3xl transition-all duration-300 relative group",
        active ? "bg-neon-green text-black shadow-neon-glow" : "text-zinc-500 hover:text-white hover:bg-white/5"
      )}
    >
      <div className={cn("transition-transform group-hover:scale-110", active ? "scale-110" : "")}>
        <Icon size={20} />
      </div>
      <span className="hidden lg:block text-[10px] font-display font-black uppercase tracking-widest">{label}</span>
      {active && (
        <motion.div 
          layoutId="nav-active-partner"
          className="absolute inset-0 bg-neon-green rounded-3xl -z-10"
        />
      )}
    </button>
  );

  return (
    <div className="min-h-screen bg-dark-surface flex relative font-sans">
      <div className="fixed inset-0 tech-grid opacity-10 pointer-events-none" />

      {/* Sidebar */}
      <aside className="w-20 lg:w-72 bg-dark-card border-r border-dark-border flex flex-col p-6 sticky top-0 h-screen z-50 backdrop-blur-3xl bg-opacity-80">
        <div className="flex flex-col items-center lg:items-start gap-8 mb-12">
          {appConfig.logoUrl ? (
            <img src={appConfig.logoUrl} alt="Logo" className="h-10 w-auto object-contain filter drop-shadow-[0_0_10px_rgba(57,255,20,0.3)]" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-12 h-12 bg-neon-green rounded-2xl flex items-center justify-center font-display font-black italic text-black shadow-neon-glow text-lg">UP</div>
          )}
          <div className="hidden lg:block">
            <div className="text-lg font-display font-black italic text-white tracking-tighter uppercase leading-none">
              DASHBOARD <span className="text-neon-green neon-text">TORQUE</span>
            </div>
            <div className="text-[8px] font-mono text-zinc-600 uppercase tracking-[0.4em] mt-1 font-bold">Acesso Parceiro</div>
          </div>
        </div>

        <nav className="flex-1 flex flex-col gap-2">
          <NavItem active={view === 'HOME'} icon={LayoutDashboard} label="Visão Geral" onClick={() => setView('HOME')} />
          <NavItem active={view === 'NEW_LEAD'} icon={Plus} label="Novo Registro" onClick={() => setView('NEW_LEAD')} />
          <NavItem active={view === 'LEADS_LIST'} icon={List} label="Protocolos Gerados" onClick={() => setView('LEADS_LIST')} />
          <NavItem active={view === 'FINANCE'} icon={Wallet} label="Liquidação Fiscal" onClick={() => setView('FINANCE')} />
          <NavItem active={view === 'QR_CODE'} icon={QrCode} label="Meu QR Código" onClick={() => setView('QR_CODE')} />
        </nav>

        <div className="pt-8">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center lg:justify-start gap-4 p-4 rounded-2xl text-zinc-600 hover:text-white transition-all hover:bg-white/5 font-display font-black uppercase text-[10px] tracking-widest"
          >
            <LogOut size={18} />
            <span className="hidden lg:block">SAIR DO SISTEMA</span>
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
                {view === 'HOME' && `Bem-vindo, ${profile.name.split(' ')[0]}`}
                {view === 'NEW_LEAD' && 'Enviar Novo Protocolo'}
                {view === 'LEADS_LIST' && 'Monitoramento de Indicações'}
                {view === 'FINANCE' && 'Matriz de Pagamentos'}
                {view === 'QR_CODE' && 'Identificador QR'}
              </h2>
            </div>
            <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.6em] font-bold">Identificador: {profile.uid.substring(0, 8).toUpperCase()} // {formatDate(new Date().toISOString())}</p>
          </div>

          <div className="flex items-center gap-4">
             <div className={cn("px-6 py-3 rounded-2xl border flex items-center gap-4 bg-opacity-10 backdrop-blur-md", currentTier.border, currentTier.bg)}>
                <currentTier.icon size={18} className={currentTier.color} />
                <div className="text-right">
                  <div className={cn("text-xs font-display font-black uppercase tracking-widest italic", currentTier.color)}>{currentTier.name}</div>
                  <div className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest font-bold">Rank de Prestígio</div>
                </div>
             </div>
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
              {broadcast && (
                <div className="col-span-full bento-card border-neon-green/30 bg-neon-green/5 p-8 flex items-center justify-between group overflow-hidden relative">
                   <div className="flex items-center gap-6 relative z-10">
                     <div className="w-14 h-14 rounded-2xl bg-neon-green flex items-center justify-center text-black shadow-neon-glow shrink-0">
                       <Bell size={24} className="animate-bounce" />
                     </div>
                     <div>
                       <span className="text-[10px] font-mono font-black text-neon-green tracking-[0.4em] uppercase mb-1 block">COMUNICADO OBRIGATÓRIO</span>
                       <p className="text-white text-lg font-medium tracking-tight italic">{broadcast.message}</p>
                     </div>
                   </div>
                   <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-all">
                     <Bell size={80} />
                   </div>
                </div>
              )}

              <div className="col-span-full lg:col-span-8 bento-card p-10 flex flex-col md:flex-row items-center justify-between gap-12 border-l-4 border-l-neon-green relative overflow-hidden">
                <div className="flex items-center gap-8 relative z-10">
                  <div className={cn("w-24 h-24 rounded-[2rem] flex items-center justify-center border-2 shadow-2xl transition-all duration-700", currentTier.bg, currentTier.border)}>
                    <currentTier.icon size={40} className={currentTier.color} />
                  </div>
                  <div>
                    <h3 className="text-4xl font-display font-black text-white italic tracking-tighter uppercase mb-1 leading-none">{currentTier.name}</h3>
                    <p className="text-xs text-zinc-500 font-mono uppercase tracking-[0.4em] font-medium">{currentTier.text}</p>
                    <div className="flex items-center gap-4 mt-4 text-[10px] font-mono font-black text-neon-green uppercase tracking-widest bg-neon-green/10 px-3 py-1.5 rounded-lg w-fit">
                      <TrendingUp size={12} /> {completedCount} Metas Batidas
                    </div>
                  </div>
                </div>

                {currentTier.next && (
                  <div className="w-full max-w-sm relative z-10">
                    <div className="flex justify-between items-end mb-3">
                      <span className="text-[10px] font-mono font-bold text-zinc-600 uppercase tracking-widest italic">Progressão de Evolução</span>
                      <span className="text-xs font-display font-black text-white italic">{Math.round((completedCount / currentTier.next) * 100)}%</span>
                    </div>
                    <div className="h-2 bg-zinc-900 rounded-full border border-dark-border overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(completedCount / currentTier.next) * 100}%` }}
                        className="h-full bg-neon-green shadow-neon-glow"
                      />
                    </div>
                    <p className="text-[8px] font-mono text-zinc-700 mt-2 text-right uppercase tracking-[0.2em] font-black italic">Mais {currentTier.next - completedCount} unidades para subir de categoria</p>
                  </div>
                )}
                
                <div className="absolute right-0 top-0 w-64 h-64 bg-neon-green/5 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {stats.map((stat, i) => (
                <div key={i} className="bento-card p-8 flex flex-col justify-between group">
                  <div className="flex justify-between items-start mb-6 font-mono">
                    <div className={cn("p-3 rounded-xl bg-zinc-900 border border-dark-border group-hover:border-neon-green/40 transition-all", stat.color)}>
                      <stat.icon size={20} />
                    </div>
                    <div className="text-[8px] tracking-[0.4em] uppercase text-zinc-700 font-black italic">Data_Source</div>
                  </div>
                  <div>
                    <span className="text-[9px] font-mono font-black text-zinc-600 uppercase tracking-[0.4em] mb-1 block italic">{stat.label}</span>
                    <div className={cn("text-2xl font-display font-black italic tracking-tighter transition-all group-hover:scale-105 origin-left", stat.color)}>
                      {stat.value}
                    </div>
                  </div>
                </div>
              ))}

              <div className="col-span-full bento-card p-0 overflow-hidden border-dark-border bg-opacity-40">
                <div className="p-8 border-b border-dark-border flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-display font-black text-white uppercase italic tracking-widest">Protocolos Recentes</h3>
                    <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest mt-1">Últimos nós processados na rede</p>
                  </div>
                  <button onClick={() => setView('LEADS_LIST')} className="text-[10px] font-display font-black text-neon-green hover:underline uppercase tracking-widest">Ver Histórico Pleno</button>
                </div>
                <div className="divide-y divide-dark-border">
                  {leads.slice(0, 3).map(lead => (
                    <div key={lead.id} className="p-6 flex flex-col md:flex-row items-center justify-between gap-6 group hover:bg-white/5 transition-all">
                      <div className="flex items-center gap-6">
                        <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-dark-border flex items-center justify-center font-mono font-black text-neon-green group-hover:neon-glow transition-all">
                          {lead.clientName.charAt(0)}
                        </div>
                        <div>
                          <div className="text-lg font-display font-black text-white uppercase tracking-tight italic">{lead.clientName}</div>
                          <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest mt-0.5">{lead.vehicleType} // {formatDate(lead.createdAt)}</div>
                        </div>
                      </div>
                      <div className={cn(
                        "font-display font-black text-xs uppercase tracking-widest italic rounded-full px-6 py-2 border",
                        lead.status === 'PENDING' ? "border-orange-500/30 text-orange-500 bg-orange-500/5" : "border-neon-green/30 text-neon-green bg-neon-green/5 neon-glow"
                      )}>
                        {statusMap[lead.status] || lead.status}
                      </div>
                    </div>
                  ))}
                  {leads.length === 0 && (
                    <div className="p-12 text-center text-[10px] font-mono text-zinc-600 uppercase tracking-[0.4em] italic opacity-40">-- FILA DE LOGS VAZIA --</div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {view === 'NEW_LEAD' && (
            <motion.div 
               key="new-lead"
               initial={{ opacity: 0, scale: 0.98 }}
               animate={{ opacity: 1, scale: 1 }}
               className="max-w-4xl mx-auto"
            >
              <div className="bento-card p-10 lg:p-16 border-neon-green/30 shadow-[0_0_80px_rgba(57,255,20,0.05)]">
                <div className="flex flex-col items-center text-center mb-16 space-y-4">
                  <div className="w-20 h-20 bg-neon-green/10 rounded-3xl flex items-center justify-center text-neon-green shadow-neon-glow border border-neon-green/30">
                    <Plus size={32} />
                  </div>
                  <div>
                    <h3 className="text-4xl font-display font-black text-white italic tracking-tighter uppercase leading-none">Novo Fluxo de Lead</h3>
                    <p className="text-zinc-500 text-sm font-mono mt-2 uppercase tracking-[0.5em] italic">Injeção_de_Protocolo_Alpha</p>
                  </div>
                </div>
                <LeadForm onSuccess={() => setView('HOME')} />
              </div>
            </motion.div>
          )}

          {view === 'LEADS_LIST' && (
            <motion.div 
               key="leads-list"
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               className="grid grid-cols-1 gap-4"
            >
              {leads.map(lead => (
                <div key={lead.id} className="bento-card p-6 flex flex-col md:flex-row items-center justify-between gap-6 group hover:bg-white/[0.04] transition-all relative overflow-hidden italic">
                  <div className="flex items-center gap-6 relative z-10 italic">
                    <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-dark-border flex items-center justify-center font-mono font-black text-white text-lg group-hover:text-neon-green transition-colors">
                      {lead.clientName.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-xl font-display font-black text-white uppercase italic tracking-tighter">{lead.clientName}</h4>
                      <div className="flex items-center gap-3 mt-1 text-[10px] font-mono font-black text-zinc-600 uppercase tracking-widest italic opacity-60">
                        <span>{lead.vehicleType}</span>
                        <span>//</span>
                        <span>CRIAÇÃO: {formatDate(lead.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-8 relative z-10 w-full md:w-auto justify-between md:justify-end">
                    <div className="text-right">
                      <div className="text-[8px] font-mono text-zinc-700 uppercase tracking-widest mb-1 italic font-black">Status_Interno</div>
                      <div className={cn(
                        "text-xs font-display font-black uppercase italic tracking-widest",
                        lead.status === 'PENDING' ? "text-orange-500" : "text-neon-green"
                      )}>{statusMap[lead.status] || lead.status}</div>
                    </div>
                    <div className="text-right border-l border-dark-border pl-8 italic">
                      <div className="text-[8px] font-mono text-zinc-700 uppercase tracking-widest mb-1 italic font-black">Ticket_Previsto</div>
                      <div className="text-2xl font-display font-black text-white italic tracking-tighter">
                        {lead.commissionValue ? formatCurrency(lead.commissionValue) : 'S/V'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {leads.length === 0 && (
                <div className="py-24 text-center bento-card opacity-40 italic">
                   <p className="text-xs font-mono text-zinc-700 uppercase tracking-[0.5em] font-black italic">-- NENHUM PROTOCOLO EXECUTADO NESTE TERMINAL --</p>
                </div>
              )}
            </motion.div>
          )}

          {view === 'FINANCE' && (
            <motion.div 
               key="finance"
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               className="space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bento-card p-10 bg-neon-green/5 border-neon-green/20 relative overflow-hidden group">
                  <div className="relative z-10">
                    <span className="text-[10px] font-mono font-black text-neon-green uppercase tracking-[0.5em] mb-3 block">Créditos Pagos</span>
                    <div className="text-5xl font-display font-black text-white italic tracking-tighter filter drop-shadow-[0_0_15px_#39FF14]">{formatCurrency(paidCommissions)}</div>
                    <p className="text-[10px] font-mono text-zinc-600 mt-4 uppercase tracking-[0.3em] italic">Compensação total líquida processada</p>
                  </div>
                  <div className="absolute right-0 bottom-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700">
                    <TrendingUp size={120} className="text-neon-green" />
                  </div>
                </div>

                <div className="bento-card p-10 italic">
                   <span className="text-[10px] font-mono font-black text-zinc-600 uppercase tracking-[0.5em] mb-4 block italic">Diferencial de Alíquota</span>
                   <div className="flex items-center gap-6 italic">
                     <div className="flex-1">
                       <div className="text-4xl font-display font-black text-white italic tracking-tighter mb-1">Status Ativo</div>
                       <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest italic font-bold">Protocolos em conformidade fiscal</p>
                     </div>
                     <Shield size={64} className="text-neon-green opacity-20" />
                   </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 italic font-black">
                <h3 className="text-[10px] font-mono font-black text-zinc-700 uppercase tracking-[0.6em] ml-6 mb-2">Relatórios_de_Liquidação_Nexus</h3>
                {invoices.map(inv => (
                  <div key={inv.id} className="bento-card p-8 flex items-center justify-between group hover:border-white/10 transition-all italic">
                    <div className="flex items-center gap-8">
                       <div className="w-16 h-16 rounded-3xl bg-zinc-900 border border-dark-border flex items-center justify-center text-zinc-700 group-hover:text-neon-green group-hover:border-neon-green transition-all shadow-xl">
                         <FileText size={24} />
                       </div>
                       <div>
                         <div className="text-2xl font-display font-black text-white uppercase italic tracking-tighter mb-1">{inv.month}</div>
                         <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest italic opacity-60 font-black italic">Expiração Focal: {formatDate(inv.dueDate)}</div>
                       </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-display font-black text-neon-green neon-text italic tracking-tighter mb-2 italic">{formatCurrency(inv.totalAmount)}</div>
                      <div className={cn(
                        "text-[9px] font-mono font-black px-4 py-1.5 rounded-full uppercase tracking-widest inline-block border",
                        inv.status === 'PAID' ? "bg-neon-green/10 text-neon-green border-neon-green/30" : "bg-red-500/10 text-red-500 border-red-500/30"
                      )}>{statusMap[inv.status] || inv.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {view === 'QR_CODE' && (
            <motion.div 
               key="qr-code"
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               className="max-w-2xl mx-auto py-12 flex flex-col items-center"
            >
              <div className="bento-card p-12 text-center space-y-12 w-full border-neon-green/20 relative shadow-[0_0_100px_rgba(57,255,20,0.05)] italic">
                <div className="text-center space-y-2 italic">
                  <h3 className="text-3xl font-display font-black text-white italic tracking-tighter uppercase leading-none">Nó de Convite Alpha</h3>
                  <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.6em] font-black">Handshake de Identidade Visual</p>
                </div>

                <div className="relative group">
                  <div className="absolute inset-0 bg-neon-green blur-[80px] opacity-10 group-hover:opacity-25 transition-all duration-700 animate-pulse" />
                  <div className="bg-white p-12 rounded-[3.5rem] shadow-[0_0_60px_rgba(57,255,20,0.2)] relative z-10 inline-block">
                    <QRCodeSVG 
                      id="qr-code-partner-id"
                      value={`https://${window.location.host}/register?code=${profile.adminCode}`} 
                      size={280}
                      level="H"
                      includeMargin={false}
                    />
                  </div>
                </div>

                <div className="flex justify-center">
                  <button 
                    onClick={handleSaveQRCode}
                    className="tech-button px-14 py-6 flex items-center justify-center gap-4 shadow-neon-glow-lg group"
                  >
                    <div className="bg-black/20 p-2 rounded-lg group-hover:bg-black/30 transition-colors">
                      <Save size={24} className="text-black" />
                    </div>
                    <span className="text-xl">SALVAR ARQUIVO</span>
                  </button>
                </div>

                <div className="space-y-6 max-w-sm mx-auto">
                   <div className="p-6 bg-zinc-900 border border-dark-border rounded-3xl italic">
                     <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest block mb-1 font-black italic">Token_da_Rede</span>
                     <span className="text-2xl font-display font-black text-white italic uppercase tracking-widest">{profile.adminCode || 'X7-ALPHA'}</span>
                   </div>
                   <p className="text-[11px] font-mono text-zinc-500 uppercase tracking-widest leading-relaxed opacity-60 font-medium">Aponte a ótica do terminal móvel para este padrão criptográfico para sincronizar instantaneamente um novo lead.</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom spacer for mobile */}
        <div className="md:hidden h-24" />
      </main>
    </div>
  );
}
