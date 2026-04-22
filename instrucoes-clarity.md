# Microsoft Clarity — Instruções e Combinados

## Estrutura da Planilha Google Sheets
- Planilha: "Clarity Análise - g4business.com"
- ID: 10M_2Ne7UDvwezJVJEoWnxThJFvZWKmqpel-vlNOUemM

## Regra de abas por dia
- Cada dia de análise tem SUA PRÓPRIA ABA na planilha
- Nome da aba: data no formato DD/MM/AA (ex: 20/04/26)
- Cada aba diária contém TUDO: Painel + Gravações + Mapas de Calor
- Dados sempre do dia ANTERIOR (análise feita no dia seguinte)

## O que coletar por dia (cada aba diária)
### PAINEL (Painéis no Clarity)
- Sessões totais
- Páginas por sessão
- Profundidade de rolagem (scroll depth)
- Tempo ativo médio
- Usuários únicos
- Sessões com novos usuários (%)
- Sessões com usuários retornados (%)
- Cliques contínuos (%)
- Cliques mortos / Dead clicks (%)
- Rolagem excessiva (%)
- Retornos rápidos (%)
- Eventos inteligentes: Clique de saída, Finalizar compra, Aproveitar Oportunidade, Enviar formulário
- Funis: Taxa de conversão, Sessões convertidas
- Top páginas com sessões

### GRAVAÇÕES (aba Gravações no Clarity)
- Resumo IA das gravações (botão "Resumir gravações")
- Problemas identificados com ocorrências estimadas

### MAPAS DE CALOR (aba Mapas de Calor no Clarity)
- Scroll depth desktop e mobile por página
- Dead clicks e rage clicks por página
- Problema principal por página

## Abas consolidadas (não por dia — acumulam todos os dias)
- "Erros JS" — uma única aba com erros de todos os 7+ dias analisados
- "Recomendações" — uma única aba com recomendações consolidadas dos 7+ dias

## Processo de coleta — REGRAS IMPORTANTES
1. SEMPRE um dia por vez
2. Após salvar um dia na planilha, PEDIR PERMISSÃO antes de ir para o próximo dia
3. Filtro no Clarity: URL começa com https://g4business.com
4. Período analisado: sempre "1 dia" (o dia específico em análise)
5. Após coletar todos os dias: montar aba única de Erros JS e aba única de Recomendações

## Coleta de 7 dias em andamento (iniciada em 22/04/2026)
- Dias a coletar: 14/04, 15/04, 16/04, 17/04, 18/04, 19/04, 20/04, 21/04
- Status: pendente — iniciando pelo dia 14/04/2026

## Filtros padrão no Clarity
- URL começa com: https://g4business.com
- Período: selecionar o dia específico

## Observações importantes da imagem do painel
- O painel mostra "Visão geral dos usuários" (marcado com círculo azul) — essa seção é a principal
- "Meus Favoritos" aparece vazio — não há dados salvos
- Funil "Conversão GE -> Form" mostra 0% de conversão
- Seção "Compras" mostra < 0,01%
- Dados do print (últimos 3 dias até 22/04/2026):
  - Sessões: 11.564 (1.237 bots excluídos)
  - Páginas/sessão: 2,11
  - Scroll depth: 72,80%
  - Tempo ativo: 1,1 min
  - Usuários únicos: 10.071
  - Novos usuários: 79,96% (9.248)
  - Retornados: 20,04% (2.318)
  - Dead clicks: 12,63% (1.461 sessões)
  - Retornos rápidos: 9,70% (1.122 sessões)

## Dashboard HTML
- Arquivo: clarity-dashboard.html (salvo no Google Drive)
- ID Drive: 1A8DwRvX2SzOt3og4MYsrZ0Ihs-eNM-KL
- Atualizar dados manualmente após cada análise

## Apps Script para gráficos
- Arquivo: Clarity_Dashboard_Charts.gs (salvo no Google Drive)
- ID Drive: 1hMQGpCQHcWu-iJFpRzob5HlZawqj0ueu
- Rodar uma vez: Extensões > Apps Script > criarTodosGraficos
