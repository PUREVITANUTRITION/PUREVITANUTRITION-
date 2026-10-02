const SUPABASE_URL = "https://uhklwxoidufeozbjkjwz.supabase.co";
const SUPABASE_KEY = "sb_publishable_Q7oY5TVHmBkpX8YAQRN4nQ_8ITk3e5r";

const db = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

let currentUser = null;
let currentPage = "dashboard";


// ==============================
// DÉMARRAGE
// ==============================

async function init() {
  try {
    const { data, error } = await db.auth.getSession();

    if (error) {
      showLogin();
      return;
    }

    if (data.session) {
      currentUser = data.session.user;
      showApp();
      loadPage("dashboard");
    } else {
      showLogin();
    }

  } catch (error) {
    console.error(error);
    showLogin();
  }
}


// ==============================
// CONNEXION
// ==============================

function showLogin() {
  document.getElementById("loginScreen")?.classList.remove("hidden");
  document.getElementById("appScreen")?.classList.add("hidden");
}

function showApp() {
  document.getElementById("loginScreen")?.classList.add("hidden");
  document.getElementById("appScreen")?.classList.remove("hidden");

  const userElement = document.getElementById("currentUser");

  if (userElement && currentUser) {
    userElement.textContent = currentUser.email || "";
  }
}

document.getElementById("loginForm")?.addEventListener("submit", async function(e) {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const button = document.getElementById("loginBtn");
  const message = document.getElementById("loginMessage");

  if (!email || !password) {
    message.textContent = "Veuillez remplir les deux champs.";
    message.className = "message error";
    return;
  }

  button.disabled = true;
  button.textContent = "Connexion...";

  message.textContent = "";
  message.className = "message";

  try {
    const { data, error } = await db.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (error) {
      console.error("Erreur connexion :", error);

      message.textContent =
        "Connexion impossible : " + error.message;

      message.className = "message error";

      button.disabled = false;
      button.textContent = "Se connecter";

      return;
    }

    currentUser = data.user;

    showApp();
    loadPage("dashboard");

  } catch (error) {
    console.error(error);

    message.textContent =
      "Une erreur est survenue. Vérifiez votre connexion.";

    message.className = "message error";

    button.disabled = false;
    button.textContent = "Se connecter";
  }
});


// ==============================
// DÉCONNEXION
// ==============================

document.getElementById("logoutBtn")?.addEventListener("click", async function() {
  await db.auth.signOut();

  currentUser = null;

  showLogin();
});


// ==============================
// NAVIGATION
// ==============================

document.querySelectorAll("#mainNav button[data-page]")
  .forEach(button => {
    button.addEventListener("click", function() {
      loadPage(this.dataset.page);
    });
  });


async function loadPage(page) {

  currentPage = page;

  const content = document.getElementById("pageContent");
  const title = document.getElementById("pageTitle");

  if (!content) return;

  const titles = {
    dashboard: "Tableau de bord",
    products: "Produits & stock",
    sales: "Caisse / ventes",
    clients: "Clients",
    suppliers: "Fournisseurs",
    reports: "Rapports",
    settings: "Paramètres"
  };

  title.textContent = titles[page] || "PURE VITA";

  content.innerHTML =
    `<div class="loading">Chargement...</div>`;

  if (page === "dashboard") await pageDashboard();
  if (page === "products") await pageProducts();
  if (page === "sales") await pageSales();
  if (page === "clients") await pageClients();
  if (page === "suppliers") await pageSuppliers();
  if (page === "reports") await pageReports();
  if (page === "settings") pageSettings();
}


// ==============================
// TABLEAU DE BORD
// ==============================

