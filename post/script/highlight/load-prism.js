import { initDataview } from './prism-dataview.js'
import { initDataviewJs } from './prism-dataviewjs.js'
import { initMarkdown } from './prism-markdown.js'
import { initTemplater } from './prism-templater.js'

let initFlg = true;
const resolveDependencies = (languages) => {
  const order = [];
  const visited = new Set();

  const visit = (lang, ancestors = new Set()) => {
    if (visited.has(lang)) return;
    if (ancestors.has(lang)) {
      throw new Error(`Circular dependency detected: ${[...ancestors, lang].join(' -> ')}`);
    }

    const deps = languages[lang]?.require || [];
    if (deps) {
      const newAncestors = new Set(ancestors).add(lang);
      if (typeof deps === 'string') {
        visit(deps, newAncestors);
      } else if (Array.isArray(deps)) {
        deps.forEach(dep => visit(dep, newAncestors));
      }
    }

    visited.add(lang);
    order.push(lang);
  };

  languages.forEach(lang => visit(lang));
  return order;
};

const loadLanguage = async (Prism, language, components) => {
  if (!language) {
    console.log('Undefined language:', language);
    return;
  }

  if (language.toLowerCase() === 'embed') {
    console.log('Skipping Prism.js initialization for embed type');
    document?.querySelectorAll('pre[data-lang="embed"]').forEach(block => {
      const container = document.createElement('div');
      container.className = 'embed-container';
      block.parentNode.replaceChild(container, block);
      container.appendChild(block);
    });
    return;
  }


  if (components.languages[language]) {
    const deps = components.languages[language]?.require;
    if (deps) {
      if (typeof deps === 'string') {
        await loadLanguage(Prism, deps, components);
      } else if (Array.isArray(deps)) {
        for (const dep of deps) {
          await loadLanguage(Prism, dep, components);
        }
      }
    }
    // It's a standard language, load it dynamically if not already loaded
    if (!Prism.languages[language]) {
      try {
        const module = await import(`https://cdn.skypack.dev/prismjs/components/prism-${language}.js`);
        if (module.default) {
          console.log(`Module Additionally loaded for ${language}:`, module);
          Prism.languages[language] = module.default;
        }
      } catch (error) {
        console.error(`Error loading Prism language module for: ${language}`, error);
      }
    }
  } else {
    switch (language.toLowerCase()) {
      case 'dataview':
        initDataview(Prism);
        break;
      case 'dataviewjs':
        initDataviewJs(Prism);
        break;
      case 'markdown':
        initMarkdown(Prism);
        break;
      case 'templater':
        initTemplater(Prism);
        break;
      default:
        console.warn(`No loading or initialization method found for: ${language}`);
        break;
    }
  }
};

const loadLanguages = async (Prism, languages, components) => {
  if (!languages) {
    languages = Object.keys(components.languages).filter(lang => lang !== 'meta');
  }
  const sortedLangauge = resolveDependencies(languages);

  for (const language of sortedLangauge) {
    if (!Prism.languages[language]) {
      await loadLanguage(Prism, language, components);
    }
  }
  // console.log('Languages loaded:', languages);
  initFlg = false;
};
export { loadLanguages };

