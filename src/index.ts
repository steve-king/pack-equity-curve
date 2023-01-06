import * as coda from '@codahq/packs-sdk'
import { nanoid } from 'nanoid'

export const pack = coda.newPack()

const EquityCurveSchema = coda.makeObjectSchema({
  properties: {
    itemId: { type: coda.ValueType.String },
    sequence: { type: coda.ValueType.Number },
    trade: { type: coda.ValueType.Number },
    result: { type: coda.ValueType.String },
    staticPnl: { type: coda.ValueType.Number },
    staticBalance: { type: coda.ValueType.Number },
    compoundPnl: { type: coda.ValueType.Number },
    compoundBalance: { type: coda.ValueType.Number },
  },
  displayProperty: 'result',
  idProperty: 'itemId',
  featuredProperties: [
    'Sequence',
    'Trade',
    'Result',
    'Static Pnl',
    'Static Balance',
    'CompoundPnl',
    'CompoundBalance',
  ],
})

pack.addSyncTable({
  name: 'EquityCurves',
  description: 'Simulated sequences of win/loss outcomes and cumulative PnL',
  schema: EquityCurveSchema,
  identityName: 'Item',
  formula: {
    name: 'GenerateSequences',
    description:
      'Generate win/loss sequences and their cumulative PnL based on given parameters',
    parameters: [
      coda.makeParameter({
        name: 'numSequences',
        description: 'Number of sequences to generate',
        type: coda.ParameterType.Number,
      }),
      coda.makeParameter({
        name: 'numTrades',
        description: 'Number of trades to generate per sequence',
        type: coda.ParameterType.Number,
      }),
      coda.makeParameter({
        name: 'winRate',
        description: 'Win rate percentage',
        type: coda.ParameterType.Number,
      }),
      coda.makeParameter({
        name: 'rMultiple',
        description: 'R multiple for winning trades',
        type: coda.ParameterType.Number,
      }),
      coda.makeParameter({
        name: 'startingBalance',
        description: 'The starting account balance',
        type: coda.ParameterType.Number,
      }),
      coda.makeParameter({
        name: 'riskPercentage',
        description: 'Percentage of account balanced risked per trade',
        type: coda.ParameterType.Number,
      }),
    ],
    execute: async function (
      [
        numSequences,
        numTrades,
        winRate,
        rMultiple,
        startingBalance,
        riskPercentage,
      ],
      context
    ) {
      let rows = []

      for (let i = 1; i <= numSequences; i++) {
        rows = rows.concat(
          generateSequence(
            i,
            numTrades,
            winRate,
            rMultiple,
            startingBalance,
            riskPercentage
          )
        )
      }

      return {
        result: rows,
      }
    },
  },
})

export function generateSequence(
  sequence,
  numTrades,
  winRate,
  rMultiple,
  startingBalance,
  riskPercentage
) {
  const results = winLossSequence(winRate, numTrades)

  return results.reduce((items, result, i) => {
    const staticRisk = startingBalance * (riskPercentage / 100)
    const staticPnl =
      result === TradeResult.Loss ? staticRisk * -1 : staticRisk * rMultiple

    const staticBalance =
      items.map((item) => item.staticPnl).reduce((a, b) => a + b, 0) +
      staticPnl +
      startingBalance

    const compoundRisk =
      items.length === 0
        ? staticRisk
        : items[items.length - 1].compoundBalance * (riskPercentage / 100)

    const compoundPnl =
      result === TradeResult.Loss ? compoundRisk * -1 : compoundRisk * rMultiple

    const compoundBalance =
      items.length === 0
        ? startingBalance + compoundPnl
        : items[items.length - 1].compoundBalance + compoundPnl

    items.push({
      itemId: nanoid(),
      sequence,
      trade: i + 1,
      result,
      staticPnl,
      staticBalance,
      compoundPnl: Math.round(compoundPnl * 100) / 100,
      compoundBalance: Math.round(compoundBalance * 100) / 100,
    })

    return items
  }, [])
}

export enum TradeResult {
  Loss = 'Loss',
  Win = 'Win',
}

/**
 * Generate a randomised sequence of wins and losses (true/false)
 * @param winProbability - probability of any one data point being a win (number between 0 and 100)
 * @param length - length of the sequence (number of trades)
 * @returns Array of win/loss strings
 */
export function winLossSequence(
  winProbability: number,
  length: number
): TradeResult[] {
  let sequence = []

  for (let i = 0; i < length; i++) {
    let win = Math.random() <= winProbability / 100
    sequence.push(win ? TradeResult.Win : TradeResult.Loss)
  }

  return sequence
}
