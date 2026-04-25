import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { VehicleType } from '../types';
import { MapPin, Info, Car, Truck, Bike, Tractor, User, Phone, Check, Loader2, Satellite } from 'lucide-react';
import { cn } from '../lib/utils';

export default function LeadForm({ onSuccess }: { onSuccess: () => void }) {
  const [clientName, setClientName] = React.useState('');
  const [clientPhone, setClientPhone] = React.useState('');
  const [vehicleType, setVehicleType] = React.useState<VehicleType>('Carro');
  const [location, setLocation] = React.useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [step, setStep] = React.useState(1);

  const captureLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
        },
        (err) => console.error("Error capturing location", err),
        { enableHighAccuracy: true }
      );
    }
  };

  React.useEffect(() => {
    captureLocation();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    
    setLoading(true);
    try {
      await addDoc(collection(db, 'leads'), {
        partnerId: auth.currentUser.uid,
        clientName: clientName.toUpperCase(),
        clientPhone,
        vehicleType,
        location,
        status: 'PENDING',
        createdAt: new Date().toISOString()
      });
      onSuccess();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const vehicleIcons = {
    'Carro': Car,
    'Caminhão': Truck,
    'Camionete': Truck, 
    'Moto': Bike,
    'Agrícola': Tractor
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl mx-auto italic">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Client Name */}
        <div className="space-y-3">
          <label className="text-[10px] font-mono font-black text-zinc-600 uppercase tracking-[0.4em] ml-2 italic">IDENTIDADE_DO_ALVO</label>
          <div className="relative group italic">
            <User className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-700 group-focus-within:text-neon-green transition-colors duration-500" size={20} />
            <input
              placeholder="NOME_OU_RAZAO_SOCIAL"
              className="tech-input pl-16 h-16 text-lg italic tracking-tight"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Client Phone */}
        <div className="space-y-3">
          <label className="text-[10px] font-mono font-black text-zinc-600 uppercase tracking-[0.4em] ml-2 italic">PROTOCOLO_COMMS</label>
          <div className="relative group italic">
            <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-700 group-focus-within:text-neon-green transition-colors duration-500" size={20} />
            <input
              placeholder="(00) 00000-0000"
              className="tech-input pl-16 h-16 text-lg italic tracking-tight"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              required
            />
          </div>
        </div>
      </div>

      {/* Vehicle Type Selection */}
      <div className="space-y-4">
        <label className="text-[10px] font-mono font-black text-zinc-600 uppercase tracking-[0.4em] ml-2 italic">SISTEMA_DE_LOCOMOÇÃO</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 italic">
          {(Object.entries(vehicleIcons)).map(([type, Icon]) => {
            const isActive = vehicleType === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => setVehicleType(type as VehicleType)}
                className={cn(
                  "relative h-24 rounded-3xl border-2 flex flex-col items-center justify-center gap-2 transition-all duration-500 group overflow-hidden",
                  isActive 
                    ? "bg-neon-green/10 text-neon-green border-neon-green shadow-neon-glow" 
                    : "bg-dark-accent/40 border-zinc-900 text-zinc-600 hover:border-zinc-700 hover:bg-zinc-900/50"
                )}
              >
                <Icon size={24} className={cn("transition-transform duration-500", isActive ? "scale-110" : "group-hover:scale-110")} />
                <span className="text-[8px] font-mono font-black uppercase tracking-widest">{type}</span>
                {isActive && (
                  <motion.div 
                    layoutId="active-vehicle-glow"
                    className="absolute inset-0 bg-neon-green/5 blur-xl -z-10"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* GPS Status Indicator */}
      <div className={cn(
        "relative p-6 rounded-3xl border-2 overflow-hidden transition-all duration-1000 bg-opacity-20 backdrop-blur-3xl italic",
        location 
          ? "bg-neon-green/5 border-neon-green/20 text-white shadow-neon-glow-sm" 
          : "bg-red-500/5 border-red-500/20 text-zinc-500"
      )}>
        <div className="flex items-center justify-between gap-6 relative z-10 italic">
          <div className="flex items-center gap-6 italic">
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-700 italic",
              location ? "bg-neon-green/20 text-neon-green shadow-neon-glow border border-neon-green/30" : "bg-zinc-950/50 text-zinc-700"
            )}>
              {location ? <Satellite size={24} className="animate-pulse" /> : <MapPin size={24} />}
            </div>
            <div>
              <span className="text-[9px] font-mono font-black uppercase tracking-[0.4em] mb-1 block italic opacity-60">Status_de_Sincronia_Geo</span>
              <p className={cn("text-sm font-mono tracking-widest font-black uppercase italic", location ? "text-neon-green" : "text-red-500/60")}>
                {location 
                  ? `FIXADO_OK: [LAT:${location.latitude.toFixed(4)} / LON:${location.longitude.toFixed(4)}]`
                  : "CALIBRANDO_SATÉLITE_GPS_24-X..."}
              </p>
            </div>
          </div>
          
          {!location && (
            <button 
              type="button" 
              onClick={captureLocation} 
              className="px-6 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-mono font-black uppercase tracking-widest hover:bg-white/10 transition-all hover:text-white"
            >
              FORÇAR_RECALIBRAGEM
            </button>
          )}
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 p-2 opacity-5 italic">
          <MapPin size={100} />
        </div>
      </div>

      {/* Submit Button */}
      <div className="pt-4 italic">
        <button
          disabled={loading}
          className="tech-button w-full h-24 text-2xl italic tracking-[0.3em] relative group overflow-hidden"
        >
          <div className="flex items-center justify-center gap-4 italic relative z-10 font-display font-black uppercase">
            {loading ? (
              <>
                <Loader2 size={28} className="animate-spin" />
                Sincronizando_Dados...
              </>
            ) : (
              <>
                Confirmar_Implantação
                <Check size={28} className="text-neon-green" />
              </>
            )}
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-neon-green/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
        </button>
        <p className="text-[9px] font-mono text-zinc-800 text-center mt-4 uppercase tracking-[0.6em] font-black italic">Protocolo Alpha // Up Torque Networks © v3.2</p>
      </div>
    </form>
  );
}
