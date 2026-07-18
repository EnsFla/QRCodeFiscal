// pages/dashboard.tsx
import { useEffect, useState } from 'react';
import { Check, X, Clock, DollarSign, FileText, CheckCircle2, Download } from 'lucide-react';

type Reimbursement = { 
  id: number; 
  accessKey: string; 
  totalValue: number; 
  status: string; 
  notes: string; 
  date: string 
};

export default function Dashboard() {
  const [records, setRecords] = useState<Reimbursement[]>([]);

  const fetchRecords = async () => {
    try {
      const res = await fetch('/api/reimbursements');
      if (res.ok) setRecords(await res.json());
    } catch (error) {
      console.error("Erro ao buscar registros", error);
    }
  };

  useEffect(() => { 
    fetchRecords(); 
  }, []);

  const updateStatus = async (id: number, newStatus: string, notes?: string) => {
    const bodyData: any = { id, newStatus };
    if (notes) bodyData.notes = notes;

    await fetch('/api/reimbursements', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyData)
    });
    fetchRecords();
  };

  const handleReject = (id: number) => {
    // Abre uma janela nativa pedindo o motivo
    const reason = window.prompt("Por favor, digite o motivo da recusa:");
    
    if (reason === null) return; 

    const finalReason = reason.trim() === "" 
      ? "Recusado pelo gestor sem motivo especificado." 
      : `Recusado: ${reason}`;

    updateStatus(id, 'RECUSADO', finalReason);
  };

  // Função para exportar os dados aprovados para CSV
  const exportToCSV = (reimbursements: Reimbursement[]) => {
    const aprovados = reimbursements.filter(item => item.status === 'APROVADO');
    
    if (aprovados.length === 0) {
      alert("Não há despesas aprovadas para exportar neste momento.");
      return;
    }

    const headers = ['ID', 'Chave de Acesso', 'Valor (R$)', 'Status', 'Observacoes'];
    
    const csvRows = aprovados.map(item => {
      return [
        item.id,
        `"${item.accessKey}"`, 
        item.totalValue.toFixed(2),
        item.status,
        `"${item.notes || ''}"`
      ].join(',');
    });

    const csvString = [headers.join(','), ...csvRows].join('\n');
    
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `lote_pagamento_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Cálculos para os Cards
  const totalGasto = records.filter(r => r.status === 'APROVADO').reduce((acc, curr) => acc + curr.totalValue, 0);
  const totalPendentes = records.filter(r => r.status === 'PENDENTE_GESTOR').length;

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Navbar Superior */}
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-1.5 rounded-lg text-white">
            <DollarSign size={20} />
          </div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">CorpExpense Admin</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
            GF
          </div>
          <span className="text-sm font-medium text-slate-600">Gestor Financeiro</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-8">
        {/* Cards de Resumo  */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="p-4 rounded-full bg-emerald-50 text-emerald-600"><CheckCircle2 size={24} /></div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Aprovado</p>
              <h3 className="text-2xl font-bold text-slate-800">R$ {totalGasto.toFixed(2)}</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="p-4 rounded-full bg-amber-50 text-amber-600"><Clock size={24} /></div>
            <div>
              <p className="text-sm font-medium text-slate-500">Aguardando Aprovação</p>
              <h3 className="text-2xl font-bold text-slate-800">{totalPendentes} notas</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="p-4 rounded-full bg-indigo-50 text-indigo-600"><FileText size={24} /></div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Processado</p>
              <h3 className="text-2xl font-bold text-slate-800">{records.length} registros</h3>
            </div>
          </div>
        </div>

        {/* Tabela de Dados */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-slate-800">Últimas Solicitações</h2>
            
            <button 
              onClick={() => exportToCSV(records)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-4 rounded-xl shadow-sm transition-all flex items-center gap-2 text-sm"
            >
              <Download size={18} />
              Exportar Lote (CSV)
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                <tr>
                  <th className="px-6 py-4">Chave de Acesso</th>
                  <th className="px-6 py-4">Valor</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Detalhes</th>
                  <th className="px-6 py-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-mono text-slate-600">
                      {rec.accessKey.substring(0, 16)}...
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-800">
                      R$ {rec.totalValue.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                        rec.status === 'APROVADO' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        rec.status === 'RECUSADO' ? 'bg-red-50 text-red-700 border-red-200' : 
                        'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {rec.status === 'APROVADO' && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>}
                        {rec.status === 'PENDENTE_GESTOR' && <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>}
                        {rec.status === 'RECUSADO' && <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>}
                        {rec.status.replace('_GESTOR', '')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate" title={rec.notes}>
                      {rec.notes}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {rec.status === 'PENDENTE_GESTOR' ? (
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => updateStatus(rec.id, 'APROVADO', 'Aprovado manualmente pelo gestor.')} 
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg border border-transparent hover:border-emerald-200 transition-all" 
                            title="Aprovar"
                          >
                            <Check size={18} />
                          </button>
                          <button 
                            onClick={() => handleReject(rec.id)} 
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-200 transition-all" 
                            title="Recusar"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-300 text-sm">-</span>
                      )}
                    </td>
                  </tr>
                ))}
                {records.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      Nenhuma solicitação encontrada no momento.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}