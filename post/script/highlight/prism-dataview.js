// prism-dataview.js

function countNonFunctionProperties(obj) {
  return Object.keys(obj).filter(key => typeof obj[key] !== 'function').length;
}

export function initDataview(Prism) {
  const lenSz1 = countNonFunctionProperties(Prism.languages);
  // Define custom language if not already defined
  if (!Prism.languages.dataview) {
    Prism.languages.dataview = {
      'comment': {
        pattern: /\/\/.*|\/\*[\s\S]*?\*\//,
        greedy: true
      },
      'string': {
        pattern: /"(?:\\.|[^\\"])*"/,
        greedy: true
      },
      'function': {
        pattern: /\b(?:table|list|task|from|flatten|contains|meta)\b/i,
        alias: 'keyword'
      },
      'keyword': {
        pattern: /\b(?:where|and|or|group by|sort|as|from)\b/i,
        greedy: true
      },
      'boolean': {
        pattern: /\b(?:true|false)\b/,
        greedy: true
      },
      'number': {
        pattern: /\b\d+\.?\d*\b/,
        greedy: true
      },
      'operator': {
        pattern: /[-+*/=<>!]+/,
        greedy: true
      },
      'punctuation': {
        pattern: /[{}[\];(),.:]/,
        greedy: true
      },
      'property': {
        pattern: /(\.\w+)/,
        alias: 'variable'
      }
    };
  }
}