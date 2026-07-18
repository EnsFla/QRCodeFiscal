// pages/api/process-receipt.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const TETO_GASTO = 70.00;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { qrCodeText } = req.body;

    // A chave de acesso é o próprio texto do QR Code
    const accessKey = qrCodeText.trim(); 
    
    // Gera um valor aleatório entre R$ 15.00 e R$ 150.00 para a demo
    // notas diferentes tem valores diferentes
    const randomSeed = accessKey.length + (accessKey.charCodeAt(0) || 0);
    const totalValue = 15 + (randomSeed % 135) + (Math.random() * 10);

    let status = 'APROVADO';
    let notes = 'Aprovado automaticamente (dentro do limite).';

    if (totalValue > TETO_GASTO) {
      status = 'PENDENTE_GESTOR';
      notes = `Valor R$ ${totalValue.toFixed(2)} excede o teto de R$ ${TETO_GASTO.toFixed(2)}.`;
    }

    const record = await prisma.reimbursement.create({
      data: { accessKey, totalValue, status, notes }
    });

    return res.status(200).json({ success: true, record });

  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Fraude detectada: Esta nota já foi processada!' });
    }
    return res.status(500).json({ error: 'Erro interno no servidor.' });
  }
}