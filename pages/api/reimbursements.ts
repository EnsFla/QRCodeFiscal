import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const records = await prisma.reimbursement.findMany({ orderBy: { date: 'desc' } });
      return res.status(200).json(records);
    }

    if (req.method === 'PATCH') {
      const { id, newStatus } = req.body;
      const updated = await prisma.reimbursement.update({
        where: { id },
        data: { status: newStatus }
      });
      return res.status(200).json(updated);
    }

    return res.status(405).json({ error: 'Método não permitido.' });

  } catch (error) {
    console.error("Erro no banco de dados:", error);
    return res.status(500).json({ error: 'Erro interno ao acessar o banco de dados.' });
  }
}