async function pageDashboard() {

  const content = document.getElementById("pageContent");

  let products = [];
  let clients = [];
  let suppliers = [];
  let sales = [];

  try {

    const productsResult = await db
      .from("produits")
      .select("*")
      .order("nom");

    const clientsResult = await db
      .from("clients")
      .select("*")
      .order("nom");

    const suppliersResult = await db
      .from("fournisseurs")
      .select("*")
      .order("nom");

    const salesResult = await db
      .from("ventes")
      .select("*")
      .order("created_at", { ascending: false });

    products = productsResult.data || [];
    clients = clientsResult.data || [];
    suppliers = suppliersResult.data || [];
    sales = salesResult.data || [];

  } catch (error) {
    console.error(error);
  }

  const stockTotal = products.reduce(
    (total, p) => total + Number(p.stock || 0),
    0
  );

  const alertes = products.filter(
    p => Number(p.stock || 0) <= Number(p.stock_minimum || 0)
  );

  const chiffre = sales.reduce(
    (total, s) => total + Number(s.chiffre_affaires || 0),
    0
  );

  content.innerHTML = `

    <div class="cards">

      <div class="card">
        <span>📦 Produits</span>
        <strong>${products.length}</strong>
      </div>

      <div class="card">
        <span>📊 Stock disponible</span>
        <strong>${stockTotal}</strong>
      </div>

      <div class="card">
        <span>👥 Clients</span>
        <strong>${clients.length}</strong>
      </div>

      <div class="card">
        <span>🚚 Fournisseurs</span>
        <strong>${suppliers.length}</strong>
      </div>

    </div>

    <div class="dashboard-box">

      <h3>Alertes stock</h3>

      ${
        alertes.length === 0
          ? "<p>Aucune alerte de stock.</p>"
          : alertes.map(p => `
              <div class="alert-row">
                ⚠️ <strong>${escapeHtml(p.nom)}</strong>
                — Stock : ${p.stock}
              </div>
            `).join("")
      }

    </div>

    <div class="dashboard-box">

      <h3>Activité</h3>

      <p>
        Nombre de ventes enregistrées :
        <strong>${sales.length}</strong>
      </p>

      <p>
        Chiffre d'affaires :
        <strong>${formatMoney(chiffre)}</strong>
      </p>

    </div>

  `;
}


// ==============================
// PRODUITS
// ==============================

async function pageProducts() {

  const content = document.getElementById("pageContent");

  const { data, error } = await db
    .from("produits")
    .select("*")
    .order("nom");

  if (error) {
    content.innerHTML = errorBox(error.message);
    return;
  }

  const products = data || [];

  content.innerHTML = `

    <div class="page-actions">

      <button id="addProductBtn">
        ➕ Ajouter un produit
      </button>

      <input
        id="productSearch"
        placeholder="Rechercher un produit..."
      >

    </div>

    <div id="productFormContainer"></div>

    <div class="table-box">

      <table>

        <thead>
          <tr>
            <th>Produit</th>
            <th>Référence</th>
            <th>Catégorie</th>
            <th>Stock</th>
            <th>Prix vente</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody id="productsTable">

          ${products.map(productRow).join("")}

        </tbody>

      </table>

    </div>
  `;

  document.getElementById("addProductBtn")
    ?.addEventListener("click", () => showProductForm());

  document.getElementById("productSearch")
    ?.addEventListener("input", function() {

      const search = this.value.toLowerCase();

      document.querySelectorAll("#productsTable tr")
        .forEach(row => {
          row.style.display =
            row.textContent.toLowerCase().includes(search)
              ? ""
              : "none";
        });

    });
}


function productRow(p) {

  return `

    <tr>

      <td>${escapeHtml(p.nom)}</td>

      <td>${escapeHtml(p.reference || "")}</td>

      <td>${escapeHtml(p.categorie || "")}</td>

      <td>
        ${
          p.stock <= p.stock_minimum
            ? `<span class="stock-alert">${p.stock}</span>`
            : p.stock
        }
      </td>

      <td>${formatMoney(p.prix_vente)}</td>

      <td>

        <button
          class="small"
          onclick="editProduct(${p.id})">
          Modifier
        </button>

        <button
          class="small danger"
          onclick="deleteProduct(${p.id})">
          Supprimer
        </button>

      </td>

    </tr>

  `;
}


