<!-- load-header.js (à inclure avec type="module") -->
<script type="module">
  async function injectHeader() {
    try {
      const res = await fetch('/header.html'); // chemin absolu recommandé sur GitHub Pages
      if (!res.ok) throw new Error('Header introuvable');
      const html = await res.text();

      const container = document.createElement('div');
      container.innerHTML = html;

      // Insère le header comme premier enfant du body
      document.body.prepend(container);

      // Active le toggle du menu une fois injecté
      const userButton = document.getElementById('user-button');
      const dropdown = document.getElementById('dropdown');

      userButton?.addEventListener('click', () => {
        const expanded = userButton.getAttribute('aria-expanded') === 'true';
        userButton.setAttribute('aria-expanded', String(!expanded));
        dropdown.classList.toggle('hidden');
      });

      // Ferme le menu si on clique ailleurs
      document.addEventListener('click', (e) => {
        const within = userButton?.contains(e.target) || dropdown?.contains(e.target);
        if (!within) {
          userButton?.setAttribute('aria-expanded', 'false');
          dropdown?.classList.add('hidden');
        }
      });
    } catch (e) {
      console.error('Erreur injection header:', e);
    }
  }

  injectHeader();
</script>
