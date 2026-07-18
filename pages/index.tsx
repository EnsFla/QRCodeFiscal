import { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Receipt, AlertCircle, CheckCircle2, Info, UploadCloud, Camera, StopCircle, Clock, FileText, History, X } from 'lucide-react';

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' | 'info' } | null>(null);
  const [history, setHistory] = useState<any[]>([]); 
  const [isHistoryOpen, setIsHistoryOpen] = useState(false); // NOVO: Controla a abertura do painel
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/reimbursements');
      const data = await res.json();
      // Pega os 10 envios mais recentes para o painel lateral
      setHistory(data.slice(0, 10) || []);
    } catch (error) {
      console.error("Erro ao buscar histórico:", error);
    }
  };

  useEffect(() => { 
    setIsMounted(true); 
    fetchHistory(); 
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    html5QrCodeRef.current = new Html5Qrcode("reader");
    return () => {
      if (html5QrCodeRef.current?.isScanning) {
        html5QrCodeRef.current.stop().catch(console.error);
      }
    };
  }, [isMounted]);

  const processQRCodeData = async (decodedText: string) => {
    setMessage({ text: 'Validando nota com a SEFAZ...', type: 'info' });
    try {
      const res = await fetch('/api/process-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrCodeText: decodedText })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setMessage({ text: `Sucesso! Status: ${data.record.status}`, type: 'success' });
      fetchHistory(); 
      
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    }
  };

  const startCamera = async () => {
    setMessage(null);
    if (!html5QrCodeRef.current) return;
    try {
      await html5QrCodeRef.current.start(
        { facingMode: "environment" }, 
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          await stopCamera();
          await processQRCodeData(decodedText);
        },
        () => {}
      );
      setIsScanning(true);
    } catch (err) {
      setMessage({ text: "Erro ao acessar a câmera. Verifique as permissões.", type: 'error' });
    }
  };

  const stopCamera = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      await html5QrCodeRef.current.stop();
      setIsScanning(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !html5QrCodeRef.current) return;
    if (isScanning) await stopCamera();
    
    setMessage({ text: 'Analisando imagem...', type: 'info' });
    try {
      const decodedText = await html5QrCodeRef.current.scanFile(file, false);
      await processQRCodeData(decodedText);
    } catch (error) {
      setMessage({ text: 'Erro: QR Code não detectado.', type: 'error' });
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center pt-8 px-4 font-sans pb-12 overflow-x-hidden">
      
      {/* CABEÇALHO COM NOVO BOTÃO DE HISTÓRICO */}
      <div className="w-full max-w-md mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg">
            <Receipt size={24} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">CorpExpense</h1>
        </div>
        
        <button 
          onClick={() => setIsHistoryOpen(true)}
          className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl shadow-sm hover:bg-slate-100 transition-colors relative"
          title="Ver histórico"
        >
          <History size={20} />
          {/* Bolinha indicadora caso queira chamar atenção para o botão */}
          <span className="absolute top-2 right-2 w-2 h-2 bg-indigo-500 rounded-full"></span>
        </button>
      </div>

      {/* ÁREA DE SCANNER CENTRALIZADA E LIMPA */}
      <div className="w-full max-w-md bg-white p-6 rounded-3xl shadow-xl border border-slate-100">
        <div className="text-center mb-6">
          <h2 className="text-lg font-semibold text-slate-700">Digitalizar Nota</h2>
        </div>
        
        <div className={`rounded-2xl overflow-hidden border-2 transition-all ${isScanning ? 'border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.3)]' : 'border-slate-200 bg-slate-100'}`}>
          <div id="reader" className="w-full [&>video]:w-full [&>video]:object-cover [&>video]:rounded-xl"></div>
          {!isScanning && (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400">
              <Camera size={48} className="mb-3 opacity-20" />
              <p className="text-sm font-medium">Câmera desativada</p>
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-col gap-3">
          {isScanning ? (
            <button onClick={stopCamera} className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 hover:bg-red-100 py-3 rounded-xl font-bold transition-all">
              <StopCircle size={20} /> Cancelar Câmera
            </button>
          ) : (
            <button onClick={startCamera} className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white hover:bg-indigo-700 py-3 rounded-xl font-bold transition-all shadow-md">
              <Camera size={20} /> Ativar Câmera
            </button>
          )}

          <div className="flex items-center gap-4 my-2">
            <div className="h-px bg-slate-200 flex-1"></div>
            <span className="text-xs font-semibold text-slate-400 uppercase">OU</span>
            <div className="h-px bg-slate-200 flex-1"></div>
          </div>
          
          <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-center gap-2 bg-slate-50 text-slate-700 hover:bg-slate-100 py-3 rounded-xl font-bold transition-all border border-slate-200">
            <UploadCloud size={20} /> Enviar Arquivo
          </button>
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
        </div>

        {message && (
          <div className={`mt-6 p-4 rounded-xl flex items-start gap-3 border ${message.type === 'error' ? 'bg-red-50 border-red-100 text-red-700' : message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-blue-50 border-blue-100 text-blue-700'}`}>
            <span className="font-bold text-sm leading-tight">{message.text}</span>
          </div>
        )}
      </div>

      {/* --- COMPONENTE DO PAINEL LATERAL --- */}
      
      {/* Overlay Escuro  */}
      {isHistoryOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 z-40 transition-opacity backdrop-blur-sm"
          onClick={() => setIsHistoryOpen(false)}
        ></div>
      )}

      {/* Painel Deslizante */}
      <div className={`fixed top-0 right-0 h-full w-full max-w-sm bg-slate-50 z-50 shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${isHistoryOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Cabeçalho do Painel */}
        <div className="bg-white border-b border-slate-200 p-5 flex items-center justify-between shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Clock size={20} className="text-indigo-600" /> Histórico de Envios
          </h3>
          <button 
            onClick={() => setIsHistoryOpen(false)} 
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Conteúdo do Painel */}
        <div className="p-4 overflow-y-auto flex-1 flex flex-col gap-3">
          {history.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-2xl border border-slate-200 text-slate-400 text-sm">
              <FileText size={32} className="mx-auto mb-3 opacity-20" />
              Nenhuma solicitação recente.
            </div>
          ) : (
            history.map((item, index) => (
              <div key={index} className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col gap-3 shadow-sm">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      item.status === 'APROVADO' ? 'bg-emerald-100 text-emerald-600' : 
                      item.status === 'RECUSADO' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                    }`}>
                      <FileText size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-700">R$ {Number(item.totalValue).toFixed(2)}</p>
                      <p className="text-xs text-slate-400 font-mono truncate w-32" title={item.accessKey}>
                        {item.accessKey.substring(0, 15)}...
                      </p>
                    </div>
                  </div>
                  <div className={`text-[10px] font-bold px-2 py-1 rounded-full whitespace-nowrap ${
                      item.status === 'APROVADO' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 
                      item.status === 'RECUSADO' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {item.status.replace('_', ' ')}
                  </div>
                </div>
                {item.notes && (
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 text-xs text-slate-500">
                    <strong className="text-slate-600">Obs:</strong> {item.notes}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}