function showProductForm(product = null) {

  const container =
    document.getElementById("productFormContainer");

  container.innerHTML = `

    <div class="form-box">

      <h3>
        ${product ? "Modifier le produit" : "Nouveau produit"}
      </h3>

      <form id="productForm">

        <input
          id="productName"
          placeholder="Nom du produit"
          value="${escapeAttr(product?.nom || "")}"
          required
        >

        <input
          id="productReference"
          placeholder="Référence / SKU"
          value="${escapeAttr(product?.reference || "")}"
        >

        <input
          id="productCategory"
          placeholder="Catégorie"
          value="${escapeAttr(product?.categorie || "")}"
        >

        <input
          id="productStock"
          type="number"
          min="0"
          placeholder="Stock"
          value="${product?.stock ?? 0}"
        >

        <input
          id="productMinimum"
          type="number"
          min="0"
          placeholder="Stock minimum"
          value="${product?.stock_minimum ?? 5}"
        >

        <input
          id="productPurchase"
          type="number"
          min="0"
          step="0.01"
          placeholder="Prix achat"
          value="${product?.prix_achat ?? 0}"
        >

        <input
          id="productSale"
          type="number"
          min="0"
          step="0.01"
          placeholder="Prix vente"
          value="${product?.prix_vente ?? 0}"
        >

        <input
          id="productExpiration"
          type="date"
          value="${product?.date_expiration || ""}"
        >

        <div class="form-buttons">

          <button type="submit">
            Enregistrer
          </button>

          <button
            type="button"
            class="secondary"
            id="cancelProduct">
            Annuler
          </button>

        </div>

      </form>

    </div>
  `;

  document.getElementById("cancelProduct")
    ?.addEventListener("click", () => {
      container.innerHTML = "";
    });

  document.getElementById("productForm")
    ?.addEventListener("submit", async function(e) {

      e.preventDefault();

      const values = {

        nom:
          document.getElementById("productName").value.trim(),

        reference:
          document.getElementById("productReference").value.trim(),

        categorie:
          document.getElementById("productCategory").value.trim(),

        stock:
          Number(document.getElementById("productStock").value || 0),

        stock_minimum:
          Number(document.getElementById("productMinimum").value || 0),

        prix_achat:
          Number(document.getElementById("productPurchase").value || 0),

        prix_vente:
          Number(document.getElementById("productSale").value || 0),

        date_expiration:
          document.getElementById("productExpiration").value || null
      };

      let result;

      if (product) {

        result = await db
          .from("produits")
          .update(values)
          .eq("id", product.id);

      } else {

        result = await db
          .from("produits")
          .insert({
            ...values,
            user_id: currentUser.id
          });

      }

      if (result.error) {
        alert("Erreur : " + result.error.message);
        return;
      }

      await pageProducts();

    });
}


window.editProduct = async function(id) {

  const { data, error } = await db
    .from("produits")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    alert(error.message);
    return;
  }

  showProductForm(data);
};


window.deleteProduct = async function(id) {

  if (!confirm("Voulez-vous vraiment supprimer ce produit ?")) {
    return;
  }

  const { error } = await db
    .from("produits")
    .delete()
    .eq("id", id);

  if (error) {
    alert("Suppression impossible : " + error.message);
    return;
  }

  await pageProducts();
};


// ==============================
// CLIENTS
// ==============================

