
import React from 'react';
import { Package, CheckCircle2, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Bundle } from '../types';
import { Badge } from './ui/Badge';
import { useCurrency } from '../hooks/useCurrency';

interface BundleCardProps {
  bundle: Bundle;
}

export const BundleCard: React.FC<BundleCardProps> = ({ bundle }) => {
  const { formatPrice } = useCurrency();

  return (
    <Link 
      to={`/bundle/${bundle.id}`} 
      className="group relative flex flex-col overflow-hidden rounded-[32px] border-none bg-white shadow-xl shadow-blue-900/5 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-900/10 hover:-translate-y-2"
    >
      {/* Visual Stack Effect */}
      <div className="absolute top-6 right-6 z-10">
         <div className="bg-ueu-blue text-white text-[10px] font-black tracking-widest px-4 py-2 rounded-xl shadow-xl flex items-center gap-1.5 uppercase">
            <Layers className="h-3 w-3" /> BUNDLE
         </div>
      </div>

      <div className="aspect-[16/10] w-full overflow-hidden bg-ueu-navy relative">
        {bundle.thumbnailUrl ? (
          <img
            src={bundle.thumbnailUrl}
            alt={bundle.title}
            className="h-full w-full object-cover opacity-70 transition-transform duration-700 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
             <Package className="h-12 w-12 text-white/20" />
          </div>
        )}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-ueu-navy to-transparent opacity-80" />
        <div className="absolute bottom-6 left-6 right-6">
             <Badge className="bg-white/20 hover:bg-white/30 text-white border border-white/20 backdrop-blur-md px-4 py-1.5 font-black uppercase text-[9px] tracking-widest">
                {bundle.courseCount} Program Unggulan
             </Badge>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-8">
        <h3 className="line-clamp-2 text-xl font-black uppercase tracking-tight text-ueu-navy group-hover:text-ueu-blue transition-colors mb-4">
            {bundle.title}
        </h3>
        <p className="text-sm text-slate-600 font-medium line-clamp-2 leading-relaxed mb-6">
            {bundle.description || "Kuasai berbagai keahlian industri dengan koleksi program studi pilihan yang dirancang untuk masa depan Anda."}
        </p>
        
        <div className="space-y-3 mb-8">
            <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-ueu-navy/60">
                <div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                </div>
                <span>Akses Selamanya</span>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-ueu-navy/60">
                <div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                </div>
                <span>Sertifikasi Resmi</span>
            </div>
        </div>
        
        <div className="mt-auto pt-6 flex items-center justify-between border-t border-slate-100">
          <div className="flex flex-col">
              <span className="text-[9px] text-slate-400 uppercase font-black tracking-widest mb-1">Total Investasi</span>
              <p className="text-2xl font-black text-ueu-blue">{formatPrice(bundle.price)}</p>
          </div>
          <Badge className="bg-accent text-white font-black uppercase text-[9px] tracking-widest px-4 py-2 rounded-xl border-none shadow-lg shadow-accent/20">
              Hemat Besar
          </Badge>
        </div>
      </div>
    </Link>
  );
};
