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
