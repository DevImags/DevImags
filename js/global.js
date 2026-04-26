/* ==== MENU HAMBURGUER ==== */
function toggleMenu() {
  const nav = document.getElementById('nav-menu');
  const btn = document.querySelector('.hamburger');
  if (!nav || !btn) return;
  nav.classList.toggle('aberto');
  btn.classList.toggle('ativo');
}

function fecharMenu() {
  const nav = document.getElementById('nav-menu');
  const btn = document.querySelector('.hamburger');
  if (!nav || !btn) return;
  nav.classList.remove('aberto');
  btn.classList.remove('ativo');
}

/* ==== LÓGICA DE NAVEGAÇÃO E LINKS ==== */
const navLinks = document.querySelectorAll('#nav-menu a');

function marcarLinkAtivo() {
  const path = window.location.pathname.split("/").pop();
  navLinks.forEach(link => {
    link.classList.remove('ativo');
    const href = link.getAttribute('href');
    if (path === href || (href === "index.html" && (path === "" || path === "index.html"))) {
      link.classList.add('ativo');
    }
  });
}

navLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    const href = link.getAttribute('href');
    if (href.startsWith('http') || href.includes('.html')) {
      fecharMenu();
      return; 
    }
    if (href.startsWith('#')) {
      const targetId = href.replace('#', '');
      const targetSection = document.getElementById(targetId);
      if (targetSection) {
        fecharMenu();
      } else {
        e.preventDefault();
        window.location.href = "index.html" + href;
      }
    }
  });
});

// Inicializa
marcarLinkAtivo();

/* ==== UTILITÁRIOS (ERRO) ==== */
function mostraErro(mensagem) {
  const erroAntigo = document.querySelector('.erro-container');
  if (erroAntigo) erroAntigo.remove();
  const erroContainer = document.createElement('div');
  erroContainer.className = 'erro-container';
  erroContainer.innerHTML = `
    <div class="erro-box">
      <h2>Ops!</h2>
      <p>${mensagem}</p>
      <button onclick="this.parentElement.parentElement.remove()">Fechar</button>
    </div>
  `;
  document.body.appendChild(erroContainer);
}