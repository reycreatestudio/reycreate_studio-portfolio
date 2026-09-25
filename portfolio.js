/* =========================================================
   REYCREATE STUDIO — PORTFOLIO
   Firebase Firestore + GitHub Pages Images
   ========================================================= */

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";

import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  orderBy
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";


/* =========================================================
   FIREBASE CONFIG
   ========================================================= */

const firebaseConfig = {
  apiKey: "AIzaSyBlbeyeynUXvrSE-TBVjwaEiBobHTrBlQo",
  authDomain: "reycreatestudio-portfoli-9b09b.firebaseapp.com",
  projectId: "reycreatestudio-portfoli-9b09b",
  storageBucket: "reycreatestudio-portfoli-9b09b.firebasestorage.app",
  messagingSenderId: "41750977632",
  appId: "1:41750977632:web:f202e8614f20e5d9ceb705"
};


/* =========================================================
   INITIALIZE FIREBASE
   ========================================================= */

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);


/* =========================================================
   GITHUB PAGES BASE
   ========================================================= */

const GITHUB_PAGES_BASE =
  "https://reycreatestudio.github.io/reycreate_studio-portfolio/";


/* =========================================================
   DOM ELEMENTS
   ========================================================= */

const portfolioGrid = document.getElementById("portfolio-grid");
const portfolioBreadcrumb = document.getElementById("portfolio-breadcrumb");
const portfolioBack = document.getElementById("portfolio-back");

const lightbox = document.getElementById("portfolio-lightbox");
const lightboxImage = document.getElementById("lightbox-image");
const lightboxTitle = document.getElementById("lightbox-title");
const lightboxDescription = document.getElementById("lightbox-description");


/* =========================================================
   DATA
   ========================================================= */

let categories = [];
let photos = [];

let categoryMap = new Map();
let childrenMap = new Map();

let currentCategoryId = null;
let currentPhotos = [];
let currentPhotoIndex = 0;

let isLightboxChanging = false;


/* =========================================================
   IMAGE URL HELPER
   ========================================================= */

function normalizeImageUrl(path) {

  if (!path) {
    return "";
  }

  path = String(path).trim();

  if (!path) {
    return "";
  }

  // Already a complete URL
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  // Remove leading slash
  path = path.replace(/^\/+/, "");

  // GitHub Pages URL
  return GITHUB_PAGES_BASE + path;
}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHTML(value) {

  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


/* =========================================================
   SORT HELPER
   ========================================================= */

function sortByOrder(a, b) {

  const orderA = Number(a.sortOrder ?? 0);
  const orderB = Number(b.sortOrder ?? 0);

  if (orderA !== orderB) {
    return orderA - orderB;
  }

  return String(a.name || a.title || "")
    .localeCompare(
      String(b.name || b.title || ""),
      undefined,
      { numeric: true, sensitivity: "base" }
    );
}


/* =========================================================
   LOAD PORTFOLIO
   ========================================================= */

async function loadPortfolio() {

  try {

    showLoading();

    /* -------------------------------------------------------
       LOAD CATEGORIES
       ------------------------------------------------------- */

    const categoryQuery = query(
      collection(db, "portfolio_categories"),
      where("visible", "==", true),
      orderBy("sortOrder", "asc")
    );

    const categorySnapshot = await getDocs(categoryQuery);

    categories = categorySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));


    /* -------------------------------------------------------
       LOAD PHOTOS
       ------------------------------------------------------- */

    const photoQuery = query(
      collection(db, "portfolio_photos"),
      where("visible", "==", true),
      orderBy("sortOrder", "asc")
    );

    const photoSnapshot = await getDocs(photoQuery);

    photos = photoSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));


    /* -------------------------------------------------------
       PREPARE MAPS
       ------------------------------------------------------- */

    buildCategoryMaps();


    /* -------------------------------------------------------
       SHOW ROOT CATEGORIES
       ------------------------------------------------------- */

    currentCategoryId = null;

    renderRootCategories();

  } catch (error) {

    console.error("Portfolio loading error:", error);

    showError(
      "Unable to load portfolio. Please refresh the page."
    );
  }
}


/* =========================================================
   BUILD CATEGORY MAPS
   ========================================================= */

