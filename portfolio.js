/* =========================================================
   REYCREATE STUDIO
   PORTFOLIO
   Firebase Firestore + GitHub Pages Images
   ========================================================= */

import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";

import {
  getFirestore,
  collection,
  getDocs
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
   FIREBASE
   ========================================================= */

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);


/* =========================================================
   GITHUB PAGES
   ========================================================= */

const GITHUB_PAGES_BASE =
  "https://reycreatestudio.github.io/reycreate_studio-portfolio/";


/* =========================================================
   DOM
   ========================================================= */

const portfolioGrid =
  document.getElementById("portfolio-grid");

const portfolioBreadcrumb =
  document.getElementById("portfolio-breadcrumb");

const portfolioBack =
  document.getElementById("portfolio-back");

const lightbox =
  document.getElementById("portfolio-lightbox");

const lightboxImage =
  document.getElementById("lightbox-image");

const lightboxTitle =
  document.getElementById("lightbox-title");

const lightboxDescription =
  document.getElementById("lightbox-description");


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

let isChangingImage = false;


/* =========================================================
   IMAGE URL
   ========================================================= */

function normalizeImageUrl(path) {

  if (!path) {
    return "";
  }

  path = String(path).trim();

  if (!path) {
    return "";
  }

  // Full URL
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  // Remove leading slash
  path = path.replace(/^\/+/, "");

  return GITHUB_PAGES_BASE + path;
}


/* =========================================================
   PHOTO URL
   ========================================================= */

