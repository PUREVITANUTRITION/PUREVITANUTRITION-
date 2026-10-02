const SUPABASE_URL = "https://uhklwxoidufeozbjkjwz.supabase.co";
const SUPABASE_KEY = "sb_publishable_Q7oY5TVHmBkpX8YAQRN4nQ_8ITk3e5r";

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const login = document.getElementById("login");
const app = document.getElementById("app");

async function boot() {
  const { data } = await db.auth.getSession();

  if (!data.session) {
    login?.classList.remove("hidden");
    app?.classList.add("hidden");
    return;
  }

  login?.classList.add("hidden");
  app?.classList.remove("hidden");
  page("dashboard");
}

document.getElementById("loginBtn")?.addEventListener("click", async () => {
  const email = document.getElementById("email")?.value.trim();
  const password = document.getElementById("password")?.value;

  const { error } = await db.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    alert("Connexion impossible : " + error.message);
    return;
  }

  boot();
});

async function logout() {
  await db.auth.signOut();
  location.reload();
}

window.logout = logout;

window.page = async function(section) {
  const content = document.getElementById("content");
  if (!content) return;

  if (section === "dashboard") {
    const { data: produits = [] } =
      await db.from("produits").select("*");

    const { data: mouvements = [] } =
      await db.from("mouvements_stock").select("*");

    const entrees = mouvements.filter(x => x.type === "entree").length;
    const sorties = mouvements.filter(x => x.type === "sortie").length;
    const alertes = produits.filter(
      x => Number(x.stock) <= Number(x.stock_minimum)
    ).length;

    content.innerHTML = `
      <h1>Tableau de bord</h1>
      <p>VIVEZ EN PLEIN SANTÉ</p>

      <div class="cards">
        <div class="card"><span>Produits</span><strong>${produits.length}</strong></div>
        <div class="card"><span>Entrées</span><strong>${entrees}</strong></div>
        <div class="card"><span>Sorties</span><strong>${sorties}</strong></div>
        <div class="card"><span>Alertes</span><strong>${alertes}</strong></div>
      </div>

      <div class="panel">
        <h2>Bienvenue dans PURE VITA</h2>
        <p>Votre gestion commerciale est prête.</p>
      </div>
    `;
    return;
  }

  if (section === "products") {
    await afficherProduits();
    return;
  }

  if (section === "pos") {
    content.innerHTML = `
      <h1>Caisse / ventes</h1>
      <div class="panel">
        <h2>Nouvelle vente</h2>
        <p>La caisse sera disponible ici.</p>
      </div>
    `;
    return;
  }

  if (section === "clients") {
    content.innerHTML = `
      <h1>Clients</h1>
      <div class="panel">
        <p>Gestion des clients.</p>
      </div>
    `;
    return;
  }

  if (section === "suppliers") {
    content.innerHTML = `
      <h1>Fournisseurs & achats</h1>
      <div class="panel">
        <p>Gestion des fournisseurs et achats.</p>
      </div>
    `;
    return;
  }

  if (section === "finance") {
    content.innerHTML = `
      <h1>Finance 🔒</h1>
      <div class="panel">
        <p>Les informations financières sont protégées.</p>
      </div>
    `;
    return;
  }

  content.innerHTML = `
    <h1>${section}</h1>
    <div class="panel">
      <p>Module en préparation.</p>
    </div>
  `;
};

async function afficherProduits() {
  const content = document.getElementById("content");

  const { data: produits, error } =
    await db.from("produits").select("*").order("id", { ascending: false });

  if (error) {
    content.innerHTML = `
      <h1>Produits & stock</h1>
      <div class="panel">Erreur : ${error.message}</div>
    `;
    return;
  }

  content.innerHTML = `
    <div class="page-header">
      <div>
        <h1>Produits & stock</h1>
        <p>Gestion de votre stock PURE VITA</p>
      </div>
      <button class="btn-primary" onclick="ouvrirProduit()">+ Ajouter un produit</button>
    </div>

    <div class="panel">
      <input
        id="rechercheProduit"
        class="search"
        placeholder="🔎 Rechercher un produit..."
        oninput="filtrerProduits()"
      >

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Produit</th>
              <th>Référence</th>
              <th>Stock</th>
              <th>Min.</th>
              <th>Prix vente</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="listeProduits">
            ${produits.length ? produits.map(p => `
              <tr>
                <td>${p.nom}</td>
                <td>${p.reference || "-"}</td>
                <td>${p.stock}</td>
                <td>${p.stock_minimum}</td>
                <td>${Number(p.prix_vente).toFixed(2)} DH</td>
                <td>
                  <button onclick="modifierProduit(${p.id})">✏️</button>
                  <button onclick="supprimerProduit(${p.id})">🗑️</button>
                </td>
              </tr>
            `).join("") : `
              <tr>
                <td colspan="6">Aucun produit</td>
              </tr>
            `}
          </tbody>
        </table>
      </div>
    </div>
  `;

  window.produitsCache = produits;
}