function buildCategoryMaps() {

  categoryMap = new Map();
  childrenMap = new Map();

  categories.forEach(category => {

    categoryMap.set(category.id, category);

    const parentId =
      category.parentId ||
      null;

    if (!childrenMap.has(parentId)) {
      childrenMap.set(parentId, []);
    }

    childrenMap.get(parentId).push(category);

  });


  /* -------------------------------------------------------
     SORT CHILDREN
     ------------------------------------------------------- */

  childrenMap.forEach(list => {
    list.sort(sortByOrder);
  });
}


/* =========================================================
   GET CATEGORY CHILDREN
   ========================================================= */

function getChildren(categoryId) {

  return childrenMap.get(categoryId) || [];
}


/* =========================================================
   GET CATEGORY PHOTOS
   ========================================================= */

function getCategoryPhotos(categoryId) {

  return photos
    .filter(photo => photo.categoryId === categoryId)
    .sort(sortByOrder);
}


/* =========================================================
   GET CATEGORY COVER
   ========================================================= */

function getCategoryCover(categoryId) {

  const categoryPhotos = getCategoryPhotos(categoryId);

  if (!categoryPhotos.length) {
    return "";
  }

  // Prefer explicitly selected cover
  const cover = categoryPhotos.find(photo => photo.isCover === true);

  if (cover) {
    return getPhotoImageUrl(cover);
  }

  // Otherwise use first photo
  return getPhotoImageUrl(categoryPhotos[0]);
}


/* =========================================================
   GET PHOTO IMAGE URL
   ========================================================= */

function getPhotoImageUrl(photo) {

  /*
   Priority:

   1. githubPath
   2. imageUrl

   githubPath is preferred because your current
   system stores the actual image in GitHub.
  */

  if (photo.githubPath) {
    return normalizeImageUrl(photo.githubPath);
  }

  if (photo.imageUrl) {
    return normalizeImageUrl(photo.imageUrl);
  }

  return "";
}


/* =========================================================
   SHOW LOADING
   ========================================================= */

function showLoading() {

  if (!portfolioGrid) {
    return;
  }

  portfolioGrid.innerHTML = `
    <div class="portfolio-loading">
      <span></span>
      <span></span>
      <span></span>
    </div>
  `;
}


/* =========================================================
   SHOW ERROR
   ========================================================= */

function showError(message) {

  if (!portfolioGrid) {
    return;
  }

  portfolioGrid.innerHTML = `
    <div class="portfolio-empty">
      <p>${escapeHTML(message)}</p>
    </div>
  `;
}


/* =========================================================
   SHOW EMPTY
   ========================================================= */

function showEmpty(message = "No photos available.") {

  if (!portfolioGrid) {
    return;
  }

  portfolioGrid.innerHTML = `
    <div class="portfolio-empty">
      <p>${escapeHTML(message)}</p>
    </div>
  `;
}


/* =========================================================
   RENDER ROOT CATEGORIES
   ========================================================= */

function renderRootCategories() {

  currentCategoryId = null;

  updateBreadcrumb();
  updateBackButton();

  const rootCategories =
    getChildren(null);

  if (!rootCategories.length) {

    /*
     If there are no categories, check whether
     there are photos directly available.
    */

    if (photos.length) {
      renderPhotos(photos, "Portfolio");
    } else {
      showEmpty("No portfolio categories available.");
    }

    return;
  }


  portfolioGrid.classList.remove("portfolio-photo-view");

  portfolioGrid.classList.add("portfolio-category-view");


  portfolioGrid.innerHTML = rootCategories
    .map(category => createCategoryCard(category))
    .join("");

  attachCategoryEvents();

  animatePortfolioView();
}


/* =========================================================
   CREATE CATEGORY CARD
   ========================================================= */

