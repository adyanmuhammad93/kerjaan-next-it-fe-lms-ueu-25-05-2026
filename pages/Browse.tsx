import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Filter, SlidersHorizontal, Search, X, RotateCw, Compass, BookOpen } from 'lucide-react';
import { useCourses } from '../hooks/useCourses';
import { bundleService } from '../services/bundleService';
import { categoryService } from '../services/categoryService';
import { Course, Bundle, Category } from '../types';
import { CourseCard } from '../components/CourseCard';
import { BundleCard } from '../components/BundleCard';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Checkbox } from '../components/ui/Checkbox';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../components/ui/Accordion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/Dialog";

type ItemType = 
  | (Course & { itemType: 'course' }) 
  | (Bundle & { itemType: 'bundle'; rating: number; ratingCount: number; level: string; category: string });

import { PageWrapper } from '../components/layout/PageWrapper';

export const Browse: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { courses, loading: coursesLoading, fetchCourses } = useCourses();
  
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingBundles, setLoadingBundles] = useState(true);

  const categoryTree = useMemo(() => categoryService.buildCategoryTree(categories.filter(c => c.status !== 'inactive')), [categories]);

  useEffect(() => {
    categoryService.getCategories().then(setCategories).catch(console.error);
    bundleService.getAllPublishedBundles()
      .then(setBundles)
      .finally(() => setLoadingBundles(false));
  }, []);

  const query = searchParams.get('q') || '';
  const categoryFilter = searchParams.get('category') || 'all';
  const typeFilter = searchParams.get('type') || 'all';

  const allItems = useMemo(() => {
    const formattedCourses = courses
      .filter(c => c.isPublished)
      .map(c => ({ ...c, itemType: 'course' as const }));
    
    const formattedBundles = bundles.map(b => ({
      ...b,
      itemType: 'bundle' as const,
      rating: 4.8,
      ratingCount: 120,
      level: 'Semua Tingkat',
      category: 'Program Internasional'
    }));

    return [...formattedCourses, ...formattedBundles];
  }, [courses, bundles]);

  const filteredItems = useMemo(() => {
    // Helper to get all child category names recursively
    const getChildCategoryNames = (catName: string): string[] => {
      const names: string[] = [catName];
      const children = categories.filter(c => c.parentId === categories.find(p => p.name === catName)?.id);
      children.forEach(child => {
        names.push(...getChildCategoryNames(child.name));
      });
      return Array.from(new Set(names));
    };

    const targetCategories = categoryFilter === 'all' ? [] : getChildCategoryNames(categoryFilter);

    return allItems.filter(item => {
      const itemCategory = item.category || '';
      const matchesSearch = item.title.toLowerCase().includes(query.toLowerCase()) ||
                          itemCategory.toLowerCase().includes(query.toLowerCase());
      
      const matchesCategory = categoryFilter === 'all' || targetCategories.includes(itemCategory);
      const matchesType = typeFilter === 'all' || item.itemType === typeFilter;
      
      return matchesSearch && matchesCategory && matchesType;
    });
  }, [allItems, query, categoryFilter, typeFilter, categories]);

  const clearFilters = () => {
    setSearchParams({});
  };

  const refreshData = () => {
    fetchCourses();
    setLoadingBundles(true);
    bundleService.getAllPublishedBundles()
      .then(setBundles)
      .finally(() => setLoadingBundles(false));
  };

  const FilterContent = () => {
    const renderCategoryTree = (nodes: any[]) => {
      return nodes.map((node) => (
        <div key={node.value} className="space-y-4">
          <div className="flex items-center space-x-4">
            <Checkbox 
              id={node.value} 
              className="w-5 h-5 rounded-lg border-slate-300 data-[state=checked]:bg-ueu-blue data-[state=checked]:border-ueu-blue"
              checked={categoryFilter === node.value}
              onCheckedChange={() => setSearchParams({ ...Object.fromEntries(searchParams), category: node.value })}
            />
            <label htmlFor={node.value} className="text-xs font-bold text-slate-600 cursor-pointer leading-none uppercase tracking-wide">
              {node.label}
            </label>
          </div>
          {node.children && node.children.length > 0 && (
            <div className="pl-6 border-l-2 border-slate-100 space-y-4 mt-4">
              {renderCategoryTree(node.children)}
            </div>
          )}
        </div>
      ));
    };

    return (
      <div className="space-y-10 py-4">
        <Accordion type="multiple" defaultValue={["categories", "types"]} className="w-full">
          <AccordionItem value="categories" className="border-none">
            <AccordionTrigger className="text-[11px] font-black uppercase tracking-[3px] text-ueu-navy hover:no-underline py-6">Kategori Program</AccordionTrigger>
            <AccordionContent className="pt-2 space-y-4">
              {categoryTree.length > 0 ? renderCategoryTree(categoryTree) : (
                <p className="text-xs font-medium text-slate-400 italic">Belum ada kategori tersedia</p>
              )}
            </AccordionContent>
          </AccordionItem>

        <AccordionItem value="types" className="border-none mt-4">
          <AccordionTrigger className="text-[11px] font-black uppercase tracking-[3px] text-ueu-navy hover:no-underline py-6">Jenis Pendidikan</AccordionTrigger>
          <AccordionContent className="pt-2 space-y-4">
            {[
              { id: 'course', label: 'Program Studi Reguler' },
              { id: 'bundle', label: 'Jalur Internasional (ASU)' }
            ].map((type) => (
              <div key={type.id} className="flex items-center space-x-4">
                <Checkbox 
                  id={type.id} 
                  className="w-5 h-5 rounded-lg border-slate-300 data-[state=checked]:bg-ueu-blue data-[state=checked]:border-ueu-blue"
                  checked={typeFilter === type.id}
                  onCheckedChange={() => setSearchParams({ ...Object.fromEntries(searchParams), type: type.id })}
                />
                <label htmlFor={type.id} className="text-xs font-bold text-slate-600 cursor-pointer uppercase tracking-wide">
                  {type.label}
                </label>
              </div>
            ))}
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="pt-10 border-t border-slate-100">
        <Button 
          variant="outline" 
          className="w-full rounded-2xl border-slate-200 bg-white text-ueu-navy font-black text-[10px] uppercase tracking-widest h-14 hover:bg-slate-50 shadow-sm transition-all active:scale-95 border-2"
          onClick={clearFilters}
        >
          Reset Filter Pilihan
        </Button>
      </div>
    </div>
  );
};

  return (
    <PageWrapper className="bg-slate-50/50 pb-32">
      {/* Header Halaman */}
      <div className="bg-ueu-navy pt-24 pb-48 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-ueu-blue/20 to-transparent"></div>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-ueu-blue/20 rounded-full blur-[100px]"></div>
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-accent/10 rounded-full blur-[80px]"></div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-3xl">
            <Badge className="mb-8 bg-white/10 text-white border border-white/20 font-black px-6 py-2.5 rounded-full uppercase text-[10px] tracking-[0.3em] backdrop-blur-xl">
              Katalog Akademik Esa Unggul
            </Badge>
            <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight mb-8 leading-[1.1] uppercase">
              Pilih Masa <span className="text-ueu-blue">Depanmu</span>
            </h1>
            <p className="text-white/60 text-xl font-medium leading-relaxed max-w-2xl">
              Temukan program studi unggulan yang dirancang untuk membekali Anda dengan keahlian global dan jiwa entrepreneurship di lingkungan akademik terbaik.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 -mt-20 relative z-20">
        {/* Search Bar & Actions Bar */}
        <div className="flex flex-col lg:flex-row gap-6 items-center mb-16">
            <div className="relative flex-1 group w-full">
                <div className="absolute left-7 top-1/2 -translate-y-1/2 h-6 w-6 bg-ueu-blue/10 rounded-lg flex items-center justify-center transition-all group-focus-within:bg-ueu-blue">
                   <Search className="h-4 w-4 text-ueu-blue group-focus-within:text-white transition-colors" />
                </div>
                <Input 
                  placeholder="Cari nama program atau bidang studi..." 
                  className="h-24 pl-20 pr-10 rounded-[32px] border-none bg-white shadow-2xl shadow-blue-900/10 text-xl font-bold text-ueu-navy focus-visible:ring-8 focus-visible:ring-ueu-blue/5 transition-all placeholder:text-slate-400"
                  value={query}
                  onChange={(e) => setSearchParams({ ...Object.fromEntries(searchParams), q: e.target.value })}
                />
            </div>
            
            <div className="flex w-full lg:w-auto gap-4">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="lg:hidden flex-1 h-24 rounded-[32px] gap-4 border-none bg-white shadow-2xl shadow-blue-900/10 font-black text-ueu-navy text-base uppercase tracking-widest">
                    <SlidersHorizontal className="h-6 w-6 text-ueu-blue" /> Filter
                  </Button>
                </DialogTrigger>
                <DialogContent className="rounded-t-[48px] sm:rounded-[48px] bg-slate-50 border-none max-w-lg p-10">
                  <DialogHeader className="mb-6">
                    <DialogTitle className="text-2xl font-black text-ueu-navy uppercase tracking-tight">Penyaringan Program</DialogTitle>
                  </DialogHeader>
                  <FilterContent />
                </DialogContent>
              </Dialog>

              <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-24 w-24 rounded-[32px] bg-white shadow-2xl shadow-blue-900/10 text-ueu-navy/70 hover:text-ueu-blue transition-all hover:bg-white active:scale-95 flex shrink-0 border-2 border-slate-100 hover:border-ueu-blue/10"
                  onClick={refreshData}
                  title="Segarkan Data"
              >
                  <RotateCw className="h-7 w-7" />
              </Button>
            </div>
        </div>

        <div className="flex gap-16 relative z-10">
          {/* Sidebar Desktop */}
          <aside className="hidden lg:block w-80 shrink-0">
            <div className="sticky top-24 space-y-12 bg-white/50 backdrop-blur-md p-10 rounded-[48px] border border-white shadow-sm shadow-blue-900/5">
               <div className="flex items-center gap-4 border-l-4 border-ueu-blue pl-6">
                  <h2 className="font-black text-[10px] uppercase tracking-[4px] text-ueu-navy">Opsi Filter</h2>
               </div>
               <FilterContent />
            </div>
          </aside>

          {/* Grid Konten */}
          <main className="flex-1">
              <div className="flex items-center justify-between mb-12 px-2">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-ueu-blue/10 flex items-center justify-center">
                        <BookOpen className="h-5 w-5 text-ueu-blue" />
                    </div>
                    <p className="text-xs font-black text-slate-500 uppercase tracking-[3px]">
                      Ditemukan <span className="text-ueu-navy">{filteredItems.length}</span> Program Studi
                    </p>
                </div>
              </div>

              {filteredItems.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-10">
                      {filteredItems.map((item) => (
                          item.itemType === 'course' ? (
                              <CourseCard key={item.id} course={item as Course} />
                          ) : (
                              <BundleCard key={item.id} bundle={item as Bundle} />
                          )
                      ))}
                  </div>
              ) : (
                  <div className="text-center py-32 bg-slate-100/50 rounded-[64px] border border-dashed border-slate-200">
                      <div className="mx-auto w-32 h-32 bg-white rounded-[40px] flex items-center justify-center mb-10 shadow-xl shadow-blue-900/5">
                          <Search className="h-12 w-12 text-slate-200" />
                      </div>
                      <h3 className="text-3xl font-black text-ueu-navy mb-4 uppercase tracking-tight">Hasil Tidak Ditemukan</h3>
                      <p className="text-slate-600 font-medium mb-12 max-w-sm mx-auto leading-relaxed px-6">
                        Maaf, kami tidak menemukan program yang sesuai dengan kriteria penyaringan Anda saat ini.
                      </p>
                      <Button onClick={clearFilters} className="rounded-2xl px-12 h-16 bg-ueu-blue text-white font-black text-xs uppercase tracking-widest shadow-2xl shadow-blue-900/20 hover:bg-ueu-navy transition-all active:scale-95">
                        Hapus Semua Filter
                      </Button>
                  </div>
              )}
          </main>
        </div>
      </div>
    </PageWrapper>
  );
};
