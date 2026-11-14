// Revelações acompanham listas dinâmicas sem reter elementos removidos pelo filtro.
export function observeReveals(root: HTMLElement = document.body): () => void {
  const waiting = new Set<Element>();
  const io = typeof IntersectionObserver === 'function' ? new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('in');
      io?.unobserve(entry.target);
      waiting.delete(entry.target);
    }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }) : null;

  const update = () => {
    for (const target of waiting) {
      if (target.isConnected) continue;
      io?.unobserve(target);
      waiting.delete(target);
    }
    root.querySelectorAll('.io-reveal:not(.in)').forEach(target => {
      if (!io) target.classList.add('in');
      else if (!waiting.has(target)) {
        waiting.add(target);
        io.observe(target);
      }
    });
  };
  const mutations = new MutationObserver(update);
  mutations.observe(root, { childList: true, subtree: true });
  update();
  return () => {
    io?.disconnect();
    mutations.disconnect();
    waiting.clear();
  };
}
