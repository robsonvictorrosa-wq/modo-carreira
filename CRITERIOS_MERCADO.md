# Critérios do Mercado de Transferências (Etapa 4)

Cada sala tem seu próprio universo: quando um jogador muda de clube, a sala guarda uma cópia dele (clube, salário, contrato, multa, moral). As simulações usam sempre os elencos atualizados da sala.

## Janelas
- **Início de temporada**: aberta da largada até a rodada 4 (4 dias de mercado).
- **Meio de temporada**: 3 dias a partir da metade do campeonato.
- O dono da sala pode **abrir**, **fechar** ou voltar ao **automático**.
- Cada avanço de rodada com a janela aberta = 1 "dia de mercado".

## Limites
- Elenco: mínimo **16**, máximo **32** (bots: máx. 30, liberam o pior se passarem).
- Verba de transferência e teto salarial semanal (folha atual × 1,1) por clube. Vendas aumentam a verba.
- Rescisão: paga 50% dos salários restantes (máx. 2 anos). O jogador vira agente livre.

## Preço que o clube pede
`valor de mercado × idade × potencial × importância`, com ajustes:

| Fator | Valor |
|---|---|
| Idade ≤19 / ≤21 / ≤24 / ≤28 / ≤30 / ≤32 / 33+ | ×1,25 / 1,18 / 1,10 / 1,00 / 0,90 / 0,75 / 0,60 |
| Potencial | +1,2% por ponto de (potencial − OVR) |
| Importância: chave (top 3 ou bem acima do XI) / titular / rotação / reserva | ×1,55 / 1,30 / 1,05 / 0,85 |
| Contrato acabando | ×0,72 |
| Jogador quer sair / colocado à venda | ×0,82 / ×0,90 |
| Clube vendedor sem dinheiro (< € 0,5 M) | ×0,92 |
| Fim da janela | +5% por dia de mercado |
| Insistência | +5% por proposta recusada |
| Rival direto (mesma liga) | ×1,25 |
| Variação por clube | ±5% |

## Decisão do clube (nesta ordem)
1. Cláusula de rescisão paga → **venda obrigatória**. Multas padrão: Espanha 4× o valor; Portugal, Brasil e CONMEBOL 3×; outras ligas não têm.
2. O elenco ficaria abaixo do mínimo → recusa.
3. Empréstimo → só jovens (≤23) fora dos planos.
4. Titular-chave → **inegociável** abaixo de 115% do preço pedido.
5. Rival da mesma liga abaixo do preço → recusa.
6. Clube maior não vende titular para clube menor abaixo de 120% do preço.
7. ≥100% do preço → aceita. 65–100% → **contraproposta** com valor plausível. 40–65% → "muito abaixo". <40% → "desrespeitosa".
8. Depois de 4 recusas do clube, as negociações **esfriam por 3 dias**.

## Decisão do jogador (mesmo com os clubes de acordo)
- **Papel prometido** (estrela, titular, rotação, promessa, reserva) precisa ser compatível com o OVR dele no seu elenco. Ninguém aceita papel abaixo do esperado. Jovem (≤23) não aceita ser reserva. "Promessa" só vale para quem tem até 21 anos e potencial.
- **Recusas definitivas**:
  - OVR ≥78 indo para um clube bem menor: "não quer se transferir para um clube de menor expressão".
  - Menor de 29 anos indo para uma liga bem menos atraente.
  - Titular feliz (moral ≥60) a ~70% de chance: "está feliz no clube".
  - Exceções: salário muito alto, veterano em fim de carreira ou jogador que quer sair.
- **Salário pedido**: o salário atual × 1,15 (agente livre: ×1,0), ajustado por:
  - Prestígio do clube e da liga.
  - Papel de estrela: +10%.
  - Veterano.
  - Quer sair: −10%.
  - Insistência: +5% por tentativa.
- **Resposta à proposta salarial**:
  - Salário ≥ pedido: aceita.
  - Pelo menos 85% do pedido: ele diz quanto quer, e esse valor fica garantido.
  - Abaixo disso: recusa.
- 3 recusas ou uma recusa definitiva encerram as conversas por 3 dias.

## Mercado dos bots (a cada dia de janela)
- Cada clube bot tem 55% de chance por dia (início) ou 25% (meio) de ir às compras.
- **Necessidade**: posição abaixo da meta (GOL 3, DEF 8, MEI 8, ATA 5) ou o setor mais fraco do XI.
- Os bots procuram jogadores na faixa de nível do próprio time e respeitam as mesmas regras de clube e de jogador.
- **Fluxos realistas**:
  - Ricos compram dos menores.
  - Ligas exportadoras (Brasil, Argentina, Portugal, Holanda…) vendem jovens para a Europa.
  - Veteranos (33+) vão para a Arábia Saudita, a MLS e afins.
  - Jovens saem emprestados.
  - Bots também contratam agentes livres.
- O orçamento é respeitado e atualizado com as vendas.
- **Propostas a humanos**:
  - Chance de 60% por dia (início) ou 45% (meio), mais propostas extras por jogadores à venda.
  - Prazo de 2 dias para responder.
  - Se o técnico pedir mais, o bot paga até um teto secreto de 108–123% da proposta.
- **Jogador chateado**: se você recusar uma oferta grande (≥125% do valor) de um clube maior, a moral dele cai 25. Abaixo de 50, ele **pede para sair**: OVR −2 nos jogos, preço menor.
- Notícias do mercado são postadas na sala a cada dia.

## Desempenho
Universo em memória, gravações em lote (unnest) e processamento só quando a rodada avança.