async function pageClients() {

  const content = document.getElementById("pageContent");

  const { data, error } = await db
    .from("clients")
    .select("*")
    .order("nom");

  if (error) {
    content.innerHTML = errorBox(error.message);
    return;
  }

  const clients = data || [];

  content.innerHTML = `

    <div class="page-actions">

      <button id="addClientBtn">
        ➕ Ajouter un client
      </button>

      <input
        id="clientSearch"
        placeholder="Rechercher un client..."
      >

    </div>

    <div id="clientFormContainer"></div>

    <div class="table-box">

      <table>

        <thead>

          <tr>
            <th>Nom</th>
            <th>Téléphone</th>
            <th>Email</th>
            <th>Crédit</th>
            <th>Actions</th>
          </tr>

        </thead>

        <tbody id="clientsTable">

          ${clients.map(clientRow).join("")}

        </tbody>

      </table>

    </div>
  `;

  document.getElementById("addClientBtn")
    ?.addEventListener("click", () => showClientForm());

  document.getElementById("clientSearch")
    ?.addEventListener("input", function() {

      const search = this.value.toLowerCase();

      document.querySelectorAll("#clientsTable tr")
        .forEach(row => {

          row.style.display =
            row.textContent.toLowerCase().includes(search)
              ? ""
              : "none";

        });

    });
}


function clientRow(c) {

  return `

    <tr>

      <td>${escapeHtml(c.nom)}</td>

      <td>${escapeHtml(c.telephone || "")}</td>

      <td>${escapeHtml(c.email || "")}</td>

      <td>${formatMoney(c.solde_credit || 0)}</td>

      <td>

        <button
          class="small"
          onclick="editClient(${c.id})">
          Modifier
        </button>

        <button
          class="small danger"
          onclick="deleteClient(${c.id})">
          Supprimer
        </button>

      </td>

    </tr>

  `;
}


function showClientForm(client = null) {

  const container =
    document.getElementById("clientFormContainer");

  container.innerHTML = `

    <div class="form-box">

      <h3>
        ${client ? "Modifier le client" : "Nouveau client"}
      </h3>

      <form id="clientForm">

        <input
          id="clientName"
          placeholder="Nom du client"
          value="${escapeAttr(client?.nom || "")}"
          required
        >

        <input
          id="clientPhone"
          placeholder="Téléphone"
          value="${escapeAttr(client?.telephone || "")}"
        >

        <input
          id="clientEmail"
          type="email"
          placeholder="Email"
          value="${escapeAttr(client?.email || "")}"
        >

        <input
          id="clientAddress"
          placeholder="Adresse"
          value="${escapeAttr(client?.adresse || "")}"
        >

        <input
          id="clientCreditLimit"
          type="number"
          min="0"
          step="0.01"
          placeholder="Limite de crédit"
          value="${client?.limite_credit ?? 0}"
        >

        <div class="form-buttons">

          <button type="submit">
            Enregistrer
          </button>

          <button
            type="button"
            class="secondary"
            id="cancelClient">
            Annuler
          </button>

        </div>

      </form>

    </div>
  `;

  document.getElementById("cancelClient")
    ?.addEventListener("click", () => {
      container.innerHTML = "";
    });

  document.getElementById("clientForm")
    ?.addEventListener("submit", async function(e) {

      e.preventDefault();

      const values = {

        nom:
          document.getElementById("clientName").value.trim(),

        telephone:
          document.getElementById("clientPhone").value.trim(),

        email:
          document.getElementById("clientEmail").value.trim(),

        adresse:
          document.getElementById("clientAddress").value.trim(),

        limite_credit:
          Number(
            document.getElementById("clientCreditLimit").value || 0
          )
      };

      let result;

      if (client) {

        result = await db
          .from("clients")
          .update(values)
          .eq("id", client.id);

      } else {

        result = await db
          .from("clients")
          .insert({
            ...values,
            user_id: currentUser.id,
            solde_credit: 0
          });

      }

      if (result.error) {

        alert(
          "Impossible d'enregistrer le client : " +
          result.error.message
        );

        return;
      }

      await pageClients();

    });
}


window.editClient = async function(id) {

  const { data, error } = await db
    .from("clients")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    alert(error.message);
    return;
  }

  showClientForm(data);
};


