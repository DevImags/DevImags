function toggleMenu() {
  const nav = document.getElementById('nav-menu');
  const btn = document.querySelector('.hamburger');
  nav.classList.toggle('aberto');
  btn.classList.toggle('ativo');
}

function fecharMenu() {
  const nav = document.getElementById('nav-menu');
  const btn = document.querySelector('.hamburger');
  nav.classList.remove('aberto');
  btn.classList.remove('ativo');
}

document.querySelectorAll('#nav-menu a').forEach(link => {
  link.addEventListener('click', fecharMenu);
});

function ajustarHero() {
  const header = document.querySelector('header');
  const container = document.querySelector('.hero-container');
  const alturaHeader = header.offsetHeight;
  const altura = `calc(100vh - ${alturaHeader}px)`;

  if (window.innerWidth > 1024) {
    container.style.height = altura;
    container.style.maxHeight = altura;
  } else {
    container.style.height = 'auto';
    container.style.maxHeight = 'none';
  }

  // Atualiza scroll-margin-top dinamicamente
  document.querySelectorAll('section').forEach(sec => {
    sec.style.scrollMarginTop = `${alturaHeader}px`;
  });
}

ajustarHero();
window.addEventListener('resize', ajustarHero);

/* ==== SCROLL SPY ==== */
const sections = document.querySelectorAll('section');
const navLinks = document.querySelectorAll('#nav-menu a');

const observer = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Remove classe ativa de todos os links
        navLinks.forEach(link => link.classList.remove('ativo'));

        // Adiciona classe ativa ao link correspondente
        const id = entry.target.getAttribute('id');
        const activeLink = document.querySelector(`#nav-menu a[href="#${id}"]`);
        if (activeLink) activeLink.classList.add('ativo');

        // Atualiza o hash da URL sem recarregar a página
        history.replaceState(null, null, `#${id}`);
      }
    });
  },
  {
    root: null,
    threshold: 0.6
  }
);

// Observa cada seção
sections.forEach(section => observer.observe(section));
