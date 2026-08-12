/**
 * Highlights search terms in a container element by wrapping matches in <mark> elements.
 * Supports both English and Chinese text via case-insensitive substring matching.
 */

export function highlightSearchTerm(container: HTMLElement, term: string): void {
  if (!container || !term || !term.trim()) return;

  const trimmedTerm = term.trim();

  // Remove existing highlights
  removeHighlights(container);

  // Escape special regex characters
  const escapedTerm = escapeRegExp(trimmedTerm);
  const regex = new RegExp(`(${escapedTerm})`, 'gi');

  // Use TreeWalker to find text nodes and highlight matches
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      // Skip nodes inside script, style, or mark elements
      let current: Node | null = node;
      while (current && current !== container) {
        if (
          current.nodeType === Node.ELEMENT_NODE &&
          ((current as HTMLElement).tagName === 'SCRIPT' ||
            (current as HTMLElement).tagName === 'STYLE' ||
            (current as HTMLElement).tagName === 'MARK')
        ) {
          return NodeFilter.FILTER_REJECT;
        }
        current = current.parentNode;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const textNodes: Text[] = [];
  let currentNode: Node | null = walker.nextNode();
  while (currentNode) {
    const textNode = currentNode as Text;
    if (regex.test(textNode.nodeValue || '')) {
      textNodes.push(textNode);
    }
    currentNode = walker.nextNode();
  }

  // Apply highlights to matching text nodes
  for (const textNode of textNodes) {
    const text = textNode.nodeValue || '';
    if (!regex.test(text)) continue;

    const fragment = document.createDocumentFragment();
    let lastIndex = 0;
    regex.lastIndex = 0;

    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        fragment.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
      }

      // Add the highlighted match
      const mark = document.createElement('mark');
      mark.className = 'search-highlight';
      mark.textContent = match[0];
      fragment.appendChild(mark);

      lastIndex = match.index + match[0].length;

      // Prevent infinite loops on zero-length matches
      if (match[0].length === 0) {
        regex.lastIndex++;
      }
    }

    // Add remaining text after last match
    if (lastIndex < text.length) {
      fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
    }

    // Replace the text node with the fragment
    const parent = textNode.parentNode;
    if (parent) {
      parent.replaceChild(fragment, textNode);
    }
  }

  // Scroll to first match after a brief delay to allow DOM updates
  setTimeout(() => {
    const firstMark = container.querySelector('mark.search-highlight');
    if (firstMark) {
      firstMark.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Add a pulse animation to the first match
      firstMark.classList.add('search-highlight-first');
    }
  }, 100);
}

export function removeHighlights(container: HTMLElement): void {
  if (!container) return;

  container.querySelectorAll('mark.search-highlight').forEach((mark) => {
    const parent = mark.parentNode;
    if (parent) {
      parent.replaceChild(document.createTextNode(mark.textContent || ''), mark);
      parent.normalize();
    }
  });
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
