import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Globe, Twitter, Linkedin, Facebook, Instagram, Youtube, ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-border pt-20 pb-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">

          {/* Brand & Global Partnership Column */}
          <div className="space-y-8 pr-4">
            <Link to="/" className="inline-flex transition-opacity hover:opacity-80">
              <img
                src="/ueu-asu-logo.svg"
                alt="Universitas Esa Unggul powered by Arizona State University"
                className="h-16 w-auto max-w-full"
              />
            </Link>

            <p className="text-slate-500 text-sm leading-relaxed max-w-xs font-medium">
              Membangun generasi cerdas, kreatif, dan entrepreneurial dengan standar pendidikan global melalui kemitraan strategis bersama Arizona State University.
            </p>

            {/* Partnership Logos Area */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-4">
                <img src="asu-logo.png" alt="Arizona State University, nomor 1 di Amerika Serikat untuk inovasi" />
                {/* <div className="font-black text-ueu-navy/40 text-lg tracking-widest uppercase text-center border-2 border-slate-100 rounded-2xl p-4 w-full">
                    Arizona State University
                </div> */}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4">
              <a href="#" className="h-11 w-11 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400 hover:bg-ueu-blue hover:text-white transition-all shadow-sm group">
                <Instagram className="h-5 w-5 transition-transform group-hover:scale-110" />
              </a>
              <a href="#" className="h-11 w-11 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400 hover:bg-ueu-blue hover:text-white transition-all shadow-sm group">
                <Linkedin className="h-5 w-5 transition-transform group-hover:scale-110" />
              </a>
              <a href="#" className="h-11 w-11 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400 hover:bg-ueu-blue hover:text-white transition-all shadow-sm group">
                <Youtube className="h-5 w-5 transition-transform group-hover:scale-110" />
              </a>
            </div>
          </div>

          {/* Akademik & Program */}
          <div>
            <h4 className="font-bold text-sm uppercase tracking-widest text-slate-900 mb-8">Program Akademik</h4>
            <ul className="space-y-4 text-sm font-bold text-slate-600">
              <li><Link to="/browse?category=management" className="hover:text-ueu-blue transition-colors">International Management</Link></li>
              <li><Link to="/browse?category=marketing" className="hover:text-ueu-blue transition-colors">Marketing Communication</Link></li>
              <li><Link to="/browse?category=engineering" className="hover:text-ueu-blue transition-colors">Industrial Engineering</Link></li>
              <li><Link to="/browse?category=dual-degree" className="hover:text-ueu-blue transition-colors">Dual Degree Programs (3+1)</Link></li>
              <li><Link to="/browse?category=pathway" className="hover:text-ueu-blue transition-colors">International Bachelor (4+1)</Link></li>
            </ul>
          </div>

          {/* Tentang Kami */}
          <div>
            <h4 className="font-bold text-sm uppercase tracking-widest text-slate-900 mb-8">Tentang Kami</h4>
            <ul className="space-y-4 text-sm font-bold text-slate-600">
              <li><Link to="/about" className="hover:text-ueu-blue transition-colors">Profil International College</Link></li>
              <li><Link to="/asu-partnership" className="hover:text-ueu-blue transition-colors">Arizona State University</Link></li>
              <li><Link to="/campus-life" className="hover:text-ueu-blue transition-colors">Fasilitas Kampus</Link></li>
              <li><Link to="/news" className="hover:text-ueu-blue transition-colors">Berita & Acara</Link></li>
              <li><Link to="/contact" className="hover:text-ueu-blue transition-colors">Kontak Kami</Link></li>
            </ul>
          </div>

          {/* Legal & Info */}
          <div>
            <h4 className="font-bold text-sm uppercase tracking-widest text-slate-900 mb-8">Informasi</h4>
            <ul className="space-y-4 text-sm font-bold text-slate-600">
              <li><Link to="/privacy" className="hover:text-ueu-blue transition-colors">Kebijakan Privasi</Link></li>
              <li><Link to="/terms" className="hover:text-ueu-blue transition-colors">Syarat & Ketentuan</Link></li>
              <li><Link to="/admission-guide" className="hover:text-ueu-blue transition-colors">Panduan Pendaftaran</Link></li>
              <li className="pt-4">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary text-primary text-[10px] font-extrabold uppercase tracking-wider">
                  <Globe className="h-3 w-3" /> Bahasa Indonesia
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-100 pt-10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col items-center md:items-start gap-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              © {new Date().getFullYear()} Universitas Esa Unggul International College. Seluruh Hak Cipta Dilindungi.
            </p>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-ueu-blue font-black uppercase tracking-widest">#1 In Innovation</span>
              <span className="text-[10px] text-slate-200">•</span>
              <span className="text-[10px] text-slate-400 font-bold italic">Powered by Arizona State University</span>
            </div>
          </div>

          <div className="flex items-center gap-10">
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-[3px]">Smart</span>
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-[3px]">Creative</span>
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-[3px]">Entrepreneurial</span>
          </div>
        </div>
      </div>
    </footer>
  );
};