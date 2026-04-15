/* ==== MENU HAMBURGUER ==== */

function toggleMenu() {
  const nav = document.getElementById('nav-menu');
  const btn = document.querySelector('.hamburger');
  nav.classList.toggle('aberto');
  btn.classList.toggle('ativo');

  /* ATUALIZA MANUALMENTE O LINK ATIVO AO ABRIR O MENU */
  if (nav.classList.contains('aberto')) {
    const id = location.hash.replace('#', '');
    if (id) {
      navLinks.forEach(link => link.classList.remove('ativo'));
      const activeLink = document.querySelector(`#nav-menu a[href="#${id}"]`);
      if (activeLink) activeLink.classList.add('ativo');
    }
  }
}

function fecharMenu() {
  const nav = document.getElementById('nav-menu');
  const btn = document.querySelector('.hamburger');
  nav.classList.remove('aberto');
  btn.classList.remove('ativo');
}

/* ==== AJUSTE DO HERO ==== */
function ajustarHero() {
  const header = document.querySelector('header');
  const container = document.querySelector('.hero-container');
  if (!header || !container) return;

  const alturaHeader = header.offsetHeight;
  const altura = `calc(100vh - ${alturaHeader}px)`;

  if (window.matchMedia('(min-width: 1025px)').matches) {
    /* COMPORTAMENTO DE DESKTOP */
    container.style.height = altura;
    container.style.maxHeight = altura;
  } else {
    /* COMPORTAMENTO DE MOBILE */
    container.style.height = 'auto';
    container.style.maxHeight = 'none';
  }

  /* ATUALIZA O SCROLL-MARGIN-TOP DINAMICAMENTE */
  document.querySelectorAll('section').forEach(sec => {
    sec.style.scrollMarginTop = `${alturaHeader}px`;
  });
}

// Inicializa e monitora redimensionamento
ajustarHero();
window.addEventListener('resize', ajustarHero);

/* ==== SCROLL SPY & LOGICA DE LINKS ==== */
const sections = document.querySelectorAll('section');
const navLinks = document.querySelectorAll('#nav-menu a');

// Observador para marcar link ativo durante o scroll
const observer = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(link => link.classList.remove('ativo'));
        const id = entry.target.getAttribute('id');
        const activeLink = document.querySelector(`#nav-menu a[href="#${id}"]`);
        if (activeLink) activeLink.classList.add('ativo');
        history.replaceState(null, null, `#${id}`);
      }
    });
  },
  { root: null, threshold: 0.6 }
);

sections.forEach(section => observer.observe(section));

// Controle de cliques nos links do menu
navLinks.forEach(link => {
  link.addEventListener('click', e => {
    const href = link.getAttribute('href');

    // 1. Verifica se é um link externo ou WhatsApp (não começa com #)
    if (!href.startsWith('#')) {
      fecharMenu();
      return; // Permite que o navegador siga o link normalmente
    }

    // 2. Trata links internos (âncoras)
    const targetId = href.replace('#', '');
    const targetSection = document.getElementById(targetId);

    if (!targetSection) {
      e.preventDefault(); // Impede o salto se a seção não existir
      fecharMenu();
      mostraErro(`A seção "${targetId}" não foi encontrada.`);
    } else {
      fecharMenu();
    }
  });
});

/* ==== FUNÇÃO DE ERRO PERSONALIZADA ==== */
function mostraErro(mensagem) {
  // Remove erro anterior se existir
  const erroAntigo = document.querySelector('.erro-container');
  if (erroAntigo) erroAntigo.remove();

  const erroContainer = document.createElement('div');
  erroContainer.className = 'erro-container';
  erroContainer.innerHTML = `
    <div class="erro-box">
      <h2>Ops!</h2>
      <p>${mensagem}</p>
      <p>Em breve teremos conteúdo aqui.</p>
      <button onclick="this.parentElement.parentElement.remove()">Fechar</button>
    </div>
  `;
  document.body.appendChild(erroContainer);
}