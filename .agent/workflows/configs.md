---
description: config projeto
---

Módulo A: Configuração e Design System
Definição da identidade visual baseada na Shopee.

Cores: Configurar o Tailwind com as variáveis:

shopee-primary: #EE4D2D

shopee-light: #e44a2b

shopee-dark: #D0011B

shopee-blue: #113366

Tipografia: Roboto.

Layout Base: Sidebar de navegação, Cabeçalho com identificação do setor (SOC MG2 - Tratativa).

2. Arquitetura da Solução (Stack Vercel + Next.js)
Para atender à restrição de usar apenas o que a Vercel suporta e manipular planilhas, utilizaremos a Google Sheets API como camada de persistência. A Vercel não mantém arquivos .csv locais salvos após o deploy (sistema de arquivos efêmero), então o Google Sheets é a escolha perfeita para atuar como seu Banco de Dados persistente.

Frontend: Next.js (App Router) + Tailwind CSS (Paleta Shopee) + Lucide React (Ícones).

Backend: Next.js API Routes (Serverless Functions).

Database: Google Sheets (via Service Account Google Cloud).

Gerador de Códigos: qrcode.react e jsbarcode.

Manipulação de Dados: papaparse (para ler o CSV de regras estáticas) e google-spreadsheet (para gravar os logs e QRs).