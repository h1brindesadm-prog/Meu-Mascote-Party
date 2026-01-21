
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

  const generateFullKit = async () => {
    if (!childPhoto) return;

    setGeneration({ isGenerating: true, step: 'Preparando pincéis mágicos...', progress: 0 });
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
      const folder = zip.folder("Kit_Festa_MeuMascoteParty");

      for (const item of kit) {
        // Extract base64 data (ignoring the "data:image/png;base64," part)
        const base64Data = item.url.split(',')[1];
        if (folder) {
          folder.file(`${item.label.replace(/\s+/g, '_')}.png`, base64Data, { base64: true });
        }
      }

      const content = await zip.generateAsync({ type: "blob" });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = `Kit_Festa_${age ? `Idade_${age}_` : ''}${Date.now()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error("Erro ao gerar ZIP:", error);
      alert("Houve um erro ao compactar os arquivos. Tente baixar as imagens individualmente.");
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fdf6ff]">
      <header className="bg-white border-b py-6 px-4 md:px-8 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-pink-500 p-2 rounded-xl text-white">
              <Icons.MagicWand />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Meu Mascote Party</h1>
          </div>
          <div className="flex items-center gap-3">
            {kit.length > 0 && !generation.isGenerating && (
              <button 
                onClick={downloadFullKitAsZip}
                disabled={isZipping}
                className="flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all border-2 border-pink-500 text-pink-600 hover:bg-pink-50 disabled:opacity-50"
              >
                {isZipping ? (
                  <div className="w-5 h-5 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/></svg>
                )}
                {isZipping ? 'Compactando...' : 'Baixar Kit Completo (ZIP)'}
              </button>
            )}
            <button 
              onClick={generateFullKit}
              disabled={!childPhoto || generation.isGenerating}
              className={`flex items-center gap-2 px-8 py-3 rounded-full font-bold transition-all shadow-lg ${
                !childPhoto || generation.isGenerating ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-pink-500 text-white hover:bg-pink-600'
              }`}
            >
              {generation.isGenerating ? 'Gerando Kit...' : 'Gerar Kit Completo'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form */}
        <div className="lg:col-span-4 space-y-6">
          <section className="bg-white p-6 rounded-3xl shadow-sm border border-pink-100">
            <h2 className="text-xl font-bold mb-6 text-gray-800">Sobre a Criança</h2>
            
            <div className="space-y-4">
              <label className="block">
                <span className="text-sm font-bold text-gray-600 mb-2 block">Foto da Criança (Obrigatória)</span>
                <div 
                  onClick={() => childInputRef.current?.click()}
                  className={`aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden ${
                    childPhoto ? 'border-pink-300' : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  {childPhoto ? <img src={childPhoto} className="w-full h-full object-cover" /> : <Icons.Upload />}
                  <input type="file" ref={childInputRef} className="hidden" accept="image/*" onChange={(e) => handleUpload(e, setChildPhoto)} />
                </div>
              </label>

              <div className="grid grid-cols-1 gap-4">
                <label>
                  <span className="text-sm font-bold text-gray-600 mb-1 block">Idade da Criança</span>
                  <input 
                    type="number" 
                    placeholder="Ex: 5" 
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:ring-2 focus:ring-pink-200 transition-all outline-none"
                  />
                </label>
                <label>
                  <span className="text-sm font-bold text-gray-600 mb-1 block">Detalhes Fisionomia</span>
                  <textarea 
                    placeholder="Ex: Cabelo cacheado loiro, olhos azuis..." 
                    value={features}
                    onChange={(e) => setFeatures(e.target.value)}
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:ring-2 focus:ring-pink-200 transition-all outline-none resize-none"
                  />
                </label>
              </div>
            </div>
          </section>

          <section className="bg-white p-6 rounded-3xl shadow-sm border border-blue-100">
            <h2 className="text-xl font-bold mb-2 text-gray-800">Qual o tema e estilo?</h2>
            <p className="text-xs text-gray-400 mb-6">Personalize a atmosfera da sua festa.</p>

            <div className="space-y-6">
              <label className="block">
                <span className="text-sm font-bold text-gray-600 mb-2 block">Referência de Tema (Opcional)</span>
                <div 
                  onClick={() => themeInputRef.current?.click()}
                  className={`aspect-video rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden ${
                    themePhoto ? 'border-blue-300' : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  {themePhoto ? <img src={themePhoto} className="w-full h-full object-cover" /> : <p className="text-xs text-gray-400">Carregar Referência</p>}
                  <input type="file" ref={themeInputRef} className="hidden" accept="image/*" onChange={(e) => handleUpload(e, setThemePhoto)} />
                </div>
              </label>

              <div>
                <span className="text-sm font-bold text-gray-600 mb-3 block">Estilo da Ilustração</span>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setStyle('cartoon')} className={`py-3 rounded-xl text-sm font-bold border-2 transition-all ${style === 'cartoon' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-100 text-gray-400'}`}>Cartoon 2D</button>
                  <button onClick={() => setStyle('pixar')} className={`py-3 rounded-xl text-sm font-bold border-2 transition-all ${style === 'pixar' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-100 text-gray-400'}`}>Estilo 3D Pixar</button>
                </div>
              </div>

              <div>
                <span className="text-sm font-bold text-gray-600 mb-3 block">Tom do Visual</span>
                <div className="grid grid-cols-2 gap-2">
                  {(['cute', 'adventurous', 'magical', 'fun'] as VisualTone[]).map(t => (
                    <button 
                      key={t}
                      onClick={() => setTone(t)}
                      className={`py-3 rounded-xl text-xs font-bold border-2 transition-all capitalize ${tone === t ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-100 text-gray-400'}`}
                    >
                      {t === 'cute' ? 'Fofo' : t === 'adventurous' ? 'Aventureiro' : t === 'magical' ? 'Mágico' : 'Divertido'}
                    </button>
                  ))}
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
                <h2 className="text-3xl font-bold text-gray-800">Seu Kit de Festa</h2>
                {generation.isGenerating && (
                  <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full border shadow-sm">
                    <div className="w-5 h-5 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm font-bold text-pink-600">{generation.step}</span>
                    <span className="text-xs text-gray-400">{generation.progress}%</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {kit.map((img) => (
                  <div key={img.id} className={`bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden group hover:shadow-xl transition-all ${img.type === 'panel' || img.type === 'invitation' ? 'md:col-span-2' : ''}`}>
                    <div className={`${img.type === 'panel' ? 'aspect-video' : 'aspect-square'} bg-gray-50 flex items-center justify-center relative overflow-hidden`}>
                      <img src={img.url} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700" />
                      <button 
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = img.url;
                          link.download = `${img.label}.png`;
                          link.click();
                        }}
                        className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all text-gray-700 hover:text-pink-600"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/></svg>
                      </button>
                    </div>
                    <div className="p-5 flex items-center justify-between">
                      <span className="font-bold text-gray-700">{img.label}</span>
                      <div className="w-2 h-2 rounded-full bg-green-400"></div>
                    </div>
                  </div>
                ))}
                
                {generation.isGenerating && kit.length < 8 && (
                  <div className="aspect-square bg-white/50 border-2 border-dashed border-gray-200 rounded-[2rem] flex flex-col items-center justify-center p-8 text-center">
                    <div className="w-12 h-12 border-4 border-gray-100 border-t-pink-500 rounded-full animate-spin mb-4"></div>
                    <p className="text-sm text-gray-400 font-medium">Renderizando próximo item...</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[600px] flex flex-col items-center justify-center bg-white rounded-[3rem] border border-gray-100 shadow-sm p-12 text-center">
              <div className="w-24 h-24 bg-pink-50 rounded-full flex items-center justify-center text-pink-500 mb-8">
                <Icons.MagicWand />
              </div>
              <h2 className="text-4xl font-bold text-gray-800 mb-4 font-title">Crie a Festa Perfeita!</h2>
              <p className="text-gray-500 max-w-lg mb-12 text-lg leading-relaxed">
                Transforme a foto da criança em um kit profissional de decoração. Configure os detalhes ao lado e clique em <b>Gerar Kit Completo</b>.
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-3xl">
                {['Personagem', 'Convite', 'Painel', 'Adesivos'].map(item => (
                  <div key={item} className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="py-12 text-center">
        <p className="text-gray-300 text-sm font-medium">Meu Mascote Party • Transformando Sorrisos em Arte</p>
      </footer>
    </div>
  );
};

export default App;