window.deleteClient = async function(id) {

  if (!confirm("Voulez-vous vraiment supprimer ce client ?")) {
    return;
  }

  const { error } = await db
    .from("clients")
    .delete()
    .eq("id", id);

  if (error) {

    alert(
      "Suppression impossible : " +
      error.message
    );

    return;
  }

  await pageClients();
};


// ==============================
// CAISSE
// ==============================

async function pageSales() {

  const content = document.getElementById("pageContent");

  const { data: products, error } = await db
    .from("produits")
    .select("*")
    .gt("stock", 0)
    .order("nom");

  if (error) {
    content.innerHTML = errorBox(error.message);
    return;
  }

  content.innerHTML = `

    <div class="form-box">

      <h3>🛒 Nouvelle vente</h3>

      <select id="saleProduct">

        <option value="">
          Choisir un produit
        </option>

        ${(products || []).map(p => `
          <option value="${p.id}">
            ${escapeHtml(p.nom)}
            — ${formatMoney(p.prix_vente)}
            — Stock ${p.stock}
          </option>
        `).join("")}

      </select>

      <input
        id="saleQuantity"
        type="number"
        min="1"
        value="1"
        placeholder="Quantité"
      >

      <button id="saveSale">
        💾 Enregistrer la vente
      </button>

      <div id="saleMessage"></div>

    </div>
  `;

  document.getElementById("saveSale")
    ?.addEventListener("click", saveSale);
}


async function saveSale() {

  const productId =
    Number(document.getElementById("saleProduct").value);

  const quantity =
    Number(document.getElementById("saleQuantity").value);

  const message =
    document.getElementById("saleMessage");

  if (!productId || quantity <= 0) {

    message.textContent =
      "Sélectionnez un produit et une quantité.";

    return;
  }

  const { data: product, error } = await db
    .from("produits")
    .select("*")
    .eq("id", productId)
    .single();

  if (error) {
    message.textContent = error.message;
    return;
  }

  if (product.stock < quantity) {
    message.textContent = "Stock insuffisant.";
    return;
  }

  const sale = await db
    .from("ventes")
    .insert({
      user_id: currentUser.id,
      produit_id: product.id,
      quantite: quantity,
      prix_vente_unitaire: product.prix_vente,
      prix_achat_unitaire: product.prix_achat
    });

  if (sale.error) {

    message.textContent =
      "Erreur vente : " + sale.error.message;

    return;
  }

  const newStock =
    Number(product.stock) - quantity;

  const update = await db
    .from("produits")
    .update({
      stock: newStock
    })
    .eq("id", product.id);

  if (update.error) {

    message.textContent =
      "Vente enregistrée mais stock non mis à jour.";

    return;
  }

  await db
    .from("mouvements_stock")
    .insert({
      user_id: currentUser.id,
      produit_id: product.id,
      type: "sortie",
      quantite: quantity,
      prix_unitaire: product.prix_vente,
      note: "Vente"
    });

  message.textContent = "✅ Vente enregistrée.";

  document.getElementById("saleQuantity").value = 1;

  await pageSales();
}


// ==============================
// FOURNISSEURS
// ==============================

async function pageSuppliers() {

  const content = document.getElementById("pageContent");

  const { data, error } = await db
    .from("fournisseurs")
    .select("*")
    .order("nom");

  if (error) {
    content.innerHTML = errorBox(error.message);
    return;
  }

  const suppliers = data || [];

  content.innerHTML = `

    <div class="page-actions">

      <button id="addSupplierBtn">
        ➕ Ajouter un fournisseur
      </button>

    </div>

    <div id="supplierForm"></div>

    <div class="table-box">

      <table>

        <thead>

          <tr>
            <th>Nom</th>
            <th>Téléphone</th>
            <th>Email</th>
            <th>Adresse</th>
          </tr>

        </thead>

        <tbody>

          ${suppliers.map(s => `

            <tr>

              <td>${escapeHtml(s.nom)}</td>
              <td>${escapeHtml(s.telephone || "")}</td>
              <td>${escapeHtml(s.email || "")}</td>
              <td>${escapeHtml(s.adresse || "")}</td>

            </tr>

          `).join("")}

        </tbody>

      </table>

    </div>
  `;

  document.getElementById("addSupplierBtn")
    ?.addEventListener("click", showSupplierForm);
}


