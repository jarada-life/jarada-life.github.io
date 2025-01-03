
// Ensure DataViewJS is only defined once
export function initDataviewJs(Prism) {
  if (!Prism.languages.dataviewjs) {
    Prism.languages.dataviewjs = Prism.languages.extend('javascript', {
      'dataview-function': {
        pattern: /\b(?:dv\.(pages|page|list|table|task|tasks))\b/,
        alias: 'function'
      },
      'dataview-keyword': {
        pattern: /\b(?:from|flatten|where|group by|sort|as)\b/,
        alias: 'keyword'
      }
    });

    // Adding DataViewJS specific highlighting to the JavaScript base
    Prism.languages.insertBefore('dataviewjs', 'function', {
      'dataview-property': {
        pattern: /\b\w+\b(?=\.)/,
        alias: 'property'
      }
    });
  }
}