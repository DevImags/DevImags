/* ==== AJUSTE DO HERO (ALTURA DINÂMICA) ==== */
function ajustarHero() {
  const header = document.querySelector('header');
  const container = document.querySelector('.hero-container');
  if (!header || !container) return;

  const alturaHeader = header.offsetHeight;
  const altura = `calc(100vh - ${alturaHeader}px)`;

  if (window.matchMedia('(min-width: 1025px)').matches) {
    container.style.height = altura;
    container.style.maxHeight = altura;
  } else {
    container.style.height = 'auto';
    container.style.maxHeight = 'none';
  }

  document.querySelectorAll('section').forEach(sec => {
    sec.style.scrollMarginTop = `${alturaHeader}px`;
  });
}

/* ==== SCROLL SPY ==== */
function initScrollSpy() {
  const sections = document.querySelectorAll('main > section[id]');
  const navLinks = document.querySelectorAll('#nav-menu a');
  
  if (sections.length > 0) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          navLinks.forEach(link => {
            const linkHref = link.getAttribute('href');
            if (linkHref === `#${id}` || linkHref === `index.html#${id}`) {
              navLinks.forEach(l => l.classList.remove('ativo'));
              link.classList.add('ativo');
            }
          });
        }
      });
    }, { threshold: 0.6 });
    sections.forEach(section => observer.observe(section));
  }
}

// Execução
window.addEventListener('resize', ajustarHero);
ajustarHero();
initScrollSpy();