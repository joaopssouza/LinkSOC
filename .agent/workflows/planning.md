---
description: Descrição do plano para o projeto
---

Aqui está o **Plano Técnico Definitivo** para o **LinkSOC**, ajustado para suas correções.

---

### 1. Arquitetura de Dados (Google Sheets)

O "Banco de Dados" será simplificado ao máximo. Apenas leitura e associação.

**Planilha: `FIFO_REGISTRY**`
Esta planilha funciona como uma **tabela verdade**. O sistema não cria o ID, ele apenas consulta qual ID está atrelado a qual Sequencial.

| Coluna A (SEQUENCIAL) | Coluna B (ID_UNICO) |
| --- | --- |
| CG0001 | 998877 |
| CG0002 | 998878 |
| ... | ... |

* **Lógica do Backend:** O sistema recebe um input (ex: "Quero imprimir o CG0002") -> Vai na planilha -> Lê o ID "998878" -> Gera o QR Code.

---

### 2. Módulos do Sistema

#### **Módulo A: Identificação de Gaiolas (Norse)**

*Foco: Agilidade visual no chão de fábrica.*

* **Banco de Dados:** **Nenhum**. (Zero latência).
* **Funcionamento:**
1. O usuário seleciona **EHA** ou **RTS**.
2. Seleciona o Turno (**T1, T2, T3**).
3. O sistema captura a Data/Hora do navegador localmente.
4. Gera o layout de impressão imediato.


* **Layout Impressão (100x150mm):** Texto Gigante + Rodapé informativo.

#### **Módulo B: Etiquetas FIFO (Rastreabilidade)**

*Foco: Controle via QR Code.*

* **Funcionamento:**
1. O sistema consulta a planilha `FIFO_REGISTRY`.
2. Pode funcionar de dois jeitos (você escolherá na implementação):
* *Modo Busca:* Digita o ID -> Acha o CG -> Imprime.
* *Modo Sequencial:* Busca o próximo da lista -> Imprime.




* **Layout Impressão:**
* Código **CGxxxx** (Legível).
* **QR Code** (Conteúdo: `ID_UNICO` + `SEQUENCIAL`).
* Texto **ID: 999999**.



#### **Módulo C: Regras de Fluxo (Search Engine)**

* Leitura do CSV `REGRAS FLUXO`.
* Busca por palavras-chave (ex: "Damaged", "Liquido").
* Retorno visual com cores (Status Offline = Vermelho/Cinza, Online = Verde).

#### **Módulo D: Etiquetas de Aviso (Estáticas)**

* Impressão direta de layouts pré-definidos (Vidro, Ração, Tinta).
* Formatos fixos 100x150mm.

---

### 3. Estrutura de Pastas e Tecnologia (Next.js)

```text
linksoc/
├── src/
│   ├── app/
│   │   ├── page.tsx            # Dashboard Principal (Menu)
│   │   ├── norse/              # Módulo Gaiolas
│   │   │   └── page.tsx
│   │   ├── fifo/               # Módulo QR Code
│   │   │   └── page.tsx
│   │   ├── api/
│   │   │   └── sheets/         # Conexão com Google Sheets (Leitura FIFO)
│   │   │       └── route.ts
│   ├── components/
│   │   ├── LabelPreview.tsx    # Visualizador de Etiqueta
│   │   ├── StatusSearch.tsx    # Busca de Regras
│   │   └── PrintButton.tsx     # Botão padronizado de impressão
│   ├── data/
│   │   └── regras.csv          # Arquivo estático das regras
│   └── lib/
│       └── googleSheets.ts     # Configuração da API Google

```