function createCategoryCard(category) {

  const coverUrl =
    getCategoryCover(category.id);

  const childCategories =
    getChildren(category.id);

  const categoryPhotos =
    getCategoryPhotos(category.id);

  const totalChildren =
    childCategories.length;

  const totalPhotos =
    categoryPhotos.length;


  let countText = "";

  if (totalChildren > 0 && totalPhotos > 0) {

    countText =
      `${totalChildren} ${totalChildren === 1 ? "category" : "categories"} · ` +
      `${totalPhotos} ${totalPhotos === 1 ? "photo" : "photos"}`;

  } else if (totalChildren > 0) {

    countText =
      `${totalChildren} ${totalChildren === 1 ? "category" : "categories"}`;

  } else if (totalPhotos > 0) {

    countText =
      `${totalPhotos} ${totalPhotos === 1 ? "photo" : "photos"}`;

  }


  return `
    <article
      class="portfolio-category-card"
      data-category-id="${escapeHTML(category.id)}"
      tabindex="0"
      role="button"
      aria-label="Open ${escapeHTML(category.name || "category")}"
    >

      <div class="portfolio-category-image">

        ${
          coverUrl
            ? `
              <img
                src="${escapeHTML(coverUrl)}"
                alt="${escapeHTML(category.name || "Portfolio category")}"
                loading="lazy"
                decoding="async"
                onerror="this.closest('.portfolio-category-image').classList.add('image-error'); this.style.display='none';"
              >
            `
            : `
              <div class="portfolio-image-placeholder">
                <span>No Image</span>
              </div>
            `
        }

        <div class="portfolio-category-overlay"></div>

        <div class="portfolio-category-info">

          <h2>
            ${escapeHTML(category.name || "Untitled")}
          </h2>

          ${
            category.description
              ? `
                <p>
                  ${escapeHTML(category.description)}
                </p>
              `
              : ""
          }

          ${
            countText
              ? `
                <span class="portfolio-category-count">
                  ${escapeHTML(countText)}
                </span>
              `
              : ""
          }

        </div>

      </div>

    </article>
  `;
}


/* =========================================================
   ATTACH CATEGORY EVENTS
   ========================================================= */

function attachCategoryEvents() {

  const cards =
    portfolioGrid.querySelectorAll(
      ".portfolio-category-card"
    );

  cards.forEach(card => {

    const categoryId =
      card.dataset.categoryId;


    card.addEventListener("click", () => {

      openCategory(categoryId);

    });


    card.addEventListener("keydown", event => {

      if (
        event.key === "Enter" ||
        event.key === " "
      ) {

        event.preventDefault();

        openCategory(categoryId);
      }

    });

  });
}


/* =========================================================
   OPEN CATEGORY
   ========================================================= */

function openCategory(categoryId) {

  const category =
    categoryMap.get(categoryId);

  if (!category) {
    return;
  }

  currentCategoryId =
    categoryId;

  renderCategory(categoryId);
}


/* =========================================================
   RENDER CATEGORY
   ========================================================= */

function renderCategory(categoryId) {

  const category =
    categoryMap.get(categoryId);

  if (!category) {
    return;
  }


  updateBreadcrumb();
  updateBackButton();


  const childCategories =
    getChildren(categoryId);

  const categoryPhotos =
    getCategoryPhotos(categoryId);


  portfolioGrid.classList.remove(
    "portfolio-category-view"
  );

  portfolioGrid.classList.add(
    "portfolio-photo-view"
  );


  let html = "";


  /* -------------------------------------------------------
     SUBCATEGORIES
     ------------------------------------------------------- */

  if (childCategories.length) {

    html += `
      <div class="portfolio-subcategories">
        ${childCategories
          .map(child => createCategoryCard(child))
          .join("")}
      </div>
    `;
  }


  /* -------------------------------------------------------
     PHOTOS
     ------------------------------------------------------- */

  if (categoryPhotos.length) {

    html += `
      <div class="portfolio-photo-grid">
        ${categoryPhotos
          .map((photo, index) =>
            createPhotoCard(photo, index)
          )
          .join("")}
      </div>
    `;
  }


  /* -------------------------------------------------------
     EMPTY
     ------------------------------------------------------- */

  if (!html) {

    html = `
      <div class="portfolio-empty">
        <p>No photos or subcategories available.</p>
      </div>
    `;
  }


  portfolioGrid.innerHTML = html;


  attachCategoryEvents();
  attachPhotoEvents();

  animatePortfolioView();
}


/* =========================================================
   CREATE PHOTO CARD
   ========================================================= */

