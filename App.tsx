
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
  const [error, setError] = useState<string | null>(null);
  
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
      setError(null);
      setGeneration({ isGenerating: false, step: '', progress: 0 });
    }
  };

  const generateFullKit = async () => {
    if (!childPhoto) return;

    setError(null);
    setGeneration({ isGenerating: true, step: 'Iniciando produção mágica...', progress: 0 });
    setKit([]);

    const service = new GeminiService();
    const items: { type: ItemType; label: string }[] = [
      { type: 'character', label: 'Personagem Principal' },
      { type: 'expressions', label: 'Expressões' },
      { type: 'topper', label: 'Topper de Bolo' },
      { type: 'tags', label: 'Tags de Lembrancinha' },
      { type: 'stickers', label: 'Adesivos' },
      { type: 'invitation', label: 'Convite Digital' },
      { type: 'age_number', label: 'Número da Idade' },
      { type: 'panel', label: 'Painel Decorativo' }
    ];

    try {
      let completedCount = 0;
      
      // Geração Sequencial para evitar erros 429 (Rate Limit) no Vercel
      for (const item of items) {
        setGeneration(prev => ({
          ...prev,
          step: `Criando ${item.label}...`,
          progress: Math.round((completedCount / items.length) * 100)
        }));

        const url = await service.generateKitItem(childPhoto, item.type, {
          age,
          features,
          style,
          tone,
          themeImage: themePhoto
        });

        if (url) {
          const newImage: GeneratedImage = { 
            id: `${item.type}-${Date.now()}`, 
            type: item.type, 
            url, 
            label: item.label 
          };
          setKit(prev => [...prev, newImage]);
        } else {
          console.warn(`Falha ao gerar o item: ${item.label}`);
        }
        
        completedCount++;
      }
    } catch (err) {
      console.error("Erro crítico na geração do kit:", err);
      setError("Ocorreu um erro ao gerar o kit. Por favor, tente novamente.");
    } finally {
      setGeneration({ isGenerating: false, step: 'Kit Finalizado!', progress: 100 });
    }
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
      link.download = `Kit_Festa_${Date.now()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (error) {
      alert("Erro ao criar arquivo ZIP.");
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fffaf5]">
      <header className="bg-white/90 backdrop-blur-md border-b border-orange-100 py-4 px-4 md:px-8 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-2.5 rounded-2xl text-white shadow-lg shadow-orange-200">
              <Icons.MagicWand />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Meu Mascote Party</h1>
          </div>
          <div className="flex items-center gap-3">
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
                {isZipping ? 'Compactando...' : 'Baixar Kit Completo'}
              </button>
            )}
            <button 
              onClick={generateFullKit}
              disabled={!childPhoto || generation.isGenerating}
              className={`px-8 py-3 rounded-full font-bold transition-all shadow-lg ${
                !childPhoto || generation.isGenerating ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-orange-500 text-white hover:bg-orange-600 active:scale-95'
              }`}
            >
              {generation.isGenerating ? 'Produzindo...' : 'Gerar Kit de Festa'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <section className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-orange-100">
            <h2 className="text-xl font-bold mb-6 text-gray-800 flex items-center gap-2 font-title">
              <span className="w-2 h-6 bg-orange-500 rounded-full"></span>
              A Criança
            </h2>
            
            <div className="space-y-6">
              <div 
                onClick={() => childInputRef.current?.click()}
                className={`relative aspect-square rounded-3xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden ${
                  childPhoto ? 'border-orange-300 ring-4 ring-orange-50' : 'border-gray-200 bg-gray-50 hover:bg-orange-50 hover:border-orange-200'
                }`}
              >
                {childPhoto ? <img src={childPhoto} className="w-full h-full object-cover" /> : (
                  <div className="text-center p-4">
                    <div className="text-orange-400 mb-2 flex justify-center scale-125"><Icons.Upload /></div>
                    <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mt-2">Foto da Criança</p>
                  </div>
                )}
                <input type="file" ref={childInputRef} className="hidden" accept="image/*" onChange={(e) => handleUpload(e, setChildPhoto)} />
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <span className="absolute left-4 top-2 text-[10px] font-bold text-orange-400 uppercase">Idade</span>
                  <input 
                    type="number" 
                    placeholder="Ex: 5" 
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full px-4 pt-6 pb-2 rounded-2xl border border-gray-100 bg-gray-50 focus:ring-2 focus:ring-orange-200 transition-all outline-none font-bold text-gray-700"
                  />
                </div>
                <div className="relative">
                   <span className="absolute left-4 top-2 text-[10px] font-bold text-orange-400 uppercase">Traços marcantes</span>
                  <textarea 
                    placeholder="Cabelos pretos, covinhas, óculos..." 
                    value={features}
                    onChange={(e) => setFeatures(e.target.value)}
                    rows={2}
                    className="w-full px-4 pt-6 pb-2 rounded-2xl border border-gray-100 bg-gray-50 focus:ring-2 focus:ring-orange-200 transition-all outline-none resize-none text-sm text-gray-600"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-orange-50">
            <h2 className="text-xl font-bold mb-6 text-gray-800 flex items-center gap-2 font-title">
              <span className="w-2 h-6 bg-amber-500 rounded-full"></span>
              Personalização
            </h2>
            
            <div className="space-y-6">
              <div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Referência de Tema (Opcional)</span>
                <div 
                  onClick={() => themeInputRef.current?.click()}
                  className={`relative aspect-video rounded-3xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden ${
                    themePhoto ? 'border-orange-300 ring-4 ring-orange-50' : 'border-gray-200 bg-gray-50 hover:bg-orange-50'
                  }`}
                >
                  {themePhoto ? <img src={themePhoto} className="w-full h-full object-cover" /> : (
                    <div className="text-center p-4">
                      <p className="text-sm font-bold text-orange-400 uppercase tracking-wider">Carregar Referência</p>
                      <p className="text-[10px] text-gray-400 mt-1">Foto da decoração ou painel</p>
                    </div>
                  )}
                  <input type="file" ref={themeInputRef} className="hidden" accept="image/*" onChange={(e) => handleUpload(e, setThemePhoto)} />
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">Estilo da Ilustração</span>
                  <div className="flex bg-gray-100 p-1.5 rounded-2xl border border-gray-200">
                    <button onClick={() => setStyle('cartoon')} className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${style === 'cartoon' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>Cartoon 2D</button>
                    <button onClick={() => setStyle('pixar')} className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${style === 'pixar' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>Estilo 3D Pixar</button>
                  </div>
                </div>

                <div>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">Tom do Visual</span>
                  <div className="grid grid-cols-2 gap-2">
                    {(['cute', 'adventurous', 'magical', 'fun'] as VisualTone[]).map(t => (
                      <button 
                        key={t}
                        onClick={() => setTone(t)}
                        className={`py-3 rounded-xl text-[10px] font-bold border transition-all ${tone === t ? 'border-orange-500 bg-orange-500 text-white shadow-md shadow-orange-100' : 'border-gray-100 bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
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
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-center gap-3 animate-shake">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/></svg>
              <span className="font-bold text-sm">{error}</span>
            </div>
          )}

          {kit.length > 0 || generation.isGenerating ? (
            <div className="space-y-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-3xl font-bold text-gray-800 font-title">Seu Kit Produzido</h2>
                {generation.isGenerating && (
                  <div className="flex items-center gap-4 bg-white px-6 py-3 rounded-full border border-orange-100 shadow-sm border-l-4 border-l-orange-500">
                    <div className="w-5 h-5 border-3 border-orange-100 border-t-orange-500 rounded-full animate-spin"></div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-orange-600 leading-tight">{generation.step}</span>
                      <div className="w-32 h-1 bg-gray-100 rounded-full mt-1.5 overflow-hidden">
                        <div className="h-full bg-orange-500 transition-all duration-700 ease-out" style={{ width: `${generation.progress}%` }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {kit.map((img) => (
                  <div key={img.id} className={`bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden group hover:shadow-2xl transition-all duration-500 ${img.type === 'panel' || img.type === 'invitation' ? 'md:col-span-2' : ''}`}>
                    <div className={`${img.type === 'panel' ? 'aspect-video' : 'aspect-square'} bg-gray-50 flex items-center justify-center relative overflow-hidden p-6`}>
                      <img src={img.url} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-1000 ease-in-out" alt={img.label} />
                      <div className="absolute inset-0 bg-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <button 
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = img.url;
                          link.download = `${img.label}.png`;
                          link.click();
                        }}
                        className="absolute bottom-6 right-6 bg-white p-4 rounded-full shadow-2xl scale-0 group-hover:scale-100 transition-all duration-300 text-orange-500 hover:bg-orange-500 hover:text-white"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"/></svg>
                      </button>
                    </div>
                    <div className="p-6 border-t border-gray-50 flex items-center justify-between bg-white">
                      <div>
                        <span className="text-[10px] font-bold text-orange-300 uppercase block mb-1">Item Pronto</span>
                        <span className="font-bold text-gray-700 text-lg">{img.label}</span>
                      </div>
                      <div className="bg-orange-50 text-orange-500 p-2.5 rounded-2xl border border-orange-100">
                        <Icons.Check />
                      </div>
                    </div>
                  </div>
                ))}
                
                {generation.isGenerating && kit.length < 8 && (
                  <div className="aspect-square bg-white border-2 border-dashed border-orange-100 rounded-[2.5rem] flex flex-col items-center justify-center p-8 text-center animate-pulse">
                    <div className="w-14 h-14 bg-orange-50 rounded-full flex items-center justify-center mb-4 text-orange-400">
                      <Icons.MagicWand />
                    </div>
                    <p className="text-xs text-orange-400 font-bold uppercase tracking-widest leading-relaxed">
                      Gerando ilustrações sequencialmente<br/>para máxima qualidade...
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[70vh] flex flex-col items-center justify-center bg-white rounded-[4rem] border border-orange-50 shadow-sm p-12 text-center relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-orange-50 rounded-full -mr-32 -mt-32 opacity-50 blur-3xl"></div>
               <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-50 rounded-full -ml-32 -mb-32 opacity-50 blur-3xl"></div>
               
              <div className="w-28 h-28 bg-gradient-to-br from-orange-50 to-orange-100 rounded-[2.5rem] flex items-center justify-center text-orange-500 mb-8 shadow-inner relative z-10">
                <Icons.MagicWand />
              </div>
              <h2 className="text-4xl font-bold text-gray-800 mb-4 font-title relative z-10">Crie a Festa do Seu Pequeno!</h2>
              <p className="text-gray-500 max-w-md mb-12 text-lg leading-relaxed relative z-10">
                Transforme a foto do seu filho em um kit de festa profissional. Cada item é gerado com alta consistência facial.
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl relative z-10">
                {[
                  'Personagem Principal', 'Expressões', 'Topper de Bolo', 'Tags de Lembrancinha',
                  'Adesivos', 'Convite Digital', 'Número da Idade', 'Painel Decorativo'
                ].map(item => (
                  <div key={item} className="p-4 bg-orange-50/40 rounded-3xl border border-orange-50 flex items-center justify-center text-center hover:bg-orange-50 transition-colors">
                    <span className="text-[10px] font-bold text-orange-600 uppercase tracking-widest leading-tight">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="py-12 text-center border-t border-orange-50 mt-12 bg-white/50">
        <p className="text-gray-300 text-xs font-bold uppercase tracking-widest">Meu Mascote Party • Alta Fidelidade & Consistência • 2024</p>
      </footer>
    </div>
  );
};

export default App;
