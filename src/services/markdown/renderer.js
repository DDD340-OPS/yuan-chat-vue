import hljs from 'highlight.js/lib/core'
import bash from 'highlight.js/lib/languages/bash'
import css from 'highlight.js/lib/languages/css'
import go from 'highlight.js/lib/languages/go'
import java from 'highlight.js/lib/languages/java'
import javascript from 'highlight.js/lib/languages/javascript'
import json from 'highlight.js/lib/languages/json'
import markdown from 'highlight.js/lib/languages/markdown'
import python from 'highlight.js/lib/languages/python'
import sql from 'highlight.js/lib/languages/sql'
import typescript from 'highlight.js/lib/languages/typescript'
import xml from 'highlight.js/lib/languages/xml'
import yaml from 'highlight.js/lib/languages/yaml'
import MarkdownIt from 'markdown-it'

const SAFE_LINK_PREFIXES = ['http://', 'https://', 'mailto:', 'tel:', '/', './', '../', '#', '?']

hljs.registerLanguage('bash', bash)
hljs.registerLanguage('sh', bash)
hljs.registerLanguage('shell', bash)
hljs.registerLanguage('css', css)
hljs.registerLanguage('go', go)
hljs.registerLanguage('java', java)
hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('js', javascript)
hljs.registerLanguage('json', json)
hljs.registerLanguage('markdown', markdown)
hljs.registerLanguage('md', markdown)
hljs.registerLanguage('python', python)
hljs.registerLanguage('py', python)
hljs.registerLanguage('sql', sql)
hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('ts', typescript)
hljs.registerLanguage('html', xml)
hljs.registerLanguage('xml', xml)
hljs.registerLanguage('vue', xml)
hljs.registerLanguage('yaml', yaml)
hljs.registerLanguage('yml', yaml)

function isSafeLink(url) {
  const normalized = decodeURIComponent(String(url ?? ''))
    .trim()
    .toLowerCase()
    .replace(/[\u0000-\u001f\u007f-\u009f]/g, '')

  if (!normalized) {
    return false
  }

  return SAFE_LINK_PREFIXES.some((prefix) => normalized.startsWith(prefix))
}

function highlightCode(code, language) {
  const normalizedLanguage = String(language ?? '').trim().toLowerCase()

  if (normalizedLanguage && hljs.getLanguage(normalizedLanguage)) {
    const highlighted = hljs.highlight(code, {
      language: normalizedLanguage,
      ignoreIllegals: true
    }).value

    return `
      <pre class="md-code-block"><code class="hljs language-${normalizedLanguage}">${highlighted}</code></pre>
    `
  }

  const highlighted = hljs.highlightAuto(code).value
  return `
    <pre class="md-code-block"><code class="hljs">${highlighted}</code></pre>
  `
}

const markdownRenderer = new MarkdownIt({
  html: false,
  breaks: true,
  linkify: true,
  typographer: true,
  highlight(code, language) {
    return highlightCode(code, language)
  }
})

markdownRenderer.validateLink = (url) => isSafeLink(url)

const defaultLinkOpenRenderer =
  markdownRenderer.renderer.rules.link_open ??
  ((tokens, index, options, env, self) => self.renderToken(tokens, index, options))

markdownRenderer.renderer.rules.link_open = (tokens, index, options, env, self) => {
  const token = tokens[index]
  const href = token.attrGet('href')

  if (href && isSafeLink(href)) {
    token.attrSet('target', '_blank')
    token.attrSet('rel', 'noopener noreferrer nofollow')
  }

  return defaultLinkOpenRenderer(tokens, index, options, env, self)
}

export function renderMarkdown(content = '') {
  return markdownRenderer.render(String(content ?? ''))
}
