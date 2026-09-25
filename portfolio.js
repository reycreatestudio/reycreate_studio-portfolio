import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";

import {
  getFirestore,
  collection,
  getDocs,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";


/* =========================================
   FIREBASE CONFIG
========================================= */

const firebaseConfig = {
  apiKey: "AIzaSyBlbeyeynUXvrSE-TBVjwaEiBobHTrBlQo",
  authDomain: "reycreatestudio-portfoli-9b09b.firebaseapp.com",
  projectId: "reycreatestudio-portfoli-9b09b",
  storageBucket: "reycreatestudio-portfoli-9b09b.firebasestorage.app",
  messagingSenderId: "41750977632",
  appId: "1:41750977632:web:f202e8614f20e5d9ceb705"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);


/* =========================================
   GLOBAL DATA
========================================= */

let categories = [];
let photos = [];

let currentCategoryId = null;

let lightboxPhotos = [];
let currentLightboxIndex = 0;

let lightboxAnimating = false;


/* =========================================
   ELEMENTS
========================================= */

const portfolioGrid =
  document.getElementById("portfolio-grid");

const breadcrumb =
  document.getElementById("portfolio-breadcrumb");

const backButton =
  document.getElementById("portfolio-back");

const lightbox =
  document.getElementById("portfolio-lightbox");

const lightboxImage =
  document.getElementById("lightbox-image");

const lightboxTitle =
  document.getElementById("lightbox-title");

const lightboxDescription =
  document.getElementById("lightbox-description");


/* =========================================
   LOAD PORTFOLIO
========================================= */

async function loadPortfolio() {

  try {

    portfolioGrid.innerHTML = `
      <div class="portfolio-loading">
        Loading portfolio...
      </div>
    `;


    /* ---------- CATEGORIES ---------- */

    const categorySnapshot = await getDocs(
      query(
        collection(db, "portfolio_categories"),
        orderBy("sortOrder")
      )
    );


    categories = categorySnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .filter(
        category =>
          category.visible !== false
      );


    /* ---------- PHOTOS ---------- */

    const photoSnapshot = await getDocs(
      query(
        collection(db, "portfolio_photos"),
        orderBy("sortOrder")
      )
    );


    photos = photoSnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .filter(
        photo =>
          photo.visible !== false
      );


    console.log(
      "Portfolio categories:",
      categories
    );

    console.log(
      "Portfolio photos:",
      photos
    );


    renderCurrentView();


  } catch (error) {

    console.error(
      "Portfolio loading error:",
      error
    );


    portfolioGrid.innerHTML = `
      <div class="portfolio-error">
        Unable to load portfolio.
      </div>
    `;

  }

}


/* =========================================
   CATEGORY HELPERS
========================================= */

function getChildren(parentId) {

  return categories
    .filter(category =>
      (category.parentId || null) === parentId
    )
    .sort(
      (a, b) =>
        (a.sortOrder || 0) -
        (b.sortOrder || 0)
    );

}


function getCategoryPhotos(categoryId) {

  return photos
    .filter(photo =>
      photo.categoryId === categoryId
    )
    .sort(
      (a, b) =>
        (a.sortOrder || 0) -
        (b.sortOrder || 0)
    );

}


/* =========================================
   FIND FIRST PHOTO IN CATEGORY TREE
========================================= */

function getFirstPhotoInCategoryTree(categoryId) {

  /* Direct photos first */

  const directPhotos =
    getCategoryPhotos(categoryId);


  if (directPhotos.length) {

    return (
      directPhotos.find(
        photo =>
          photo.isCover === true
      ) ||
      directPhotos[0]
    );

  }


  /* Search child categories */

  const children =
    getChildren(categoryId);


  for (const child of children) {

    const childPhoto =
      getFirstPhotoInCategoryTree(
        child.id
      );


    if (childPhoto) {
      return childPhoto;
    }

  }


  return null;

}


/* =========================================
   CATEGORY COVER
========================================= */

function getCoverPhoto(categoryId) {

  return getFirstPhotoInCategoryTree(
    categoryId
  );

}


/* =========================================
   CURRENT VIEW
========================================= */

function renderCurrentView() {

  portfolioGrid.innerHTML = "";


  if (!currentCategoryId) {

    renderRootCategories();

    backButton.hidden = true;

    updateBreadcrumb();

    return;

  }


  renderCategoryContents();

  backButton.hidden = false;

  updateBreadcrumb();

}


/* =========================================
   ROOT CATEGORIES
========================================= */

function renderRootCategories() {

  const rootCategories =
    getChildren(null);


  if (!rootCategories.length) {

    portfolioGrid.innerHTML = `
      <div class="portfolio-empty">
        No portfolio categories available.
      </div>
    `;

    return;

  }


  rootCategories.forEach(
    category => {

      portfolioGrid.appendChild(
        createCategoryCard(category)
      );

    }
  );

}


/* =========================================
   CATEGORY CONTENTS
========================================= */

function renderCategoryContents() {

  const children =
    getChildren(currentCategoryId);


  const categoryPhotos =
    getCategoryPhotos(currentCategoryId);


  if (
    !children.length &&
    !categoryPhotos.length
  ) {

    portfolioGrid.innerHTML = `
      <div class="portfolio-empty">
        This category is empty.
      </div>
    `;

    return;

  }


  /* ---------- SUBCATEGORIES ---------- */

  children.forEach(
    category => {

      portfolioGrid.appendChild(
        createCategoryCard(category)
      );

    }
  );


  /* ---------- PHOTOS ---------- */

  categoryPhotos.forEach(
    (photo, index) => {

      portfolioGrid.appendChild(
        createPhotoCard(
          photo,
          index
        )
      );

    }
  );

}


/* =========================================
   CATEGORY CARD
========================================= */

function createCategoryCard(category) {

  const card =
    document.createElement("button");

  card.type = "button";

  card.className =
    "portfolio-item portfolio-category";


  card.dataset.categoryId =
    category.id;


  /* ---------- COVER ---------- */

  const cover =
    getCoverPhoto(category.id);


  if (cover && cover.imageUrl) {

    const image =
      document.createElement("img");

    image.src =
      cover.imageUrl;

    image.alt =
      category.name || "Portfolio category";

    image.loading =
      "lazy";

    image.onerror = () => {

      image.style.display =
        "none";

    };

    card.appendChild(image);

  } else {

    const placeholder =
      document.createElement("div");

    placeholder.className =
      "portfolio-placeholder";

    placeholder.textContent =
      "No Cover Image";

    card.appendChild(
      placeholder
    );

  }


  /* ---------- OVERLAY ---------- */

  const overlay =
    document.createElement("div");

  overlay.className =
    "portfolio-overlay";


  const title =
    document.createElement("h3");

  title.textContent =
    category.name || "Untitled";


  overlay.appendChild(
    title
  );


  if (category.description) {

    const description =
      document.createElement("p");

    description.textContent =
      category.description;

    overlay.appendChild(
      description
    );

  }


  card.appendChild(
    overlay
  );


  /* ---------- CLICK ---------- */

  card.addEventListener(
    "click",
    () => {

      currentCategoryId =
        category.id;

      renderCurrentView();

      document
        .getElementById("portfolio")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });

    }
  );


  return card;

}


