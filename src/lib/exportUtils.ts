import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { toast } from '@/components/ui/sonner';
import { formatCurrency, type Transaction } from '@/data/mockData';

export function exportToPDF(transactions: Transaction[], mes: string) {
    const doc = new jsPDF({ orientation: 'landscape' });

    // Cabeçalho
    doc.setFontSize(16);
    doc.setTextColor(40, 40, 40);
    doc.text(`Meu Norte — Lançamentos`, 14, 16);
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text(`Período: ${mes}`, 14, 23);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`, 14, 29);

    // Totais por tipo
    const totalReceitas = transactions.filter(t => t.tipo === 'receita').reduce((s, t) => s + t.valor, 0);
    const totalDespesas = transactions.filter(t => t.tipo === 'despesa').reduce((s, t) => s + t.valor, 0);
    const totalReneg = transactions.filter(t => t.tipo === 'renegociacao').reduce((s, t) => s + t.valor, 0);

    doc.setFontSize(9);
    doc.setTextColor(34, 197, 94);
    doc.text(`Receitas: ${formatCurrency(totalReceitas)}`, 14, 38);
    doc.setTextColor(239, 68, 68);
    doc.text(`Despesas: ${formatCurrency(totalDespesas)}`, 70, 38);
    doc.setTextColor(245, 158, 11);
    doc.text(`Renegociações: ${formatCurrency(totalReneg)}`, 140, 38);
    doc.setTextColor(59, 130, 246);
    doc.text(`Saldo: ${formatCurrency(totalReceitas - totalDespesas)}`, 220, 38);

    // Tabela
    const rows = transactions.map(t => [
        t.tipo === 'receita' ? 'Receita' : t.tipo === 'renegociacao' ? 'Renegociado' : 'Despesa',
        t.descricao,
        t.categoria,
        new Date(t.vencimento + 'T00:00:00').toLocaleDateString('pt-BR'),
        formatCurrency(t.valor),
        t.status === 'pago' ? 'Pago' : 'Pendente',
        t.observacoes || '',
    ]);

    autoTable(doc, {
        startY: 44,
        head: [['Tipo', 'Descrição', 'Categoria', 'Vencimento', 'Valor', 'Status', 'Observações']],
        body: rows,
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [30, 30, 46], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 245, 250] },
        columnStyles: {
            0: { cellWidth: 24 },
            3: { cellWidth: 26 },
            4: { cellWidth: 30, halign: 'right' },
            5: { cellWidth: 22 },
        },
        didDrawCell: (data) => {
            if (data.column.index === 0 && data.section === 'body') {
                const val = data.cell.raw as string;
                if (val === 'Receita') data.cell.styles.textColor = [34, 197, 94];
                else if (val === 'Despesa') data.cell.styles.textColor = [239, 68, 68];
                else data.cell.styles.textColor = [245, 158, 11];
            }
            if (data.column.index === 5 && data.section === 'body') {
                const val = data.cell.raw as string;
                if (val === 'Pago') data.cell.styles.textColor = [34, 197, 94];
                else data.cell.styles.textColor = [245, 158, 11];
            }
        },
    });

    doc.save(`financeai-lancamentos-${mes}.pdf`);
    toast.success('PDF exportado com sucesso!');
}

export function exportToExcel(transactions: Transaction[], mes: string) {
    const rows = transactions.map(t => ({
        Tipo: t.tipo === 'receita' ? 'Receita' : t.tipo === 'renegociacao' ? 'Renegociado' : 'Despesa',
        Descrição: t.descricao,
        Categoria: t.categoria,
        Vencimento: new Date(t.vencimento + 'T00:00:00').toLocaleDateString('pt-BR'),
        Valor: Number(t.valor),
        Status: t.status === 'pago' ? 'Pago' : 'Pendente',
        Observações: t.observacoes || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);

    // Largura das colunas
    worksheet['!cols'] = [
        { wch: 14 }, { wch: 40 }, { wch: 20 },
        { wch: 14 }, { wch: 16 }, { wch: 12 }, { wch: 40 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Lançamentos ${mes}`);
    XLSX.writeFile(workbook, `financeai-lancamentos-${mes}.xlsx`);
    toast.success('Excel exportado com sucesso!');
}

export async function compartilharResumo(transactions: Transaction[], mes: string) {
    const totalReceitas = transactions.filter(t => t.tipo === 'receita').reduce((s, t) => s + t.valor, 0);
    const totalDespesas = transactions.filter(t => t.tipo === 'despesa').reduce((s, t) => s + t.valor, 0);
    const saldo = totalReceitas - totalDespesas;

    const texto = [
        `📊 Meu Norte — Resumo de ${mes}`,
        ``,
        `📈 Receitas:     ${formatCurrency(totalReceitas)}`,
        `📉 Despesas:     ${formatCurrency(totalDespesas)}`,
        `💰 Saldo:        ${formatCurrency(saldo)}`,
        ``,
        `Total de lançamentos: ${transactions.length}`,
    ].join('\n');

    if (navigator.share) {
        await navigator.share({ title: `Meu Norte — ${mes}`, text: texto });
    } else {
        await navigator.clipboard.writeText(texto);
        toast.success('Resumo copiado para a área de transferência! 📋');
    }
}
