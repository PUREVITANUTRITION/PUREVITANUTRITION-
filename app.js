<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>PUREVITANUTRITION</title>
  <link rel="stylesheet" href="styles.css">
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
</head>
<body>
  <!-- CONNEXION -->
  <div id="loginScreen">
    <div class="login-box">
      <img src="logo-pure-vita.png" class="login-logo" alt="PURE VITA">
      <h1>PUREVITANUTRITION</h1>
      <p class="subtitle">Gestion commerciale</p>
      <form id="loginForm">
        <label for="email">Email</label>
        <input
          id="email"
          type="email"
          autocomplete="username"
          placeholder="Votre adresse email"
          required
        >
        <label for="password">Mot de passe</label>
        <input
          id="password"
          type="password"
          autocomplete="current-password"
          placeholder="Votre mot de passe"
          required
        >
        <button type="submit" id="loginBtn">
          Se connecter
        </button>
      </form>
      <div id="loginMessage" class="message"></div>
    </div>
  </div>
  <!-- APPLICATION -->
  <div id="appScreen" class="hidden">
    <aside id="sidebar">
      <div class="brand">
        <img src="logo-pure-vita.png" alt="PURE VITA">
        <div>
          <strong>PURE VITA</strong>
          <small>Gestion commerciale</small>
        </div>
      </div>
      <nav id="mainNav">
        <button data-page="dashboard">
          📊 Tableau de bord
        </button>
        <button data-page="products">
          📦 Produits & stock
        </button>
        <button data-page="sales">
          🛒 Caisse / ventes
        </button>
        <button data-page="clients">
          👥 Clients
        </button>
        <button data-page="suppliers">
          🚚 Fournisseurs
        </button>
        <button data-page="reports">
          📈 Rapports 🔒
        </button>
        <button data-page="settings">
          ⚙️ Paramètres
        </button>
      </nav>
      <button id="logoutBtn" class="logout">
        🚪 Se déconnecter
      </button>
    </aside>
    <main id="main">
      <header class="topbar">
        <div>
          <h2 id="pageTitle">Tableau de bord</h2>
          <small>VIVEZ EN PLEIN SANTÉ</small>
        </div>
        <div id="currentUser"></div>
      </header>
      <section id="pageContent"></section>
    </main>
  </div>
  <script src="app.js"></script>
</body>
</html>
