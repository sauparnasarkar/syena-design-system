/** Seconds for one full turn when the globe is left to turn on its own. */
export const defaultTurnPeriod = 60;

/** The longitude gained each millisecond by a globe that turns once in `seconds`; a period that is not a positive number gives the default. */
export function degreesPerMillisecond(seconds: number): number {
  const period = Number.isFinite(seconds) && seconds > 0 ? seconds : defaultTurnPeriod;
  return 360 / (period * 1000);
}
