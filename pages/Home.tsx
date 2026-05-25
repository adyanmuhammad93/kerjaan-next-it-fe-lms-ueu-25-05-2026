import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { Button } from '../components/ui/Button';
import { bundleService } from '../services/bundleService';
import { Bundle, Category } from '../types';
import { categoryService } from '../services/categoryService';
import { 
  ArrowRight, 
  CheckCircle2, 
  PlayCircle, 
  GraduationCap, 
  Globe, 
  BookOpen, 
  Search,
  Award,
  Zap,
  Building2,
  FileText
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../components/ui/Badge';

import { PageWrapper } from '../components/layout/PageWrapper';

export const Home: React.FC = () => {
  const { searchQuery, initStore } = useStore();
  const [, setBundles] = useState<Bundle[]>([]);
  const [, setCategories] = useState<Category[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
    initStore();
    bundleService.getAllPublishedBundles().then(setBundles).catch(console.error);
    categoryService.getCategories().then(data => setCategories(data.filter(c => c.status !== 'inactive'))).catch(console.error);
  }, [initStore]);

  const stats = [
    { label: "Innovation in the U.S.", value: "#1", icon: Award, sub: "Ahead of MIT & Stanford" },
    { label: "International Pathways", value: "4+1 & 3+1", icon: Zap, sub: "Dual Degree Options" },
    { label: "Global Partnership", value: "ASU", icon: Globe, sub: "Arizona State University" },
  ];

  return (
    <PageWrapper>
      <main className="min-h-screen bg-white text-ueu-navy font-sans" id="main-content">
      
      {/* Hero Section */}
      {!searchQuery && (
        <header className="relative overflow-hidden bg-ueu-navy border-b border-blue-900 rounded-b-[40px] md:rounded-b-[80px] shadow-2xl">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-accent/10 blur-[120px] rounded-full -mr-64 -mt-64" aria-hidden="true"></div>
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-pathway-maroon/10 blur-[100px] rounded-full -ml-48 -mb-48" aria-hidden="true"></div>

          <div className="container relative z-10 mx-auto px-4 pt-16 pb-32 md:pt-24 md:pb-48">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-6 py-2 text-xs font-black text-white mb-8 backdrop-blur-md tracking-widest uppercase">
                <span className="flex h-2 w-2 rounded-full bg-accent animate-pulse mr-3" aria-hidden="true"></span>
                Intake 2026 Telah Dibuka
              </div>
              
              <h1 className="text-4xl font-black tracking-tighter text-white sm:text-7xl mb-8 leading-[1.05]">
                Esa Unggul <br />
                <span className="text-accent uppercase">International College</span>
              </h1>
              
              <p className="mt-4 text-lg md:text-xl text-blue-100/80 max-w-2xl mx-auto mb-12 font-medium leading-relaxed">
                Bergabunglah dengan universitas terakreditasi <strong className="text-white underline decoration-accent">UNGGUL</strong>. 
                Kurikulum global yang ditenagai oleh keahlian dari Arizona State University.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-5 justify-center items-center">
                <Button 
                   size="lg" 
                   aria-label="Daftar untuk Intake 2026"
                   className="rounded-full bg-accent text-white hover:bg-accent/90 px-12 h-16 font-black uppercase text-xs tracking-widest shadow-xl shadow-orange-900/40 transition-all active:scale-95 focus-visible:ring-4 focus-visible:ring-orange-300 outline-none"
                   onClick={() => navigate('/admission')}
                >
                    Daftar Intake 2026
                </Button>
                <div className="flex items-center gap-3 text-white font-bold bg-white/5 px-6 py-3 rounded-full border border-white/10" role="status">
                    <div className="w-8 h-8 bg-pathway-maroon rounded-md flex items-center justify-center text-[10px]" aria-hidden="true">ASU</div>
                    <span className="text-sm">Powered by ASU</span>
                </div>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Stats Section */}
      {!searchQuery && (
          <section className="container mx-auto px-4 -mt-16 relative z-20" aria-label="Statistik Keunggulan">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {stats.map((stat, i) => (
                      <article key={i} className="py-12 px-8 bg-white rounded-[40px] border-b-8 border-accent shadow-2xl shadow-blue-900/10 text-center transition-all hover:-translate-y-2">
                          <div className="inline-flex p-4 rounded-2xl bg-slate-50 text-ueu-navy mb-4" aria-hidden="true">
                              <stat.icon className="h-6 w-6" />
                          </div>
                          <div className="text-4xl font-black text-ueu-navy mb-2">{stat.value}</div>
                          <h2 className="text-[11px] text-slate-400 font-black uppercase tracking-[0.2em] mb-1">{stat.label}</h2>
                          <p className="text-xs text-pathway-maroon font-bold">{stat.sub}</p>
                      </article>
                  ))}
              </div>
          </section>
      )}

      {/* Program Highlights Section */}
      {!searchQuery && (
        <section className="py-32 container mx-auto px-4" aria-labelledby="pathway-heading">
            <div className="bg-ueu-navy rounded-[56px] p-8 md:p-20 text-white overflow-hidden relative shadow-2xl">
                <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5" aria-hidden="true"></div>
                <div className="relative z-10 grid lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <Badge className="bg-accent text-white mb-6 px-4 py-1.5 font-black uppercase tracking-widest text-[10px]">Jalur Akademik</Badge>
                        <h2 id="pathway-heading" className="text-4xl md:text-6xl font-black mb-8 leading-tight">Global Education Pathways</h2>
                        <p className="text-blue-100/70 text-lg mb-12 font-medium">Dapatkan pengalaman belajar di Jakarta dan Amerika Serikat melalui jalur transisi yang mulus.</p>
                        
                        <div className="space-y-6">
                            <article className="p-6 rounded-3xl bg-white/5 border border-white/10">
                                <h3 className="font-black text-xl text-accent mb-2">International Bachelor Programs (4+1)</h3>
                                <p className="text-sm text-blue-100/60 leading-relaxed">Selesaikan S1 di Esa Unggul dan S2 di Arizona State University hanya dalam total 5 tahun.</p>
                            </article>
                            <article className="p-6 rounded-3xl bg-white/5 border border-white/10">
                                <h3 className="font-black text-xl text-accent mb-2">Dual Degree Programs (3+1)</h3>
                                <p className="text-sm text-blue-100/60 leading-relaxed">Dapatkan dua gelar sarjana sekaligus dengan studi 3 tahun di Indonesia dan 1 tahun di U.S.</p>
                            </article>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4" aria-hidden="true">
                        <div className="space-y-4">
                            <div className="aspect-[4/5] bg-blue-800 rounded-[32px] flex items-center justify-center border border-white/10">
                                <Building2 className="h-12 w-12 text-white/20" />
                            </div>
                            <div className="aspect-square bg-accent rounded-[32px] flex items-center justify-center p-8 text-center">
                                <span className="font-black text-white text-xl">Standard ASU</span>
                            </div>
                        </div>
                        <div className="pt-12 space-y-4">
                             <div className="aspect-square bg-pathway-maroon rounded-[32px] flex items-center justify-center p-8 text-center">
                                <span className="font-black text-white text-lg">#1 INNOVATION</span>
                            </div>
                            <div className="aspect-[4/5] bg-ueu-navy rounded-[32px] flex items-center justify-center border border-white/10">
                                <GraduationCap className="h-12 w-12 text-white/20" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
      )}

      {/* Available Pathways Cards */}
      <section className="pb-32 container mx-auto px-4" aria-labelledby="available-pathways-title">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div className="max-w-xl">
                <h2 id="available-pathways-title" className="text-4xl font-black text-ueu-navy mb-4">Available Pathways</h2>
                <div className="h-1.5 w-20 bg-accent rounded-full mb-6" aria-hidden="true"></div>
                <p className="text-slate-500 font-medium italic">Program sarjana unggulan yang terhubung langsung dengan Master's degree di ASU.</p>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
                { title: "S1 Management (English)", category: "Business", path: "Master of Global Management", icon: Building2 },
                { title: "S1 Marketing Communication", category: "Media", path: "Master of Digital Audience Strategy", icon: PlayCircle },
                { title: "S1 Industrial Engineering", category: "Engineering", path: "Master of Industrial Engineering", icon: GraduationCap }
            ].map((course, idx) => (
                <article key={idx} className="group bg-white rounded-[48px] border border-slate-100 p-10 hover:shadow-2xl hover:shadow-blue-900/10 transition-all flex flex-col h-full focus-within:ring-2 focus-within:ring-accent">
                    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-ueu-navy mb-8 group-hover:bg-accent group-hover:text-white transition-all" aria-hidden="true">
                        <course.icon className="h-7 w-7" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{course.category}</span>
                    <h3 className="text-2xl font-black mb-6 leading-tight">{course.title}</h3>
                    
                    <div className="mt-auto pt-8 border-t border-slate-50">
                        <p className="text-[10px] font-black text-pathway-maroon uppercase tracking-widest mb-3">Pathway to ASU Master:</p>
                        <div className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" aria-hidden="true" />
                            <span className="text-sm font-bold text-slate-700">{course.path}</span>
                        </div>
                    </div>
                </article>
            ))}
        </div>
      </section>

      {/* Available Graduate Certificates - KEMBALI DITAMBAHKAN */}
      <section className="py-24 bg-slate-50 border-y border-slate-200" aria-labelledby="certs-title">
        <div className="container mx-auto px-4">
            <div className="text-center mb-16">
                <h2 id="certs-title" className="text-3xl font-black text-ueu-navy mb-2">Available Graduate Certificates</h2>
                <div className="h-1 w-12 bg-pathway-maroon mx-auto rounded-full mb-4"></div>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Standar Kurikulum Arizona State University</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    "Global Management and Leadership",
                    "Digital Audience Strategy",
                    "Industrial Engineering",
                    "Engineering Management"
                ].map((cert, i) => (
                    <article key={i} className="group bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm hover:border-accent hover:shadow-xl hover:shadow-orange-900/5 transition-all">
                        <div className="w-12 h-12 bg-[#EFF1ED] rounded-xl flex items-center justify-center text-ueu-navy mb-6 group-hover:bg-accent group-hover:text-white transition-all">
                            <FileText className="h-6 w-6" />
                        </div>
                        <h4 className="font-black text-sm leading-tight text-slate-800">{cert}</h4>
                        <div className="mt-4 flex items-center text-[10px] font-black text-pathway-maroon uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-all">
                            Learn More <ArrowRight className="ml-1 h-3 w-3" />
                        </div>
                    </article>
                ))}
            </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="bg-ueu-navy text-white py-32 rounded-t-[40px] md:rounded-t-[80px] relative overflow-hidden" aria-labelledby="cta-title">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/50 via-ueu-navy to-ueu-navy" aria-hidden="true"></div>
          <div className="container mx-auto px-4 text-center space-y-10 relative z-10">
              <h2 id="cta-title" className="text-4xl md:text-6xl font-black tracking-tighter">Wujudkan Karir Global Anda</h2>
              <p className="text-blue-100/70 max-w-2xl mx-auto text-lg md:text-xl font-medium leading-relaxed">
                  Konsultasikan jalur akademik Anda bersama konselor kami sekarang untuk angkatan 2026.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button 
                    size="lg" 
                    className="rounded-full bg-white text-ueu-navy hover:bg-accent hover:text-white px-12 h-16 font-black uppercase text-xs tracking-widest transition-all focus-visible:ring-4 focus-visible:ring-white"
                >
                    Hubungi Konselor
                </Button>
                <Button 
                    variant="ghost"
                    className="text-white hover:text-accent font-black uppercase text-xs tracking-widest"
                    onClick={() => navigate('/browse')}
                >
                    Lihat Program Lain <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
          </div>
      </section>
    </main>
    </PageWrapper>
  );
};