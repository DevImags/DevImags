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

/* ==== SELECIONAR TODAS AS SEÇÕES E LINKS DO MENU ==== */
const sections = document.querySelectorAll('section');
const navLinks = document.querySelectorAll('#nav-menu a');

const observer = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        /* REMOVE CLASSE ATIVA DE TODOS OS LINKS */
        navLinks.forEach(link => link.classList.remove('ativo'));

        /* ADICIONA CLASS ATIVA AO LINK CORRESPONDENTE */
        const id = entry.target.getAttribute('id');
        const activeLink = document.querySelector(`#nav-menu a[href="#${id}"]`);
        if (activeLink) activeLink.classList.add('ativo');

        /* ATUALIZA O HASH DA URL SEM RECARREGAR A PÁGINA */
        history.replaceState(null, null, `#${id}`);
      }
    });
  },
  {
    root: null,
    threshold: 0.6
  }
);

/* OBSERVA CADA SEÇÃO */
sections.forEach(section => observer.observe(section));