/* =========================================
   PHOTO CARD
========================================= */

function createPhotoCard(
  photo,
  index
) {

  const card =
    document.createElement("button");

  card.type = "button";

  card.className =
    "portfolio-item portfolio-photo";


  card.dataset.photoId =
    photo.id;


  /* ---------- IMAGE ---------- */

  const image =
    document.createElement("img");

  image.src =
    photo.imageUrl;

  image.alt =
    photo.title || "Portfolio photo";

  image.loading =
    "lazy";


  image.onerror = () => {

    image.style.opacity =
      "0.3";

  };


  card.appendChild(
    image
  );


  /* ---------- OVERLAY ---------- */

  const overlay =
    document.createElement("div");

  overlay.className =
    "portfolio-overlay";


  const title =
    document.createElement("h3");

  title.textContent =
    photo.title || "Untitled";


  overlay.appendChild(
    title
  );


  if (photo.description) {

    const description =
      document.createElement("p");

    description.textContent =
      photo.description;

    overlay.appendChild(
      description
    );

  }


  card.appendChild(
    overlay
  );


  /* ---------- CLICK ---------- */

  card.addEventListener(
    "click",
    () => {

      const categoryPhotos =
        getCategoryPhotos(
          currentCategoryId
        );


      openLightbox(
        categoryPhotos,
        index
      );

    }
  );


  return card;

}


/* =========================================
   BREADCRUMB
========================================= */

function updateBreadcrumb() {

  breadcrumb.innerHTML = "";


  const home =
    document.createElement("button");

  home.type = "button";

  home.textContent =
    "Portfolio";


  home.addEventListener(
    "click",
    () => {

      currentCategoryId =
        null;

      renderCurrentView();

    }
  );


  breadcrumb.appendChild(
    home
  );


  if (!currentCategoryId) {
    return;
  }


  const chain = [];


  let current =
    categories.find(
      category =>
        category.id ===
        currentCategoryId
    );


  /* Safety against broken parent relationships */

  const visited = new Set();


  while (
    current &&
    !visited.has(current.id)
  ) {

    visited.add(current.id);

    chain.unshift(
      current
    );


    current =
      categories.find(
        category =>
          category.id ===
          current.parentId
      );

  }


  chain.forEach(
    category => {

      const separator =
        document.createElement("span");

      separator.textContent =
        " / ";


      breadcrumb.appendChild(
        separator
      );


      const button =
        document.createElement("button");

      button.type = "button";

      button.textContent =
        category.name || "Untitled";


      button.addEventListener(
        "click",
        () => {

          currentCategoryId =
            category.id;

          renderCurrentView();

        }
      );


      breadcrumb.appendChild(
        button
      );

    }
  );

}


