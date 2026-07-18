## Funcionalidades

### Portal do Colaborador (/)
* **Scanner de QR Code:** Leitura em tempo real pela câmera do dispositivo ou via upload de arquivo de imagem.
* **Validação Automatizada:** Envio e validação da chave de acesso do documento fiscal junto à API de processamento.
* **Painel Lateral de Histórico:** Drawer deslizante que exibe o status dos últimos 10 envios, mantendo a tela principal limpa.

### Painel do Gestor (/dashboard)
* **Indicadores em Tempo Real:** Visualização do valor total aprovado, notas pendentes e volume total processado.
* **Fluxo de Aprovação e Recusa:** Botões para aprovação manual e recusa obrigatória com inserção de justificativa.
* **Exportação em CSV:** Geração de arquivo CSV contendo os dados das despesas aprovadas para integração com lotes de pagamento.

## Tecnologias Utilizadas

* **Framework:** Next.js (React) com API Routes para o backend integrado.
* **Banco de Dados e ORM:** Prisma ORM com base de dados SQLite.
* **Estilização:** Tailwind CSS.
* **Ícones:** Lucide React.
* **Leitor de QR Code:** Html5-Qrcode.
