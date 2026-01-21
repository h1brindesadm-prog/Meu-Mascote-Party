
import React, { useState, useRef } from 'react';
import { GeneratedImage, GenerationState, IllustrationStyle, VisualTone, ItemType } from './types';
import { Icons, THEME_CONFIGS } from './constants';
import { GeminiService } from './services/geminiService';
import JSZip from 'jszip';

const App: React.FC = () => {
  // Config States
  const [childPhoto, setChildPhoto] = useState<string | null>(null);
  const [themePhoto, setThemePhoto] = useState<string | null>(null);
  const [selectedThemeKey, setSelectedThemeKey] = useState<string | null>(null);
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
      setSelectedThemeKey(null);
      setAge('');
      setFeatures('');
      setKit([]);
      setGeneration({ isGenerating: false, step: '', progress: 0 });
    }
  };

  const generateFullKit = async () => {
    if (!childPhoto) return;

    setGeneration({ isGenerating: true, step: 'Iniciando produção mágica...', progress: 0 });
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
    const themePrompt = selectedThemeKey ? (THEME_CONFIGS as any)[selectedThemeKey].prompt : "";

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      setGeneration({ 
        isGenerating: true, 
        step: `Produzindo ${item.label}...`, 
        progress: Math.round(((i + 1) / items.length) * 100) 
      });

      const url = await service.generateKitItem(childPhoto, item.type, {
        age,
        features,
        style,
        tone,
        themeImage: themePhoto,
        themePrompt
      });

      if (url) {
        results.push({ id: `${item.type}-${Date.now()}`, type: item.type, url, label: item.label });
        setKit([...results]);
      }
    }

    setGeneration({ isGenerating: false, step: 'Kit Finalizado!', progress: 100 });
  };

  const downloadFullKitAsZip = async () => {
    if (kit.length === 0) return;
    setIsZipping(true);

    try {
      const zip = new JSZip();
      const folder = zip.folder("Kit_MeuMascoteParty");

      for (const item of kit) {
        const base64Data = item.url.split(',')[1];
        if (folder) {
          folder.file(`${item.label.replace(/\s+/g, '_')}.png`, base64Data, { base64: true });
        }
      }

      const content = await zip.generateAsync({ type: "blob" });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = `MeuMascoteParty_${age ? `Idade_${age}_` : ''}${Date.now()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error("Erro ao gerar ZIP:", error);
      alert("Erro ao compactar arquivos.");
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fdf6ff]">
      <header className="bg-white/80 backdrop-blur-md border-b py-4 px-4 md:px-8 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-pink-500 to-purple-600 p-2.5 rounded-2xl text-white shadow-md">
              <Icons.MagicWand />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Meu Mascote Party</h1>
          </div>
          <div className="flex items-center gap-2">
            {(kit.length > 0 || childPhoto) && (
              <button 
                onClick={resetAll}
                className="p-3 text-gray-400 hover:text-red-500 transition-colors"
                title="Limpar Tudo"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/></svg>
              </button>
            )}
            {kit.length > 0 && !generation.isGenerating && (
              <button 
                onClick={downloadFullKitAsZip}
                disabled={isZipping}
                className="hidden md:flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all border-2 border-pink-500 text-pink-600 hover:bg-pink-50 disabled:opacity-50"
              >
                {isZipping ? (
                  <div className="w-5 h-5 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/></svg>
                )}
                ZIP Completo
              </button>
            )}
            <button 
              onClick={generateFullKit}
              disabled={!childPhoto || generation.isGenerating}
              className={`flex items-center gap-2 px-8 py-3 rounded-full font-bold transition-all shadow-lg ${
                !childPhoto || generation.isGenerating ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-pink-500 text-white hover:bg-pink-600 hover:scale-105 active:scale-95'
              }`}
            >
              {generation.isGenerating ? 'Criando...' : 'Gerar Kit'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form */}
        <div className="lg:col-span-4 space-y-6">
          <section className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-pink-100">
            <h2 className="text-xl font-bold mb-6 text-gray-800 flex items-center gap-2">
              <span className="w-2 h-6 bg-pink-500 rounded-full"></span>
              A Criança
            </h2>
            
            <div className="space-y-6">
              <div 
                onClick={() => childInputRef.current?.click()}
                className={`relative aspect-square rounded-3xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden group ${
                  childPhoto ? 'border-pink-300' : 'border-gray-200 bg-gray-50 hover:bg-pink-50 hover:border-pink-200'
                }`}
              >
                {childPhoto ? (
                  <>
                    <img src={childPhoto} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <span className="text-white font-bold">Trocar Foto</span>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-4">
                    <div className="bg-pink-100 text-pink-500 p-4 rounded-full inline-block mb-3">
                      <Icons.Upload />
                    </div>
                    <p className="text-sm font-bold text-gray-500">Clique para enviar a foto da criança</p>
                    <p className="text-xs text-gray-400 mt-1">Formatos: JPG, PNG</p>
                  </div>
                )}
                <input type="file" ref={childInputRef} className="hidden" accept="image/*" onChange={(e) => handleUpload(e, setChildPhoto)} />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="relative">
                  <span className="text-xs font-bold text-gray-400 absolute left-4 -top-2 bg-white px-2">Idade</span>
                  <input 
                    type="number" 
                    placeholder="Ex: 3" 
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full px-4 py-4 rounded-2xl border border-gray-100 bg-gray-50 focus:ring-2 focus:ring-pink-200 transition-all outline-none font-bold text-gray-700"
                  />
                </div>
                <div className="relative">
                  <span className="text-xs font-bold text-gray-400 absolute left-4 -top-2 bg-white px-2">Características Físicas</span>
                  <textarea 
                    placeholder="Ex: Cabelos cacheados, olhos castanhos..." 
                    value={features}
                    onChange={(e) => setFeatures(e.target.value)}
                    rows={2}
                    className="w-full px-4 py-4 rounded-2xl border border-gray-100 bg-gray-50 focus:ring-2 focus:ring-pink-200 transition-all outline-none resize-none text-sm text-gray-600"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-blue-100">
            <h2 className="text-xl font-bold mb-6 text-gray-800 flex items-center gap-2">
              <span className="w-2 h-6 bg-blue-500 rounded-full"></span>
              O Tema
            </h2>

            <div className="space-y-6">
              <div>
                <span className="text-xs font-bold text-gray-400 mb-3 block uppercase tracking-wider">Escolha um Tema Sugerido</span>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                  {Object.keys(THEME_CONFIGS).map((key) => (
                    <button 
                      key={key}
                      onClick={() => setSelectedThemeKey(selectedThemeKey === key ? null : key)}
                      className={`p-3 rounded-2xl text-left transition-all border-2 ${
                        selectedThemeKey === key 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-50 bg-gray-50 hover:bg-gray-100 text-gray-500'
                      }`}
                    >
                      <div className="text-[10px] font-bold mb-1" style={{ color: (THEME_CONFIGS as any)[key].primary }}>Tema</div>
                      <div className="text-xs font-bold leading-tight">{key}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative">
                <span className="text-xs font-bold text-gray-400 mb-2 block">Ou Carregue uma Referência</span>
                <div 
                  onClick={() => themeInputRef.current?.click()}
                  className={`aspect-video rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden ${
                    themePhoto ? 'border-blue-300' : 'border-gray-100 bg-gray-50 hover:bg-blue-50'
                  }`}
                >
                  {themePhoto ? (
                    <img src={themePhoto} className="w-full h-full object-cover" />
                  ) : (
                    <p className="text-xs text-gray-400 font-bold">Upload de Foto do Tema</p>
                  )}
                  <input type="file" ref={themeInputRef} className="hidden" accept="image/*" onChange={(e) => handleUpload(e, setThemePhoto)} />
                </div>
                {themePhoto && (
                  <button onClick={(e) => { e.stopPropagation(); setThemePhoto(null); }} className="absolute -top-2 -right-2 bg-red-500 text-white p-1.6 rounded-full shadow-md">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"/></svg>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Estilo Visual</span>
                  <div className="flex bg-gray-50 p-1 rounded-2xl border border-gray-100">
                    <button 
                      onClick={() => setStyle('cartoon')} 
                      className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${style === 'cartoon' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}
                    >
                      Cartoon 2D
                    </button>
                    <button 
                      onClick={() => setStyle('pixar')} 
                      className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${style === 'pixar' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}
                    >
                      Pixar 3D
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Results */}
        <div className="lg:col-span-8">
          {kit.length > 0 || generation.isGenerating ? (
            <div className="space-y-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-3xl font-bold text-gray-800">Seu Kit Produzido</h2>
                {generation.isGenerating && (
                  <div className="flex items-center gap-4 bg-white px-6 py-3 rounded-[2rem] border shadow-sm border-pink-100">
                    <div className="relative">
                      <div className="w-8 h-8 border-4 border-pink-100 border-t-pink-500 rounded-full animate-spin"></div>
                      <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-pink-600">
                        {generation.progress}%
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-pink-600 leading-none mb-1">Mágica em andamento...</span>
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{generation.step}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {kit.map((img) => (
                  <div key={img.id} className={`bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden group hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 ${img.type === 'panel' || img.type === 'invitation' ? 'md:col-span-2' : ''}`}>
                    <div className={`${img.type === 'panel' ? 'aspect-video' : 'aspect-square'} bg-gray-50 flex items-center justify-center relative overflow-hidden`}>
                      <img src={img.url} className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-1000" alt={img.label} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <button 
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = img.url;
                          link.download = `${img.label}.png`;
                          link.click();
                        }}
                        className="absolute bottom-6 right-6 bg-white p-4 rounded-full shadow-2xl scale-0 group-hover:scale-100 transition-all duration-300 text-pink-500 hover:bg-pink-500 hover:text-white"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"/></svg>
                      </button>
                    </div>
                    <div className="p-6 flex items-center justify-between bg-white border-t border-gray-50">
                      <div>
                        <span className="text-[10px] font-bold text-gray-300 uppercase block mb-1">Item do Kit</span>
                        <span className="font-bold text-gray-700 text-lg">{img.label}</span>
                      </div>
                      <div className="bg-green-50 text-green-500 p-2 rounded-xl">
                        <Icons.Check />
                      </div>
                    </div>
                  </div>
                ))}
                
                {generation.isGenerating && kit.length < 8 && (
                  <div className="aspect-square bg-white/40 border-2 border-dashed border-pink-200 rounded-[2.5rem] flex flex-col items-center justify-center p-8 text-center animate-pulse">
                    <div className="w-16 h-16 bg-pink-50 rounded-full flex items-center justify-center mb-4">
                      <Icons.MagicWand />
                    </div>
                    <p className="text-sm text-pink-400 font-bold">Criando próxima ilustração...</p>
                  </div>
                )}
              </div>

              {kit.length > 0 && !generation.isGenerating && (
                <div className="md:hidden mt-8">
                   <button 
                    onClick={downloadFullKitAsZip}
                    disabled={isZipping}
                    className="w-full flex items-center justify-center gap-3 px-8 py-5 rounded-3xl font-bold transition-all bg-white border-2 border-pink-500 text-pink-600 active:bg-pink-50"
                  >
                    {isZipping ? 'Gerando ZIP...' : 'Baixar Kit Completo (ZIP)'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full min-h-[70vh] flex flex-col items-center justify-center bg-white rounded-[4rem] border border-gray-100 shadow-sm p-12 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-5 pointer-events-none">
                 <div className="absolute top-10 left-10 animate-bounce" style={{ animationDuration: '3s' }}><Icons.MagicWand /></div>
                 <div className="absolute bottom-20 right-20 animate-bounce" style={{ animationDuration: '4s' }}><Icons.MagicWand /></div>
              </div>
              
              <div className="w-32 h-32 bg-gradient-to-br from-pink-50 to-blue-50 rounded-[2.5rem] flex items-center justify-center text-pink-500 mb-8 shadow-inner">
                <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"/></svg>
              </div>
              <h2 className="text-4xl font-bold text-gray-800 mb-4 font-title">Mascote da Sua Festa!</h2>
              <p className="text-gray-500 max-w-lg mb-12 text-lg leading-relaxed">
                Transforme o rosto do seu filho em uma ilustração profissional de mascotinho. Receba um kit completo com 8 itens decorativos em alta definição.
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl">
                {[
                  { label: 'Personagem', desc: 'Identidade visual' },
                  { label: 'Convite', desc: 'Cenário mágico' },
                  { label: 'Topper', desc: 'Bolo temático' },
                  { label: 'Painel', desc: 'Fundo gigante' }
                ].map(item => (
                  <div key={item.label} className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100 hover:bg-white hover:shadow-lg transition-all cursor-default">
                    <span className="text-[10px] font-bold text-pink-400 uppercase tracking-widest block mb-1">{item.label}</span>
                    <span className="text-xs font-bold text-gray-400">{item.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="py-12 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
           <div className="w-2 h-2 rounded-full bg-pink-300"></div>
           <div className="w-2 h-2 rounded-full bg-blue-300"></div>
           <div className="w-2 h-2 rounded-full bg-purple-300"></div>
        </div>
        <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">Meu Mascote Party • 2024</p>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f8f8f8;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #eee;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #ddd;
        }
      `}</style>
    </div>
  );
};

export default App;