/* =========================================
   BACK BUTTON
========================================= */

backButton.addEventListener(
  "click",
  () => {

    if (!currentCategoryId) {
      return;
    }


    const current =
      categories.find(
        category =>
          category.id ===
          currentCategoryId
      );


    currentCategoryId =
      current?.parentId ||
      null;


    renderCurrentView();

  }
);


/* =========================================
   LIGHTBOX
========================================= */

function openLightbox(
  items,
  index
) {

  if (!items || !items.length) {
    return;
  }


  lightboxPhotos =
    items;


  currentLightboxIndex =
    index;


  lightboxAnimating =
    false;


  updateLightbox(false);


  lightbox.classList.add(
    "active"
  );


  document.body.style.overflow =
    "hidden";

}


/* =========================================
   UPDATE LIGHTBOX
========================================= */

function updateLightbox(
  animate = true,
  direction = 1
) {

  if (
    !lightboxPhotos.length ||
    !lightboxImage
  ) {
    return;
  }


  const photo =
    lightboxPhotos[
      currentLightboxIndex
    ];


  if (!photo) {
    return;
  }


  if (!animate) {

    lightboxImage.className = "";

    lightboxImage.src =
      photo.imageUrl;

    lightboxImage.alt =
      photo.title || "Portfolio photo";

    lightboxTitle.textContent =
      photo.title || "";

    lightboxDescription.textContent =
      photo.description || "";

    return;

  }


  if (lightboxAnimating) {
    return;
  }


  lightboxAnimating =
    true;


  const outgoingClass =
    direction > 0
      ? "slide-out-left"
      : "slide-out-right";


  const incomingClass =
    direction > 0
      ? "slide-in-right"
      : "slide-in-left";


  lightboxImage.classList.remove(
    "slide-in-right",
    "slide-in-left",
    "slide-out-left",
    "slide-out-right"
  );


  /* ---------- OUT ---------- */

  lightboxImage.classList.add(
    outgoingClass
  );


  setTimeout(
    () => {

      lightboxImage.src =
        photo.imageUrl;

      lightboxImage.alt =
        photo.title || "Portfolio photo";

      lightboxTitle.textContent =
        photo.title || "";

      lightboxDescription.textContent =
        photo.description || "";


      lightboxImage.classList.remove(
        outgoingClass
      );


      void lightboxImage.offsetWidth;


      /* ---------- IN ---------- */

      lightboxImage.classList.add(
        incomingClass
      );


      setTimeout(
        () => {

          lightboxImage.classList.remove(
            incomingClass
          );

          lightboxAnimating =
            false;

        },
        350
      );

    },
    180
  );

}


/* =========================================
   NEXT / PREVIOUS
========================================= */

function changeLightboxImage(
  direction
) {

  if (
    !lightboxPhotos.length ||
    lightboxAnimating
  ) {
    return;
  }


  currentLightboxIndex +=
    direction;


  if (
    currentLightboxIndex >=
    lightboxPhotos.length
  ) {

    currentLightboxIndex =
      0;

  }


  if (
    currentLightboxIndex < 0
  ) {

    currentLightboxIndex =
      lightboxPhotos.length - 1;

  }


  updateLightbox(
    true,
    direction
  );

}


/* =========================================
   CLOSE LIGHTBOX
========================================= */

function closeLightbox() {

  if (!lightbox) {
    return;
  }


  lightbox.classList.remove(
    "active"
  );


  document.body.style.overflow =
    "";


  lightboxAnimating =
    false;

}


/* =========================================
   KEYBOARD CONTROLS
========================================= */

document.addEventListener(
  "keydown",
  event => {

    if (
      !lightbox ||
      !lightbox.classList.contains("active")
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

      changeLightboxImage(1);

      return;

    }


    if (
      event.key === "ArrowLeft"
    ) {

      changeLightboxImage(-1);

      return;

    }

  }
);


/* =========================================
   GLOBAL FUNCTIONS
========================================= */

window.openLightbox =
  openLightbox;

window.changeLightboxImage =
  changeLightboxImage;

window.closeLightbox =
  closeLightbox;


/* =========================================
   START
========================================= */

loadPortfolio();