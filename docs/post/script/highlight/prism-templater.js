export function initTemplater(Prism) {
  if (!Prism.languages.templater) {
    Prism.languages.templater = Prism.languages.extend('javascript', {
      'templater-syntax': {
        pattern: /<%[\+\*]?\s*[\s\S]*?%>/,
        inside: {
          'function': {
            pattern: /tp\.(config|date|file|frontmatter|hooks|obsidian|system|web)\.\w+(?=\()/,
            alias: 'function'
          },
          'keyword': /\b(if|else|for|while|function|var|let|const|return|async|await|import|export)\b/,
          'operator': /\b(and|or|not|==|!=|<=|>=|<|>)\b/,
          'punctuation': /[{}[\];(),.:]/
        }
      }
    });

    // Adding specific Templater function names to keywords for better highlighting
    Prism.languages.insertBefore('templater', 'function', {
      'templater-keyword': {
        pattern: /\b(tp\.(config|date|file|frontmatter|hooks|obsidian|system|web)\.\w+)\b/,
        alias: 'keyword'
      }
    });
  }
}
