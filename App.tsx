
import React, { useState, useRef } from 'react';
import { GeneratedImage, GenerationState, IllustrationStyle, VisualTone, ItemType } from './types';
import { Icons } from './constants';
import { GeminiService } from './services/geminiService';
import JSZip from 'jszip';

const App: React.FC = () => {
  // Config States
  const [childPhoto, setChildPhoto] = useState<string | null>(null);
  const [themePhoto, setThemePhoto] = useState<string | null>(null);
  const [age, setAge] = useState('');
  const [features, setFeatures] = useState('');
  const [style, setStyle] = useState<IllustrationStyle>('pixar');
  const [tone, setTone] = useState<VisualTone>('cute');

  // App States
  const [generation, setGeneration] = useState<GenerationState>({ isGenerating: false, step: '', progress: 0 });
  const [kit, setKit] = useState<GeneratedImage[]>([]);
  const [isZipping, setIsZipping] = useState(false);
  
  const childInputRef = useRef<HTMLInputElement>(null);
  const themeInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setter(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const resetAll = () => {
    if (confirm("Deseja realmente limpar tudo e começar de novo?")) {
      setChildPhoto(null);
      setThemePhoto(null);
      setAge('');
      setFeatures('');
      setKit([]);
      setGeneration({ isGenerating: false, step: '', progress: 0 });
    }
  };

  const generateFullKit = async () => {
    if (!childPhoto) return;

    setGeneration({ isGenerating: true, step: 'Preparando as tintas...', progress: 0 });
    setKit([]);

    const service = new GeminiService();
    const items: { type: ItemType; label: string }[] = [
      { type: 'character', label: 'Personagem Principal' },
      { type: 'expressions', label: 'Expressões Faciais' },
      { type: 'topper', label: 'Topper de Bolo' },
      { type: 'tags', label: 'Tags de Lembrancinha' },
      { type: 'stickers', label: 'Adesivos' },
      { type: 'invitation', label: 'Convite Digital' },
      { type: 'age_number', label: 'Número da Idade' },
      { type: 'panel', label: 'Painel Decorativo' }
    ];

    const results: GeneratedImage[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      setGeneration({ 
        isGenerating: true, 
        step: `Criando ${item.label}...`, 
        progress: Math.round(((i + 1) / items.length) * 100) 
      });

      const url = await service.generateKitItem(childPhoto, item.type, {
        age,
        features,
        style,
        tone,
        themeImage: themePhoto
      });

      if (url) {
        results.push({ id: `${item.type}-${Date.now()}`, type: item.type, url, label: item.label });
        setKit([...results]);
      }
    }

    setGeneration({ isGenerating: false, step: 'Kit Completo!', progress: 100 });
  };

  const downloadFullKitAsZip = async () => {
    if (kit.length === 0) return;
    setIsZipping(true);

    try {
      const zip = new JSZip();
      const folder = zip.folder("MeuMascoteParty_Kit");

      for (const item of kit) {
        const base64Data = item.url.split(',')[1];
        if (folder) {
          folder.file(`${item.label.replace(/\s+/g, '_')}.png`, base64Data, { base64: true });
        }
      }

      const content = await zip.generateAsync({ type: "blob" });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = `MeuMascoteParty_${Date.now()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error("Erro no ZIP:", error);
      alert("Houve um erro ao gerar o arquivo compactado.");
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fffaf5]">
      <header className="bg-white/80 backdrop-blur-md border-b border-orange-100 py-4 px-4 md:px-8 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-orange-500 to-red-600 p-2.5 rounded-2xl text-white shadow-lg">
              <Icons.MagicWand />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Meu Mascote Party</h1>
          </div>
          <div className="flex items-center gap-2">
            {(kit.length > 0 || childPhoto) && (
              <button onClick={resetAll} className="p-3 text-gray-400 hover:text-red-500 transition-colors" title="Limpar Tudo">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/></svg>
              </button>
            )}
            {kit.length > 0 && !generation.isGenerating && (
              <button 
                onClick={downloadFullKitAsZip}
                disabled={isZipping}
                className="hidden md:flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all border-2 border-orange-500 text-orange-600 hover:bg-orange-50"
              >
                {isZipping ? 'Compactando...' : 'Baixar ZIP'}
              </button>
            )}
            <button 
              onClick={generateFullKit}
              disabled={!childPhoto || generation.isGenerating}
              className={`px-8 py-3 rounded-full font-bold transition-all shadow-lg ${
                !childPhoto || generation.isGenerating ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-orange-500 text-white hover:bg-orange-600'
              }`}
            >
              {generation.isGenerating ? 'Criando...' : 'Gerar Kit Completo'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <section className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-orange-100">
            <h2 className="text-xl font-bold mb-6 text-gray-800 flex items-center gap-2">
              <span className="w-2 h-6 bg-orange-500 rounded-full"></span>
              A Criança
            </h2>
            
            <div className="space-y-6">
              <div 
                onClick={() => childInputRef.current?.click()}
                className={`relative aspect-square rounded-3xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden ${
                  childPhoto ? 'border-orange-300' : 'border-gray-200 bg-gray-50 hover:bg-orange-50'
                }`}
              >
                {childPhoto ? <img src={childPhoto} className="w-full h-full object-cover" /> : (
                  <div className="text-center p-4">
                    <div className="text-orange-500 mb-2 flex justify-center"><Icons.Upload /></div>
                    <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Foto da Criança</p>
                  </div>
                )}
                <input type="file" ref={childInputRef} className="hidden" accept="image/*" onChange={(e) => handleUpload(e, setChildPhoto)} />
              </div>

              <div className="space-y-4">
                <input 
                  type="number" 
                  placeholder="Idade da Criança" 
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full px-4 py-4 rounded-2xl border border-gray-100 bg-gray-50 focus:ring-2 focus:ring-orange-200 transition-all outline-none font-bold text-gray-700"
                />
                <textarea 
                  placeholder="Características (Ex: cabelos cacheados, olhos castanhos...)" 
                  value={features}
                  onChange={(e) => setFeatures(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-4 rounded-2xl border border-gray-100 bg-gray-50 focus:ring-2 focus:ring-orange-200 transition-all outline-none resize-none text-sm text-gray-600"
                />
              </div>
            </div>
          </section>

          <section className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-orange-50">
            <h2 className="text-xl font-bold mb-6 text-gray-800 flex items-center gap-2">
              <span className="w-2 h-6 bg-amber-500 rounded-full"></span>
              O Tema
            </h2>
            
            <div className="space-y-6">
              <div 
                onClick={() => themeInputRef.current?.click()}
                className={`relative aspect-video rounded-3xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden ${
                  themePhoto ? 'border-orange-300' : 'border-gray-200 bg-gray-50 hover:bg-orange-50'
                }`}
              >
                {themePhoto ? <img src={themePhoto} className="w-full h-full object-cover" /> : (
                  <div className="text-center p-4">
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Upload Foto do Tema</p>
                    <p className="text-[10px] text-gray-400 mt-1">Ex: Foto da decoração, painel ou personagem</p>
                  </div>
                )}
                <input type="file" ref={themeInputRef} className="hidden" accept="image/*" onChange={(e) => handleUpload(e, setThemePhoto)} />
              </div>

              <div className="space-y-4">
                <div>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">Estilo</span>
                  <div className="flex bg-gray-50 p-1 rounded-2xl border border-gray-100">
                    <button onClick={() => setStyle('cartoon')} className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${style === 'cartoon' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-400'}`}>Cartoon 2D</button>
                    <button onClick={() => setStyle('pixar')} className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${style === 'pixar' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-400'}`}>Pixar 3D</button>
                  </div>
                </div>

                <div>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">Vibe</span>
                  <div className="grid grid-cols-2 gap-2">
                    {(['cute', 'adventurous', 'magical', 'fun'] as VisualTone[]).map(t => (
                      <button 
                        key={t}
                        onClick={() => setTone(t)}
                        className={`py-3 rounded-xl text-[10px] font-bold border transition-all ${tone === t ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-100 text-gray-400'}`}
                      >
                        {t === 'cute' ? 'FOFO' : t === 'adventurous' ? 'AVENTUREIRO' : t === 'magical' ? 'MÁGICO' : 'DIVERTIDO'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="lg:col-span-8">
          {kit.length > 0 || generation.isGenerating ? (
            <div className="space-y-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-3xl font-bold text-gray-800">Seu Kit Produzido</h2>
                {generation.isGenerating && (
                  <div className="flex items-center gap-4 bg-white px-6 py-3 rounded-full border border-orange-100 shadow-sm">
                    <div className="w-6 h-6 border-4 border-orange-100 border-t-orange-500 rounded-full animate-spin"></div>
                    <span className="text-sm font-bold text-orange-600">{generation.step}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {kit.map((img) => (
                  <div key={img.id} className={`bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden group hover:shadow-xl transition-all ${img.type === 'panel' || img.type === 'invitation' ? 'md:col-span-2' : ''}`}>
                    <div className={`${img.type === 'panel' ? 'aspect-video' : 'aspect-square'} bg-gray-50 flex items-center justify-center relative overflow-hidden p-4`}>
                      <img src={img.url} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700" alt={img.label} />
                      <button 
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = img.url;
                          link.download = `${img.label}.png`;
                          link.click();
                        }}
                        className="absolute bottom-4 right-4 bg-white p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all text-orange-500 hover:bg-orange-500 hover:text-white"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"/></svg>
                      </button>
                    </div>
                    <div className="p-5 border-t border-gray-50 flex items-center justify-between">
                      <span className="font-bold text-gray-700">{img.label}</span>
                      <div className="bg-green-100 text-green-600 p-1.5 rounded-full"><Icons.Check /></div>
                    </div>
                  </div>
                ))}
                
                {generation.isGenerating && kit.length < 8 && (
                  <div className="aspect-square bg-white/50 border-2 border-dashed border-orange-100 rounded-[2.5rem] flex flex-col items-center justify-center p-8 text-center">
                    <div className="w-12 h-12 border-4 border-gray-100 border-t-orange-500 rounded-full animate-spin mb-4"></div>
                    <p className="text-xs text-orange-400 font-bold uppercase tracking-widest">Renderizando...</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[70vh] flex flex-col items-center justify-center bg-white rounded-[4rem] border border-orange-50 shadow-sm p-12 text-center">
              <div className="w-24 h-24 bg-orange-50 rounded-[2rem] flex items-center justify-center text-orange-500 mb-8 shadow-inner">
                <Icons.MagicWand />
              </div>
              <h2 className="text-4xl font-bold text-gray-800 mb-4 font-title">Crie a Festa do Seu Pequeno!</h2>
              <p className="text-gray-500 max-w-lg mb-12 text-lg leading-relaxed">
                Envie a foto da criança e uma referência do tema. Nossa IA criará um kit completo com <b>8 itens exclusivos</b> para a decoração.
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-3xl">
                {['Personagem', 'Convite', 'Painel', 'Adesivos'].map(item => (
                  <div key={item} className="p-4 bg-orange-50/30 rounded-2xl border border-orange-50">
                    <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="py-12 text-center">
        <p className="text-gray-300 text-sm font-bold uppercase tracking-widest">Meu Mascote Party • 2024</p>
      </footer>
    </div>
  );
};

export default App;
