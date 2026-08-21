// Chart color parameters, derived from the dataviz skill's validated dark
// categorical order (fixed order = the CVD-safety mechanism — never cycle or
// re-sort these). Used for adjacent-pairlist contexts (bars, lines, stacks).
// Kept to the first 3–4 slots wherever a chart shows all series at once
// (radar/scatter-like "all-pairs" contexts), per the skill's series cap.

export const CATEGORICAL = [
  '#3987e5', // slot 1 — blue
  '#d95926', // slot 2 — orange
  '#199e70', // slot 3 — aqua
  '#c98500', // slot 4 — yellow
  '#d55181', // slot 5 — magenta
  '#9085e9', // slot 7 — violet
  '#e66767', // slot 8 — red
];

export const SEQUENTIAL_BLUE = ['#0d366b', '#184f95', '#256abf', '#3987e5', '#6da7ec', '#9ec5f4', '#cde2fb'];

export const STATUS = {
  good: '#0ca30c',
  warning: '#fab219',
  serious: '#ec835a',
  critical: '#d03b3b',
};

export const CHART_CHROME = {
  surface: '#0c1120',
  grid: '#232c4b',
  axis: '#5b6690',
  textPrimary: '#dde1f2',
  textSecondary: '#8b93b8',
};