function createPhotoCard(photo, index) {

  const imageUrl =
    getPhotoImageUrl(photo);

  const title =
    photo.title ||
    "Untitled";

  const description =
    photo.description ||
    "";


  return `
    <article
      class="portfolio-photo-card"
      data-photo-index="${index}"
      data-photo-id="${escapeHTML(photo.id)}"
      tabindex="0"
      role="button"
      aria-label="View ${escapeHTML(title)}"
    >

      <div class="portfolio-photo-image">

        ${
          imageUrl
            ? `
              <img
                src="${escapeHTML(imageUrl)}"
                alt="${escapeHTML(title)}"
                loading="lazy"
                decoding="async"
                draggable="false"
                onerror="this.closest('.portfolio-photo-image').classList.add('image-error'); this.style.display='none';"
              >
            `
            : `
              <div class="portfolio-image-placeholder">
                <span>No Image</span>
              </div>
            `
        }

      </div>

      ${
        title || description
          ? `
            <div class="portfolio-photo-info">

              ${
                title
                  ? `
                    <h3>
                      ${escapeHTML(title)}
                    </h3>
                  `
                  : ""
              }

              ${
                description
                  ? `
                    <p>
                      ${escapeHTML(description)}
                    </p>
                  `
                  : ""
              }

            </div>
          `
          : ""
      }

    </article>
  `;
}


/* =========================================================
   ATTACH PHOTO EVENTS
   ========================================================= */

function attachPhotoEvents() {

  const cards =
    portfolioGrid.querySelectorAll(
      ".portfolio-photo-card"
    );


  currentPhotos =
    currentCategoryId
      ? getCategoryPhotos(currentCategoryId)
      : photos;


  cards.forEach(card => {

    const index =
      Number(card.dataset.photoIndex);


    card.addEventListener("click", () => {

      openLightbox(index);

    });


    card.addEventListener("keydown", event => {

      if (
        event.key === "Enter" ||
        event.key === " "
      ) {

        event.preventDefault();

        openLightbox(index);
      }

    });

  });
}


/* =========================================================
   UPDATE BREADCRUMB
   ========================================================= */

function updateBreadcrumb() {

  if (!portfolioBreadcrumb) {
    return;
  }


  const parts = [];


  /* -------------------------------------------------------
     HOME
     ------------------------------------------------------- */

  parts.push(`
    <button
      type="button"
      class="portfolio-breadcrumb-item ${
        currentCategoryId === null
          ? "active"
          : ""
      }"
      data-breadcrumb-root
    >
      Portfolio
    </button>
  `);


  /* -------------------------------------------------------
     CATEGORY PATH
     ------------------------------------------------------- */

  if (currentCategoryId) {

    const path =
      getCategoryPath(currentCategoryId);


    path.forEach((category, index) => {

      parts.push(`
        <span class="portfolio-breadcrumb-separator">
          /
        </span>

        <button
          type="button"
          class="portfolio-breadcrumb-item ${
            index === path.length - 1
              ? "active"
              : ""
          }"
          data-breadcrumb-id="${escapeHTML(category.id)}"
        >
          ${escapeHTML(category.name)}
        </button>
      `);

    });
  }


  portfolioBreadcrumb.innerHTML =
    parts.join("");


  /* -------------------------------------------------------
     ROOT EVENT
     ------------------------------------------------------- */

  const rootButton =
    portfolioBreadcrumb.querySelector(
      "[data-breadcrumb-root]"
    );

  if (rootButton) {

    rootButton.addEventListener(
      "click",
      () => {

        if (currentCategoryId !== null) {
          navigateToRoot();
        }

      }
    );
  }


  /* -------------------------------------------------------
     CATEGORY EVENTS
     ------------------------------------------------------- */

  const categoryButtons =
    portfolioBreadcrumb.querySelectorAll(
      "[data-breadcrumb-id]"
    );


  categoryButtons.forEach(button => {

    button.addEventListener("click", () => {

      const categoryId =
        button.dataset.breadcrumbId;

      if (
        categoryId &&
        categoryId !== currentCategoryId
      ) {

        navigateToCategory(
          categoryId
        );
      }

    });

  });
}


/* =========================================================
   GET CATEGORY PATH
   ========================================================= */

function getCategoryPath(categoryId) {

  const path = [];

  let current =
    categoryMap.get(categoryId);


  while (current) {

    path.unshift(current);

    const parentId =
      current.parentId || null;

    if (!parentId) {
      break;
    }

    current =
      categoryMap.get(parentId);
  }


  return path;
}


/* =========================================================
   UPDATE BACK BUTTON
   ========================================================= */

function updateBackButton() {

  if (!portfolioBack) {
    return;
  }

  portfolioBack.hidden =
    currentCategoryId === null;
}


/* =========================================================
   BACK BUTTON
   ========================================================= */

