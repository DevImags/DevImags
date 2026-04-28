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

/* ==== LÓGICA DE DESTAQUE DO MENU ==== */
document.addEventListener('DOMContentLoaded', () => {
  const navLinks = document.querySelectorAll('#nav-menu a');

  function marcarLinkAtivo() {
    // Pega o caminho da URL atual (ex: /servicos/ ou /index.html)
    const currentPath = window.location.pathname;

    navLinks.forEach(link => {
      link.classList.remove('ativo');
      
      // Converte o href do link em um caminho absoluto para comparação precisa
      const linkPath = new URL(link.href).pathname;

      // Se o caminho da URL for igual ao do link
      // Ou se estivermos na raiz e o link for a index
      if (currentPath === linkPath || (currentPath === "/" && linkPath.endsWith("index.html"))) {
        link.classList.add('ativo');
      }
    });

    // Fallback: Se nenhum link foi marcado (ex: em subpastas sem o 'index.html' na URL)
    const algumAtivo = document.querySelector('#nav-menu a.ativo');
    if (!algumAtivo) {
      navLinks.forEach(link => {
        const href = link.getAttribute('href').replace('../', '');
        if (currentPath.includes(href) && href !== "index.html" && href !== "/") {
          link.classList.add('ativo');
        }
      });
    }
  }

  // Executa ao carregar
  marcarLinkAtivo();

  // Gerencia cliques em âncoras (#) e fecha menu mobile
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');

      if (href.startsWith('#')) {
        const targetId = href.replace('#', '');
        const targetSection = document.getElementById(targetId);

        if (targetSection) {
          navLinks.forEach(l => l.classList.remove('ativo'));
          link.classList.add('ativo');
          fecharMenu();
        } else {
          // Se a âncora não existe na página atual, vai para a home
          e.preventDefault();
          window.location.href = (window.location.pathname.includes('/html/') ? '../index.html' : 'index.html') + href;
        }
      } else {
        fecharMenu();
      }
    });
  });
});

/* ==== FUNÇÃO DE ERRO ==== */
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