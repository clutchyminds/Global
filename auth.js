<!-- auth.js (à inclure avec type="module") -->
<script type="module">
  // Imports Firebase v9 en mode module via CDN
  import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
  import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

  // Config fournie par Firebase
  const firebaseConfig = {
    apiKey: "AIzaSyD4yHErJhszCsEBV0KirXaFvli0HGXksrQ",
    authDomain: "authentificat-3b84c.firebaseapp.com",
    projectId: "authentificat-3b84c",
    storageBucket: "authentificat-3b84c.firebasestorage.app",
    messagingSenderId: "481339691180",
    appId: "1:481339691180:web:9bbbc0971adaefccc58f09",
    measurementId: "G-EGKJPZ8MYZ"
  };

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);

  // Attends que le header soit injecté avant de manipuler ses éléments
  function onHeaderReady(cb) {
    const tryRun = () => {
      const name = document.getElementById('user-name');
      const login = document.getElementById('login-link');
      const logout = document.getElementById('logout-link');
      if (name && login && logout) cb({ name, login, logout });
      else setTimeout(tryRun, 50);
    };
    tryRun();
  }

  onHeaderReady(({ name, login, logout }) => {
    // Met à jour l’affichage selon l’état Firebase Auth
    onAuthStateChanged(auth, (user) => {
      if (user) {
        const pseudo = user.displayName?.trim() || user.email || 'Utilisateur';
        name.textContent = pseudo;
        login.classList.add('hidden');
        logout.classList.remove('hidden');
      } else {
        name.textContent = 'Invité';
        login.classList.remove('hidden');
        logout.classList.add('hidden');
      }
    });

    // Déconnexion
    logout.addEventListener('click', async () => {
      try {
        await signOut(auth);
        // Option: revenir à l’accueil ou rester sur place
        // window.location.href = '/index.html';
      } catch (e) {
        console.error('Déconnexion échouée:', e);
      }
    });
  });
</script>