function goBack() {

  if (!currentCategoryId) {
    return;
  }


  const current =
    categoryMap.get(currentCategoryId);


  if (!current) {
    navigateToRoot();
    return;
  }


  const parentId =
    current.parentId || null;


  if (parentId) {

    navigateToCategory(parentId);

  } else {

    navigateToRoot();

  }
}


/* =========================================================
   NAVIGATE ROOT
   ========================================================= */

function navigateToRoot() {

  currentCategoryId = null;

  renderRootCategories();

  scrollToPortfolio();
}


/* =========================================================
   NAVIGATE CATEGORY
   ========================================================= */

function navigateToCategory(categoryId) {

  currentCategoryId =
    categoryId;

  renderCategory(categoryId);

  scrollToPortfolio();
}


/* =========================================================
   SCROLL TO PORTFOLIO
   ========================================================= */

function scrollToPortfolio() {

  const section =
    document.getElementById("portfolio");

  if (!section) {
    return;
  }


  const rect =
    section.getBoundingClientRect();


  /*
   Only scroll if portfolio is not already
   comfortably visible.
  */

  if (
    rect.top < 0 ||
    rect.top > window.innerHeight * 0.35
  ) {

    section.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

  }
}


/* =========================================================
   ANIMATE PORTFOLIO VIEW
   ========================================================= */

function animatePortfolioView() {

  if (!portfolioGrid) {
    return;
  }


  portfolioGrid.classList.remove(
    "portfolio-view-enter"
  );


  /*
   Force browser reflow so the animation
   restarts every time.
  */

  void portfolioGrid.offsetWidth;


  portfolioGrid.classList.add(
    "portfolio-view-enter"
  );
}


/* =========================================================
   LIGHTBOX — OPEN
   ========================================================= */

function openLightbox(index) {

  if (!currentPhotos.length) {
    return;
  }


  if (
    index < 0 ||
    index >= currentPhotos.length
  ) {
    return;
  }


  currentPhotoIndex =
    index;


  const photo =
    currentPhotos[currentPhotoIndex];


  if (!photo) {
    return;
  }


  const imageUrl =
    getPhotoImageUrl(photo);


  if (!imageUrl) {
    return;
  }


  isLightboxChanging = false;


  updateLightboxContent(
    photo,
    imageUrl,
    false
  );


  if (!lightbox) {
    return;
  }


  lightbox.classList.add("active");

  document.body.classList.add(
    "lightbox-open"
  );


  /*
   Prevent background page scrolling.
  */

  document.body.style.overflow =
    "hidden";
}


/* =========================================================
   UPDATE LIGHTBOX CONTENT
   ========================================================= */

function updateLightboxContent(
  photo,
  imageUrl,
  animate = true,
  direction = 1
) {

  if (!lightboxImage) {
    return;
  }


  if (!animate) {

    lightboxImage.classList.remove(
      "slide-out-left",
      "slide-out-right",
      "slide-in-left",
      "slide-in-right"
    );


    lightboxImage.src =
      imageUrl;


    lightboxImage.alt =
      photo.title ||
      "Portfolio image";


    updateLightboxText(photo);

    return;
  }


  /*
   Remove old animation classes.
  */

  lightboxImage.classList.remove(
    "slide-out-left",
    "slide-out-right",
    "slide-in-left",
    "slide-in-right"
  );


  /*
   Force animation restart.
  */

  void lightboxImage.offsetWidth;


  /*
   Slide current image OUT.
  */

  const outClass =
    direction > 0
      ? "slide-out-left"
      : "slide-out-right";


  lightboxImage.classList.add(
    outClass
  );


  setTimeout(() => {

    lightboxImage.classList.remove(
      outClass
    );


    /*
     Set next image.
    */

    lightboxImage.src =
      imageUrl;


    lightboxImage.alt =
      photo.title ||
      "Portfolio image";


    updateLightboxText(photo);


    /*
     Slide new image IN.
    */

    const inClass =
      direction > 0
        ? "slide-in-right"
        : "slide-in-left";


    lightboxImage.classList.add(
      inClass
    );


    setTimeout(() => {

      lightboxImage.classList.remove(
        inClass
      );

      isLightboxChanging = false;

    }, 380);


  }, 190);
}


/* =========================================================
   UPDATE LIGHTBOX TEXT
   ========================================================= */

function updateLightboxText(photo) {

  if (lightboxTitle) {

    lightboxTitle.textContent =
      photo.title || "";

  }


  if (lightboxDescription) {

    lightboxDescription.textContent =
      photo.description || "";

  }
}