function getPhotoImageUrl(photo) {

  if (!photo) {
    return "";
  }

  /*
   GitHub path has priority.
  */

  if (photo.githubPath) {
    return normalizeImageUrl(photo.githubPath);
  }

  /*
   Old imageUrl support.
  */

  if (photo.imageUrl) {
    return normalizeImageUrl(photo.imageUrl);
  }

  return "";
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
   SORT
   ========================================================= */

function sortItems(a, b) {

  const aOrder =
    Number(a.sortOrder ?? 0);

  const bOrder =
    Number(b.sortOrder ?? 0);

  if (aOrder !== bOrder) {
    return aOrder - bOrder;
  }

  const aName =
    a.name || a.title || "";

  const bName =
    b.name || b.title || "";

  return String(aName).localeCompare(
    String(bName),
    undefined,
    {
      numeric: true,
      sensitivity: "base"
    }
  );
}


/* =========================================================
   LOAD PORTFOLIO
   ========================================================= */

async function loadPortfolio() {

  console.log("Portfolio: loading...");

  showLoading();

  try {

    /* -------------------------------------------------------
       LOAD CATEGORIES
       ------------------------------------------------------- */

    const categorySnapshot =
      await getDocs(
        collection(
          db,
          "portfolio_categories"
        )
      );

    categories =
      categorySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        /*
         Only hide explicitly disabled categories.

         This also allows older documents that don't
         have a visible field to continue working.
        */
        .filter(category =>
          category.visible !== false
        )
        .sort(sortItems);


    /* -------------------------------------------------------
       LOAD PHOTOS
       ------------------------------------------------------- */

    const photoSnapshot =
      await getDocs(
        collection(
          db,
          "portfolio_photos"
        )
      );

    photos =
      photoSnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        /*
         Only hide explicitly disabled photos.
        */
        .filter(photo =>
          photo.visible !== false
        )
        .sort(sortItems);


    console.log(
      "Portfolio categories:",
      categories.length
    );

    console.log(
      "Portfolio photos:",
      photos.length
    );


    /* -------------------------------------------------------
       BUILD MAPS
       ------------------------------------------------------- */

    buildCategoryMaps();


    /* -------------------------------------------------------
       ROOT
       ------------------------------------------------------- */

    currentCategoryId = null;

    renderRootCategories();


  } catch (error) {

    console.error(
      "Portfolio loading error:",
      error
    );

    showError(
      "Portfolio could not be loaded."
    );

    /*
     Show useful information in console.
    */

    console.error(
      "Firebase error code:",
      error.code
    );

    console.error(
      "Firebase error message:",
      error.message
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

    categoryMap.set(
      category.id,
      category
    );

    const parentId =
      category.parentId || null;


    if (!childrenMap.has(parentId)) {

      childrenMap.set(
        parentId,
        []
      );
    }


    childrenMap
      .get(parentId)
      .push(category);

  });


  childrenMap.forEach(list => {

    list.sort(sortItems);

  });
}


/* =========================================================
   CHILDREN
   ========================================================= */

function getChildren(categoryId) {

  return childrenMap.get(
    categoryId
  ) || [];
}


/* =========================================================
   CATEGORY PHOTOS
   ========================================================= */

function getCategoryPhotos(categoryId) {

  return photos
    .filter(photo =>
      photo.categoryId === categoryId
    )
    .sort(sortItems);
}


/* =========================================================
   CATEGORY COVER
   ========================================================= */

function getCategoryCover(categoryId) {

  const categoryPhotos =
    getCategoryPhotos(categoryId);


  if (!categoryPhotos.length) {
    return "";
  }


  const cover =
    categoryPhotos.find(
      photo => photo.isCover === true
    );


  if (cover) {

    return getPhotoImageUrl(
      cover
    );
  }


  return getPhotoImageUrl(
    categoryPhotos[0]
  );
}


/* =========================================================
   LOADING
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
   ERROR
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
   EMPTY
   ========================================================= */

function showEmpty(message) {

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
   ROOT CATEGORIES
   ========================================================= */

function renderRootCategories() {

  currentCategoryId = null;

  updateBreadcrumb();
  updateBackButton();


  const rootCategories =
    getChildren(null);


  portfolioGrid.classList.remove(
    "portfolio-photo-view"
  );

  portfolioGrid.classList.add(
    "portfolio-category-view"
  );


  /*
   If there are no categories but there
   are photos, display the photos.
  */

  if (!rootCategories.length) {

    if (photos.length) {

      currentPhotos = photos;

      renderPhotos(
        photos
      );

    } else {

      showEmpty(
        "No portfolio available yet."
      );

    }

    return;
  }


  portfolioGrid.innerHTML =
    rootCategories
      .map(category =>
        createCategoryCard(category)
      )
      .join("");


  attachCategoryEvents();

  animatePortfolioView();
}


/* =========================================================
   CATEGORY CARD
   ========================================================= */

function createCategoryCard(category) {

  const coverUrl =
    getCategoryCover(
      category.id
    );


  const children =
    getChildren(
      category.id
    );


  const categoryPhotos =
    getCategoryPhotos(
      category.id
    );


  const childCount =
    children.length;


  const photoCount =
    categoryPhotos.length;


  let countText = "";


  if (
    childCount &&
    photoCount
  ) {

    countText =
      `${childCount} ${
        childCount === 1
          ? "category"
          : "categories"
      } · ${photoCount} ${
        photoCount === 1
          ? "photo"
          : "photos"
      }`;

  } else if (childCount) {

    countText =
      `${childCount} ${
        childCount === 1
          ? "category"
          : "categories"
      }`;

  } else if (photoCount) {

    countText =
      `${photoCount} ${
        photoCount === 1
          ? "photo"
          : "photos"
      }`;
  }


  return `
    <article
      class="portfolio-category-card"
      data-category-id="${escapeHTML(category.id)}"
      tabindex="0"
      role="button"
    >

      <div class="portfolio-category-image">

        ${
          coverUrl
            ? `
              <img
                src="${escapeHTML(coverUrl)}"
                alt="${escapeHTML(category.name || "Portfolio")}"
                loading="lazy"
                decoding="async"
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
            ${escapeHTML(
              category.name || "Untitled"
            )}
          </h2>

          ${
            category.description
              ? `
                <p>
                  ${escapeHTML(
                    category.description
                  )}
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
   CATEGORY EVENTS
   ========================================================= */

function attachCategoryEvents() {

  const cards =
    portfolioGrid.querySelectorAll(
      ".portfolio-category-card"
    );


  cards.forEach(card => {

    const categoryId =
      card.dataset.categoryId;


    card.addEventListener(
      "click",
      () => {

        openCategory(
          categoryId
        );

      }
    );


    card.addEventListener(
      "keydown",
      event => {

        if (
          event.key === "Enter" ||
          event.key === " "
        ) {

          event.preventDefault();

          openCategory(
            categoryId
          );
        }

      }
    );

  });
}


/* =========================================================
   OPEN CATEGORY
   ========================================================= */

function openCategory(categoryId) {

  if (!categoryMap.has(categoryId)) {
    return;
  }


  currentCategoryId =
    categoryId;


  renderCategory(
    categoryId
  );


  scrollToPortfolio();
}


/* =========================================================
   RENDER CATEGORY
   ========================================================= */

function renderCategory(categoryId) {

  const category =
    categoryMap.get(
      categoryId
    );


  if (!category) {
    return;
  }


  updateBreadcrumb();
  updateBackButton();


  const children =
    getChildren(
      categoryId
    );


  const categoryPhotos =
    getCategoryPhotos(
      categoryId
    );


  currentPhotos =
    categoryPhotos;


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

  if (children.length) {

    html += `
      <div class="portfolio-subcategories">

        ${children
          .map(child =>
            createCategoryCard(child)
          )
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
          .map(
            (photo, index) =>
              createPhotoCard(
                photo,
                index
              )
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
        <p>
          No photos or subcategories available.
        </p>
      </div>
    `;
  }


  portfolioGrid.innerHTML =
    html;


  attachCategoryEvents();

  attachPhotoEvents();

  animatePortfolioView();
}


/* =========================================================
   RENDER PHOTOS
   ========================================================= */

function renderPhotos(photoList) {

  currentPhotos =
    photoList || [];


  portfolioGrid.classList.remove(
    "portfolio-category-view"
  );

  portfolioGrid.classList.add(
    "portfolio-photo-view"
  );


  if (!currentPhotos.length) {

    showEmpty(
      "No photos available."
    );

    return;
  }


  portfolioGrid.innerHTML = `
    <div class="portfolio-photo-grid">

      ${currentPhotos
        .map(
          (photo, index) =>
            createPhotoCard(
              photo,
              index
            )
        )
        .join("")}

    </div>
  `;


  attachPhotoEvents();

  animatePortfolioView();
}


/* =========================================================
   PHOTO CARD
   ========================================================= */

function createPhotoCard(
  photo,
  index
) {

  const imageUrl =
    getPhotoImageUrl(
      photo
    );


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
      tabindex="0"
      role="button"
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
                      ${escapeHTML(
                        description
                      )}
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
   PHOTO EVENTS
   ========================================================= */

function attachPhotoEvents() {

  const cards =
    portfolioGrid.querySelectorAll(
      ".portfolio-photo-card"
    );


  cards.forEach(card => {

    const index =
      Number(
        card.dataset.photoIndex
      );


    const image =
      card.querySelector("img");


    /*
     Handle broken GitHub images.
    */

    if (image) {

      image.addEventListener(
        "error",
        () => {

          const container =
            image.closest(
              ".portfolio-photo-image"
            );


          if (container) {

            container.classList.add(
              "image-error"
            );

            image.style.display =
              "none";
          }

        }
      );
    }


    card.addEventListener(
      "click",
      () => {

        openLightbox(
          index
        );

      }
    );


    card.addEventListener(
      "keydown",
      event => {

        if (
          event.key === "Enter" ||
          event.key === " "
        ) {

          event.preventDefault();

          openLightbox(
            index
          );
        }

      }
    );

  });
}


/* =========================================================
   BREADCRUMB
   ========================================================= */

function updateBreadcrumb() {

  if (!portfolioBreadcrumb) {
    return;
  }


  let html = `
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
  `;


  if (currentCategoryId) {

    const path =
      getCategoryPath(
        currentCategoryId
      );


    path.forEach(
      (category, index) => {

        html += `
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
            ${escapeHTML(
              category.name
            )}
          </button>
        `;
      }
    );
  }


  portfolioBreadcrumb.innerHTML =
    html;


  /* -------------------------------------------------------
     ROOT
     ------------------------------------------------------- */

  const root =
    portfolioBreadcrumb.querySelector(
      "[data-breadcrumb-root]"
    );


  if (root) {

    root.addEventListener(
      "click",
      () => {

        if (
          currentCategoryId !== null
        ) {

          navigateToRoot();

        }

      }
    );
  }


  /* -------------------------------------------------------
     CATEGORY
     ------------------------------------------------------- */

  const buttons =
    portfolioBreadcrumb.querySelectorAll(
      "[data-breadcrumb-id]"
    );


  buttons.forEach(button => {

    button.addEventListener(
      "click",
      () => {

        const id =
          button.dataset.breadcrumbId;


        if (
          id &&
          id !== currentCategoryId
        ) {

          navigateToCategory(
            id
          );

        }

      }
    );

  });
}


/* =========================================================
   CATEGORY PATH
   ========================================================= */

function getCategoryPath(categoryId) {

  const path = [];

  let category =
    categoryMap.get(
      categoryId
    );


  /*
   Safety limit prevents an accidental
   circular parent relationship from
   creating an infinite loop.
  */

  let safety = 0;


  while (
    category &&
    safety < 100
  ) {

    path.unshift(
      category
    );


    const parentId =
      category.parentId ||
      null;


    if (!parentId) {
      break;
    }


    category =
      categoryMap.get(
        parentId
      );


    safety++;
  }


  return path;
}


/* =========================================================
   BACK BUTTON
   ========================================================= */

function updateBackButton() {

  if (!portfolioBack) {
    return;
  }


  portfolioBack.hidden =
    currentCategoryId === null;
}


/* =========================================================
   GO BACK
   ========================================================= */

function goBack() {

  if (!currentCategoryId) {
    return;
  }


  const current =
    categoryMap.get(
      currentCategoryId
    );


  if (!current) {

    navigateToRoot();

    return;
  }


  const parentId =
    current.parentId ||
    null;


  if (parentId) {

    navigateToCategory(
      parentId
    );

  } else {

    navigateToRoot();

  }
}


/* =========================================================
   ROOT NAVIGATION
   ========================================================= */

function navigateToRoot() {

  currentCategoryId =
    null;


  renderRootCategories();

  scrollToPortfolio();
}


/* =========================================================
   CATEGORY NAVIGATION
   ========================================================= */

function navigateToCategory(
  categoryId
) {

  currentCategoryId =
    categoryId;


  renderCategory(
    categoryId
  );


  scrollToPortfolio();
}


/* =========================================================
   SCROLL
   ========================================================= */

function scrollToPortfolio() {

  const section =
    document.getElementById(
      "portfolio"
    );


  if (!section) {
    return;
  }


  const rect =
    section.getBoundingClientRect();


  if (
    rect.top < 0 ||
    rect.top >
      window.innerHeight * 0.35
  ) {

    section.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

  }
}


/* =========================================================
   VIEW ANIMATION
   ========================================================= */

function animatePortfolioView() {

  if (!portfolioGrid) {
    return;
  }


  portfolioGrid.classList.remove(
    "portfolio-view-enter"
  );


  void portfolioGrid.offsetWidth;


  portfolioGrid.classList.add(
    "portfolio-view-enter"
  );
}


/* =========================================================
   LIGHTBOX OPEN
   ========================================================= */

function openLightbox(index) {

  if (
    !currentPhotos ||
    !currentPhotos.length
  ) {
    return;
  }


  if (
    index < 0 ||
    index >= currentPhotos.length
  ) {
    return;
  }


  const photo =
    currentPhotos[index];


  const imageUrl =
    getPhotoImageUrl(
      photo
    );


  if (!imageUrl) {
    return;
  }


  currentPhotoIndex =
    index;


  isChangingImage =
    false;


  updateLightboxContent(
    photo,
    imageUrl,
    false
  );


  if (!lightbox) {
    return;
  }


  lightbox.classList.add(
    "active"
  );


  document.body.classList.add(
    "lightbox-open"
  );


  document.body.style.overflow =
    "hidden";
}


/* =========================================================
   LIGHTBOX CONTENT
   ========================================================= */

function updateLightboxContent(
  photo,
  imageUrl,
  animate = false,
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


    updateLightboxText(
      photo
    );


    return;
  }


  lightboxImage.classList.remove(
    "slide-out-left",
    "slide-out-right",
    "slide-in-left",
    "slide-in-right"
  );


  void lightboxImage.offsetWidth;


  const outClass =
    direction > 0
      ? "slide-out-left"
      : "slide-out-right";


  const inClass =
    direction > 0
      ? "slide-in-right"
      : "slide-in-left";


  lightboxImage.classList.add(
    outClass
  );


  setTimeout(
    () => {

      lightboxImage.classList.remove(
        outClass
      );


      lightboxImage.src =
        imageUrl;


      lightboxImage.alt =
        photo.title ||
        "Portfolio image";


      updateLightboxText(
        photo
      );


      lightboxImage.classList.add(
        inClass
      );


      setTimeout(
        () => {

          lightboxImage.classList.remove(
            inClass
          );


          isChangingImage =
            false;

        },
        380
      );

    },
    190
  );
}


/* =========================================================
   LIGHTBOX TEXT
   ========================================================= */

function updateLightboxText(photo) {

  if (lightboxTitle) {

    lightboxTitle.textContent =
      photo.title ||
      "";

  }


  if (lightboxDescription) {

    lightboxDescription.textContent =
      photo.description ||
      "";

  }
}


/* =========================================================
   NEXT / PREVIOUS
   ========================================================= */

function changeLightboxImage(
  direction
) {

  if (
    !lightbox ||
    !lightbox.classList.contains(
      "active"
    )
  ) {
    return;
  }


  if (
    isChangingImage ||
    !currentPhotos.length
  ) {
    return;
  }


  isChangingImage =
    true;


  let newIndex =
    currentPhotoIndex +
    direction;


  /*
   Wrap around.
  */

  if (
    newIndex >=
    currentPhotos.length
  ) {

    newIndex = 0;

  }


  if (newIndex < 0) {

    newIndex =
      currentPhotos.length - 1;

  }


  const photo =
    currentPhotos[newIndex];


  const imageUrl =
    getPhotoImageUrl(
      photo
    );


  if (!imageUrl) {

    isChangingImage =
      false;

    currentPhotoIndex =
      newIndex;

    changeLightboxImage(
      direction
    );

    return;
  }


  currentPhotoIndex =
    newIndex;


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


  isChangingImage =
    false;
}


/* =========================================================
   KEYBOARD
   ========================================================= */

document.addEventListener(
  "keydown",
  event => {

    if (
      !lightbox ||
      !lightbox.classList.contains(
        "active"
      )
    ) {
      return;
    }


    if (
      event.key === "Escape"
    ) {

      closeLightbox();

      return;
    }


    if (
      event.key === "ArrowRight"
    ) {

      event.preventDefault();

      changeLightboxImage(1);

      return;
    }


    if (
      event.key === "ArrowLeft"
    ) {

      event.preventDefault();

      changeLightboxImage(-1);

      return;
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

      if (
        event.target === lightbox
      ) {

        closeLightbox();

      }

    }
  );
}


/* =========================================================
   TOUCH SWIPE
   ========================================================= */

let touchStartX = 0;
let touchStartY = 0;


if (lightbox) {

  lightbox.addEventListener(
    "touchstart",
    event => {

      if (
        !event.touches.length
      ) {
        return;
      }


      touchStartX =
        event.touches[0].clientX;


      touchStartY =
        event.touches[0].clientY;

    },
    {
      passive: true
    }
  );


  lightbox.addEventListener(
    "touchend",
    event => {

      if (
        !event.changedTouches.length
      ) {
        return;
      }


      const touch =
        event.changedTouches[0];


      const deltaX =
        touch.clientX -
        touchStartX;


      const deltaY =
        touch.clientY -
        touchStartY;


      /*
       Ignore vertical movement.
      */

      if (
        Math.abs(deltaX) <
        Math.abs(deltaY)
      ) {
        return;
      }


      /*
       Minimum swipe.
      */

      if (
        Math.abs(deltaX) < 50
      ) {
        return;
      }


      if (deltaX < 0) {

        changeLightboxImage(1);

      } else {

        changeLightboxImage(-1);

      }

    },
    {
      passive: true
    }
  );
}


/* =========================================================
   BACK BUTTON
   ========================================================= */

if (portfolioBack) {

  portfolioBack.addEventListener(
    "click",
    goBack
  );

}


/* =========================================================
   GLOBAL FUNCTIONS
   ========================================================= */

window.openLightbox =
  openLightbox;

window.changeLightboxImage =
  changeLightboxImage;

window.closeLightbox =
  closeLightbox;


/* =========================================================
   START PORTFOLIO
   ========================================================= */

loadPortfolio();