# Teste A/B — Botões do Header (Aplique-se vs Acessar)

## Objetivo
Medir se a troca do copy dos botões do header aumenta o CTR (cliques / total de cliques na página).

## Botões monitorados

| Botão | Seletor CSS (fixo) | Destino |
|-------|-------------------|---------|
| **Aplique-se** | `HEADER > ... > elementor-widget-button:nth-of-type(2) > A.elementor-button-link.elementor-size-sm` | `https://forms.g4educacao.com/inscricao/g4-programas-presenciais?...` |
| **Acessar** | `HEADER > ... > elementor-widget-button:nth-of-type(1) > elementor-button` | `https://portal.g4educacao.com/` |

> ⚠️ O monitoramento usa o **seletor CSS** (posição no DOM), não o texto do botão.
> Portanto, ao trocar o copy, o rastreamento continua automaticamente.

## Fases do teste

| Fase | Período | Copy |
|------|---------|------|
| **A — Baseline** | 14/04/2026 – 14/05/2026 (27 dias) | "Aplique-se" / "Acessar" |
| **B — Variante** | 15/05/2026 em diante | Copy novo (a definir) |

## Resultado Fase A (baseline — 27 dias)

| Botão | Cliques totais | CTR médio | 
|-------|---------------|-----------|
| Aplique-se | 1.735 | 4.97% |
| Acessar | 390 | 1.12% |
| **Razão** | **4.45x** | — |

## Como rodar a análise

```bash
# Na pasta do projeto:
node scripts/ab-buttons.js
# Gera: data/ab-buttons.json
```

## Como adicionar novos dias (Fase B)

1. Baixar CSVs do Clarity normalmente na pasta `05-maio/DD-05/`
2. Rodar `node scripts/csv-to-json.js 05-maio 2026-05`
3. Rodar `node scripts/ab-buttons.js`
4. Commitar `data/ab-buttons.json` e `data/2026-05.json`
5. Push para GitHub Pages atualizar o dashboard

## Critério de sucesso (sugestão)

- **CTR Aplique-se** sobe > 6% na Fase B (vs 4.97% na Fase A)
- **Razão Aplique-se/Acessar** mantém ou sobe acima de 4.45x
- Período mínimo de análise: **14 dias** na Fase B para ter significância

## Verificar classe CSS antes de trocar o copy

Antes de trocar o copy, abrir DevTools no Chrome e confirmar:
- Botão "Aplique-se" ainda é `elementor-widget-button:nth-of-type(2)` no `HEADER`
- Botão "Acessar" ainda é `elementor-widget-button:nth-of-type(1)` no `HEADER`

Se a classe mudar, atualizar a função `classifySelector` em `scripts/ab-buttons.js`.