/* =========================================================
   CHANGE LIGHTBOX IMAGE
   ========================================================= */

function changeLightboxImage(direction) {

  if (
    !lightbox ||
    !lightbox.classList.contains("active")
  ) {
    return;
  }


  if (
    isLightboxChanging ||
    !currentPhotos.length
  ) {
    return;
  }


  if (
    direction !== 1 &&
    direction !== -1
  ) {
    return;
  }


  isLightboxChanging = true;


  /*
   Wrap around.
  */

  let newIndex =
    currentPhotoIndex + direction;


  if (newIndex >= currentPhotos.length) {
    newIndex = 0;
  }


  if (newIndex < 0) {
    newIndex =
      currentPhotos.length - 1;
  }


  currentPhotoIndex =
    newIndex;


  const photo =
    currentPhotos[currentPhotoIndex];


  const imageUrl =
    getPhotoImageUrl(photo);


  if (!imageUrl) {

    isLightboxChanging = false;

    changeLightboxImage(direction);

    return;
  }


  updateLightboxContent(
    photo,
    imageUrl,
    true,
    direction
  );
}


/* =========================================================
   CLOSE LIGHTBOX
   ========================================================= */

function closeLightbox() {

  if (!lightbox) {
    return;
  }


  lightbox.classList.remove(
    "active"
  );


  document.body.classList.remove(
    "lightbox-open"
  );


  document.body.style.overflow =
    "";


  isLightboxChanging = false;


  if (lightboxImage) {

    lightboxImage.classList.remove(
      "slide-out-left",
      "slide-out-right",
      "slide-in-left",
      "slide-in-right"
    );

  }
}


/* =========================================================
   KEYBOARD CONTROLS
   ========================================================= */

document.addEventListener(
  "keydown",
  event => {

    if (
      !lightbox ||
      !lightbox.classList.contains("active")
    ) {
      return;
    }


    switch (event.key) {

      case "Escape":

        closeLightbox();

        break;


      case "ArrowRight":

        event.preventDefault();

        changeLightboxImage(1);

        break;


      case "ArrowLeft":

        event.preventDefault();

        changeLightboxImage(-1);

        break;

    }

  }
);


/* =========================================================
   LIGHTBOX BACKGROUND CLICK
   ========================================================= */

if (lightbox) {

  lightbox.addEventListener(
    "click",
    event => {

      /*
       Close when clicking the empty
       lightbox background.

       Do not close when clicking the
       image/caption/content.
      */

      if (
        event.target === lightbox
      ) {

        closeLightbox();

      }

    }
  );
}


/* =========================================================
   LIGHTBOX TOUCH / SWIPE
   ========================================================= */

let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;


if (lightbox) {

  lightbox.addEventListener(
    "touchstart",
    event => {

      if (!event.touches.length) {
        return;
      }

      touchStartX =
        event.touches[0].clientX;

      touchStartY =
        event.touches[0].clientY;

    },
    { passive: true }
  );


  lightbox.addEventListener(
    "touchend",
    event => {

      if (!event.changedTouches.length) {
        return;
      }


      touchEndX =
        event.changedTouches[0].clientX;

      touchEndY =
        event.changedTouches[0].clientY;


      const deltaX =
        touchEndX - touchStartX;

      const deltaY =
        touchEndY - touchStartY;


      /*
       Ignore mostly vertical swipes.
      */

      if (
        Math.abs(deltaX) <
        Math.abs(deltaY)
      ) {
        return;
      }


      /*
       Minimum swipe distance.
      */

      if (Math.abs(deltaX) < 50) {
        return;
      }


      if (deltaX < 0) {

        changeLightboxImage(1);

      } else {

        changeLightboxImage(-1);

      }

    },
    { passive: true }
  );
}


/* =========================================================
   BACK BUTTON EVENT
   ========================================================= */

if (portfolioBack) {

  portfolioBack.addEventListener(
    "click",
    goBack
  );

}


/* =========================================================
   GLOBAL LIGHTBOX FUNCTIONS
   Required by index.html onclick=""
   ========================================================= */

window.openLightbox =
  openLightbox;

window.changeLightboxImage =
  changeLightboxImage;

window.closeLightbox =
  closeLightbox;


/* =========================================================
   START
   ========================================================= */

loadPortfolio();