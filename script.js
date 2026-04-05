function toggleMenu() {
    const nav = document.getElementById('nav-menu');
    const btn = document.querySelector('.hamburger');
    nav.classList.toggle('aberto');
    btn.classList.toggle('ativo');
}

function ajustarHero() {
  const header = document.querySelector('header');
  const container = document.querySelector('.hero-container');
  const alturaHeader = header.offsetHeight;  /* remove o hr */
  const altura = `calc(100dvh - ${alturaHeader}px)`;

  if (window.innerWidth > 1024) {
    container.style.height = altura;
    container.style.maxHeight = altura;
  } else {
    container.style.height = 'auto';
    container.style.maxHeight = 'none';
  }
}

ajustarHero();
window.addEventListener('resize', ajustarHero);