window.ouvrirProduit = function() {
  const content = document.getElementById("content");

  content.insertAdjacentHTML("beforeend", `
    <div class="modal" id="modalProduit">
      <div class="modal-box">
        <h2>Ajouter un produit</h2>

        <input id="p_nom" placeholder="Nom du produit">
        <input id="p_reference" placeholder="Référence / SKU">
        <input id="p_categorie" placeholder="Catégorie">
        <input id="p_stock" type="number" placeholder="Stock">
        <input id="p_min" type="number" placeholder="Stock minimum">
        <input id="p_achat" type="number" step="0.01" placeholder="Prix achat">
        <input id="p_vente" type="number" step="0.01" placeholder="Prix vente">

        <div class="modal-actions">
          <button onclick="fermerProduit()">Annuler</button>
          <button class="btn-primary" onclick="enregistrerProduit()">Enregistrer</button>
        </div>
      </div>
    </div>
  `);
};

window.fermerProduit = function() {
  document.getElementById("modalProduit")?.remove();
};

window.enregistrerProduit = async function() {
  const produit = {
    nom: document.getElementById("p_nom").value.trim(),
    reference: document.getElementById("p_reference").value.trim(),
    categorie: document.getElementById("p_categorie").value.trim(),
    stock: Number(document.getElementById("p_stock").value || 0),
    stock_minimum: Number(document.getElementById("p_min").value || 0),
    prix_achat: Number(document.getElementById("p_achat").value || 0),
    prix_vente: Number(document.getElementById("p_vente").value || 0)
  };

  if (!produit.nom) {
    alert("Le nom du produit est obligatoire.");
    return;
  }

  const { error } = await db.from("produits").insert(produit);

  if (error) {
    alert("Erreur : " + error.message);
    return;
  }

  fermerProduit();
  afficherProduits();
};

window.supprimerProduit = async function(id) {
  if (!confirm("Supprimer ce produit ?")) return;

  const { error } = await db
    .from("produits")
    .delete()
    .eq("id", id);

  if (error) {
    alert("Erreur : " + error.message);
    return;
  }

  afficherProduits();
};

window.modifierProduit = function(id) {
  const produit = window.produitsCache?.find(p => p.id === id);

  if (!produit) return;

  ouvrirProduit();

  setTimeout(() => {
    document.getElementById("p_nom").value = produit.nom || "";
    document.getElementById("p_reference").value = produit.reference || "";
    document.getElementById("p_categorie").value = produit.categorie || "";
    document.getElementById("p_stock").value = produit.stock || 0;
    document.getElementById("p_min").value = produit.stock_minimum || 0;
    document.getElementById("p_achat").value = produit.prix_achat || 0;
    document.getElementById("p_vente").value = produit.prix_vente || 0;
  }, 50);
};

window.filtrerProduits = function() {
  const recherche =
    document.getElementById("rechercheProduit")?.value.toLowerCase() || "";

  document.querySelectorAll("#listeProduits tr").forEach(row => {
    row.style.display =
      row.textContent.toLowerCase().includes(recherche)
        ? ""
        : "none";
  });
};

db.auth.onAuthStateChange(() => {
  boot();
});

boot();
document.querySelectorAll("#nav button[data-p]").forEach(button => {
  button.addEventListener("click", () => {
    page(button.dataset.p);
  });
});

document.getElementById("logout")?.addEventListener("click", logout);