function showSupplierForm() {

  const container =
    document.getElementById("supplierForm");

  container.innerHTML = `

    <div class="form-box">

      <h3>Nouveau fournisseur</h3>

      <form id="supplierFormReal">

        <input
          id="supplierName"
          placeholder="Nom du fournisseur"
          required
        >

        <input
          id="supplierPhone"
          placeholder="Téléphone"
        >

        <input
          id="supplierEmail"
          type="email"
          placeholder="Email"
        >

        <input
          id="supplierAddress"
          placeholder="Adresse"
        >

        <button type="submit">
          Enregistrer
        </button>

      </form>

    </div>
  `;

  document.getElementById("supplierFormReal")
    ?.addEventListener("submit", async function(e) {

      e.preventDefault();

      const { error } = await db
        .from("fournisseurs")
        .insert({
          user_id: currentUser.id,
          nom: document.getElementById("supplierName").value.trim(),
          telephone: document.getElementById("supplierPhone").value.trim(),
          email: document.getElementById("supplierEmail").value.trim(),
          adresse: document.getElementById("supplierAddress").value.trim()
        });

      if (error) {
        alert(error.message);
        return;
      }

      await pageSuppliers();

    });
}


// ==============================
// RAPPORTS
// ==============================

async function pageReports() {

  const content = document.getElementById("pageContent");

  const { data, error } = await db
    .from("ventes")
    .select("*");

  if (error) {
    content.innerHTML = errorBox(error.message);
    return;
  }

  const sales = data || [];

  const ca = sales.reduce(
    (sum, s) => sum + Number(s.chiffre_affaires || 0),
    0
  );

  const profit = sales.reduce(
    (sum, s) => sum + Number(s.benefice || 0),
    0
  );

  content.innerHTML = `

    <div class="cards">

      <div class="card">
        <span>Chiffre d'affaires</span>
        <strong>${formatMoney(ca)}</strong>
      </div>

      <div class="card">
        <span>Bénéfice</span>
        <strong>${formatMoney(profit)}</strong>
      </div>

      <div class="card">
        <span>Ventes</span>
        <strong>${sales.length}</strong>
      </div>

    </div>

    <div class="dashboard-box">

      <h3>Rapports financiers</h3>

      <p>
        Les données financières sont accessibles uniquement
        dans cette section protégée.
      </p>

    </div>
  `;
}


// ==============================
// PARAMÈTRES
// ==============================

function pageSettings() {

  document.getElementById("pageContent").innerHTML = `

    <div class="dashboard-box">

      <h3>⚙️ Paramètres</h3>

      <p>
        Logiciel : <strong>PUREVITANUTRITION</strong>
      </p>

      <p>
        Boutique : <strong>PURE VITA</strong>
      </p>

      <p>
        Slogan : <strong>VIVEZ EN PLEIN SANTÉ</strong>
      </p>

      <p>
        Utilisateur connecté :
        <strong>${escapeHtml(currentUser?.email || "")}</strong>
      </p>

    </div>
  `;
}


// ==============================
// OUTILS
// ==============================

function formatMoney(value) {

  return Number(value || 0).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) + " MAD";
}


function escapeHtml(value) {

  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function escapeAttr(value) {
  return escapeHtml(value);
}


function errorBox(message) {

  return `
    <div class="error-box">
      ${escapeHtml(message)}
    </div>
  `;
}


// ==============================
// SESSION
// ==============================

db.auth.onAuthStateChange((event, session) => {

  if (session) {

    currentUser = session.user;
    showApp();

  } else {

    currentUser = null;
    showLogin();

  }

});


// ==============================
// LANCEMENT
// ==============================

init();
