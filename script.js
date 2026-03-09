// script.js
document.addEventListener("DOMContentLoaded", () => {
  // intercepta cliques nos links
  document.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", event => {
      event.preventDefault();
      const url = link.getAttribute("href");

      fetch(url)
        .then(response => {
          if (!response.ok) {
            // se não encontrar, redireciona para página de erro
            window.location.href = "404.html";
          } else {
            window.location.href = url;
          }
        })
        .catch(() => {
          window.location.href = "404.html";
        });
    });
  });
});
