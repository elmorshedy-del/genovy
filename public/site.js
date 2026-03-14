const REVEAL_SELECTOR = '.reveal';
const HEALTH_ENDPOINT = '/health';

function revealSections() {
  const revealNodes = document.querySelectorAll(REVEAL_SELECTOR);
  if (!revealNodes.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const delay = entry.target.dataset.delay || '0';
        entry.target.style.setProperty('--delay', delay);
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.18 }
  );

  revealNodes.forEach((node) => observer.observe(node));
}

async function hydrateHealth() {
  const dot = document.getElementById('health-dot');
  const label = document.getElementById('health-label');
  if (!dot || !label) return;

  try {
    const response = await fetch(HEALTH_ENDPOINT, { headers: { accept: 'application/json' } });
    if (!response.ok) throw new Error(`Health check failed: ${response.status}`);
    const payload = await response.json();
    dot.classList.add('is-live');
    label.textContent = payload.status === 'ok' ? 'Knowledge service live' : 'Service status unknown';
  } catch (_error) {
    dot.classList.add('is-warn');
    label.textContent = 'Public site live, backend setup pending';
  }
}

revealSections();
hydrateHealth();
