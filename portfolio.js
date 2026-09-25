/* =========================================================
   REYCREATE STUDIO
   DYNAMIC FIRESTORE PORTFOLIO
   ========================================================= */

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


/* =========================================================
   FIREBASE CONFIG
   ========================================================= */

const firebaseConfig = {

    apiKey:
        "AIzaSyBlbeyeynUXvrSE-TBVjwaEiBobHTrBlQo",

    authDomain:
        "reycreatestudio-portfoli-9b09b.firebaseapp.com",

    projectId:
        "reycreatestudio-portfoli-9b09b",

    storageBucket:
        "reycreatestudio-portfoli-9b09b.firebasestorage.app",

    messagingSenderId:
        "41750977632",

    appId:
        "1:41750977632:web:f202e8614f20e5d9ceb705"

};


const app = initializeApp(firebaseConfig);

const db = getFirestore(app);


/* =========================================================
   ELEMENTS
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

let currentCategoryId = null;

let navigationHistory = [];

let lightboxPhotos = [];

let currentLightboxIndex = 0;

let isLightboxAnimating = false;


/* =========================================================
   INITIALIZE
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadPortfolio();

    }
);


/* =========================================================
   LOAD PORTFOLIO
   ========================================================= */

async function loadPortfolio() {

    try {

        portfolioGrid.innerHTML =
            "<p>Loading portfolio...</p>";


        /* =========================
           LOAD CATEGORIES
        ========================= */

        const categoryQuery =
            query(
                collection(
                    db,
                    "portfolio_categories"
                ),
                orderBy("sortOrder")
            );


        const categorySnapshot =
            await getDocs(
                categoryQuery
            );


        categories = [];


        categorySnapshot.forEach(
            item => {

                const data =
                    item.data();


                if (
                    data.visible !== false
                ) {

                    categories.push({

                        id:
                            item.id,

                        ...data

                    });

                }

            }
        );


        /* =========================
           LOAD PHOTOS
        ========================= */

        const photoQuery =
            query(
                collection(
                    db,
                    "portfolio_photos"
                ),
                orderBy("sortOrder")
            );


        const photoSnapshot =
            await getDocs(
                photoQuery
            );


        photos = [];


        photoSnapshot.forEach(
            item => {

                const data =
                    item.data();


                if (
                    data.visible !== false
                ) {

                    photos.push({

                        id:
                            item.id,

                        ...data

                    });

                }

            }
        );


        /* =========================
           SHOW ROOT
        ========================= */

        navigationHistory = [];

        currentCategoryId = null;

        renderCurrentLevel();


    } catch (error) {

        console.error(
            "Portfolio loading error:",
            error
        );


        portfolioGrid.innerHTML = `
            <p class="portfolio-error">
                Unable to load portfolio.
            </p>
        `;

    }

}


/* =========================================================
   GET CHILD CATEGORIES
   ========================================================= */

function getChildren(
    parentId
) {

    return categories.filter(
        category =>
            (
                category.parentId ||
                null
            ) === parentId
    );

}


/* =========================================================
   GET CATEGORY PHOTOS
   ========================================================= */

function getCategoryPhotos(
    categoryId
) {

    return photos.filter(
        photo =>
            photo.categoryId ===
            categoryId
    );

}


/* =========================================================
   GET COVER PHOTO
   ========================================================= */

function getCoverPhoto(
    categoryId
) {

    const categoryPhotos =
        getCategoryPhotos(
            categoryId
        );


    if (
        categoryPhotos.length === 0
    ) {

        return null;

    }


    const selectedCover =
        categoryPhotos.find(
            photo =>
                photo.isCover === true
        );


    return (
        selectedCover ||
        categoryPhotos[0]
    );

}


/* =========================================================
   RENDER CURRENT LEVEL
   ========================================================= */

function renderCurrentLevel() {

    portfolioGrid.innerHTML = "";


    /* =========================
       ROOT CATEGORIES
    ========================= */

    if (
        currentCategoryId === null
    ) {

        renderCategories(
            getChildren(null)
        );


        portfolioBack.hidden =
            true;


        updateBreadcrumb();

        return;

    }


    const currentCategory =
        categories.find(
            category =>
                category.id ===
                currentCategoryId
        );


    if (!currentCategory) {

        return;

    }


    const children =
        getChildren(
            currentCategoryId
        );


    const categoryPhotos =
        getCategoryPhotos(
            currentCategoryId
        );


    /* =========================
       SHOW SUBCATEGORIES
       ========================= */

    if (
        children.length > 0
    ) {

        renderCategories(
            children
        );

    }


    /* =========================
       SHOW PHOTOS
       ========================= */

    if (
        categoryPhotos.length > 0
    ) {

        renderPhotos(
            categoryPhotos
        );

    }


    /* =========================
       EMPTY
    ========================= */

    if (
        children.length === 0 &&
        categoryPhotos.length === 0
    ) {

        portfolioGrid.innerHTML = `
            <p class="portfolio-empty">
                No portfolio items yet.
            </p>
        `;

    }


    portfolioBack.hidden =
        false;


    updateBreadcrumb();

}


/* =========================================================
   RENDER CATEGORY CARDS
   ========================================================= */

function renderCategories(
    categoryList
) {

    categoryList.forEach(
        category => {

            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "portfolio-item";


            const cover =
                getCoverPhoto(
                    category.id
                );


            /* =========================
               IMAGE
            ========================= */

            if (cover) {

                const image =
                    document.createElement(
                        "img"
                    );


                image.src =
                    cover.imageUrl;


                image.alt =
                    category.name;


                image.loading =
                    "lazy";


                card.appendChild(
                    image
                );

            } else {

                const placeholder =
                    document.createElement(
                        "div"
                    );


                placeholder.className =
                    "portfolio-placeholder";


                placeholder.textContent =
                    "No Cover";


                card.appendChild(
                    placeholder
                );

            }


            /* =========================
               OVERLAY
            ========================= */

            const overlay =
                document.createElement(
                    "div"
                );


            overlay.className =
                "portfolio-overlay";


            const title =
                document.createElement(
                    "h3"
                );


            title.textContent =
                category.name;


            overlay.appendChild(
                title
            );


            const childCount =
                getChildren(
                    category.id
                ).length;


            const photoCount =
                getCategoryPhotos(
                    category.id
                ).length;


            const info =
                document.createElement(
                    "p"
                );


            if (
                childCount > 0
            ) {

                info.textContent =
                    childCount +
                    (
                        childCount === 1
                            ? " category"
                            : " categories"
                    );

            } else if (
                photoCount > 0
            ) {

                info.textContent =
                    photoCount +
                    (
                        photoCount === 1
                            ? " photo"
                            : " photos"
                    );

            } else {

                info.textContent =
                    "Open category";

            }


            overlay.appendChild(
                info
            );


            card.appendChild(
                overlay
            );


            /* =========================
               CLICK
            ========================= */

            card.addEventListener(
                "click",
                () => {

                    navigationHistory.push(
                        currentCategoryId
                    );


                    currentCategoryId =
                        category.id;


                    renderCurrentLevel();


                    document
                        .getElementById(
                            "portfolio"
                        )
                        ?.scrollIntoView({
                            behavior: "smooth"
                        });

                }
            );


            portfolioGrid.appendChild(
                card
            );

        }
    );

}


/* =========================================================
   RENDER PHOTOS
   ========================================================= */

function renderPhotos(
    photoList
) {

    photoList.forEach(
        (photo, index) => {

            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "portfolio-item portfolio-photo-item";


            const image =
                document.createElement(
                    "img"
                );


            image.src =
                photo.imageUrl;


            image.alt =
                photo.title ||
                "Portfolio photo";


            image.loading =
                "lazy";


            card.appendChild(
                image
            );


            /* =========================
               OVERLAY
            ========================= */

            const overlay =
                document.createElement(
                    "div"
                );


            overlay.className =
                "portfolio-overlay";


            const title =
                document.createElement(
                    "h3"
                );


            title.textContent =
                photo.title ||
                "Untitled";


            overlay.appendChild(
                title
            );


            if (
                photo.description
            ) {

                const description =
                    document.createElement(
                        "p"
                    );


                description.textContent =
                    photo.description;


                overlay.appendChild(
                    description
                );

            }


            card.appendChild(
                overlay
            );


            /* =========================
               OPEN LIGHTBOX
            ========================= */

            card.addEventListener(
                "click",
                () => {

                    openLightbox(
                        photoList,
                        index
                    );

                }
            );


            portfolioGrid.appendChild(
                card
            );

        }
    );

}


/* =========================================================
   BREADCRUMB
   ========================================================= */

function updateBreadcrumb() {

    portfolioBreadcrumb.innerHTML =
        "";


    const home =
        document.createElement(
            "button"
        );


    home.type =
        "button";


    home.textContent =
        "Portfolio";


    home.addEventListener(
        "click",
        () => {

            navigationHistory = [];

            currentCategoryId = null;

            renderCurrentLevel();

        }
    );


    portfolioBreadcrumb.appendChild(
        home
    );


    if (
        currentCategoryId === null
    ) {

        return;

    }


    const path =
        buildCategoryPath(
            currentCategoryId
        );


    path.forEach(
        (category, index) => {

            const separator =
                document.createElement(
                    "span"
                );


            separator.textContent =
                " / ";


            portfolioBreadcrumb.appendChild(
                separator
            );


            const item =
                document.createElement(
                    "button"
                );


            item.type =
                "button";


            item.textContent =
                category.name;


            item.addEventListener(
                "click",
                () => {

                    currentCategoryId =
                        category.id;


                    navigationHistory =
                        [];


                    renderCurrentLevel();

                }
            );


            portfolioBreadcrumb.appendChild(
                item
            );

        }
    );

}


/* =========================================================
   BUILD CATEGORY PATH
   ========================================================= */

function buildCategoryPath(
    categoryId
) {

    const path = [];

    let category =
        categories.find(
            item =>
                item.id ===
                categoryId
        );


    while (category) {

        path.unshift(
            category
        );


        if (
            !category.parentId
        ) {

            break;

        }


        category =
            categories.find(
                item =>
                    item.id ===
                    category.parentId
            );

    }


    return path;

}


/* =========================================================
   BACK BUTTON
   ========================================================= */

portfolioBack.addEventListener(
    "click",
    () => {

        if (
            navigationHistory.length > 0
        ) {

            currentCategoryId =
                navigationHistory.pop();

        } else {

            currentCategoryId =
                null;

        }


        renderCurrentLevel();

    }
);


/* =========================================================
   LIGHTBOX
   ========================================================= */

function openLightbox(
    photoList,
    index
) {

    lightboxPhotos =
        photoList;

    currentLightboxIndex =
        index;


    showLightboxImage(
        index,
        "none"
    );


    lightbox.classList.add(
        "active"
    );


    document.body.classList.add(
        "lightbox-open"
    );

}


/* =========================================================
   SHOW LIGHTBOX IMAGE
   ========================================================= */

function showLightboxImage(
    index,
    direction = "none"
) {

    if (
        !lightboxPhotos.length
    ) {

        return;

    }


    const photo =
        lightboxPhotos[index];


    if (!photo) {

        return;

    }


    lightboxImage.classList.remove(
        "slide-in-right",
        "slide-in-left",
        "slide-out-left",
        "slide-out-right"
    );


    if (
        direction === "next"
    ) {

        lightboxImage.classList.add(
            "slide-in-right"
        );

    }


    if (
        direction === "prev"
    ) {

        lightboxImage.classList.add(
            "slide-in-left"
        );

    }


    lightboxImage.src =
        photo.imageUrl;


    lightboxImage.alt =
        photo.title ||
        "Portfolio photo";


    lightboxTitle.textContent =
        photo.title ||
        "";


    lightboxDescription.textContent =
        photo.description ||
        "";

}


/* =========================================================
   CHANGE LIGHTBOX IMAGE
   ========================================================= */

function changeLightboxImage(
    direction
) {

    if (
        isLightboxAnimating ||
        lightboxPhotos.length <= 1
    ) {

        return;

    }


    isLightboxAnimating =
        true;


    const oldDirection =
        direction === 1
            ? "slide-out-left"
            : "slide-out-right";


    lightboxImage.classList.remove(
        "slide-in-right",
        "slide-in-left"
    );


    lightboxImage.classList.add(
        oldDirection
    );


    setTimeout(
        () => {

            currentLightboxIndex +=
                direction;


            if (
                currentLightboxIndex <
                0
            ) {

                currentLightboxIndex =
                    lightboxPhotos.length - 1;

            }


            if (
                currentLightboxIndex >=
                lightboxPhotos.length
            ) {

                currentLightboxIndex =
                    0;

            }


            showLightboxImage(
                currentLightboxIndex,
                direction === 1
                    ? "next"
                    : "prev"
            );


            setTimeout(
                () => {

                    isLightboxAnimating =
                        false;

                },
                350
            );

        },
        250
    );

}


/* =========================================================
   CLOSE LIGHTBOX
   ========================================================= */

function closeLightbox() {

    lightbox.classList.remove(
        "active"
    );


    document.body.classList.remove(
        "lightbox-open"
    );

}


/* =========================================================
   GLOBAL FUNCTIONS
   Needed by existing HTML onclick buttons
   ========================================================= */

window.openLightbox =
    openLightbox;

window.changeLightboxImage =
    changeLightboxImage;

window.closeLightbox =
    closeLightbox;


/* =========================================================
   KEYBOARD CONTROLS
   ========================================================= */

document.addEventListener(
    "keydown",
    event => {

        if (
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

        }


        if (
            event.key === "ArrowRight"
        ) {

            changeLightboxImage(1);

        }


        if (
            event.key === "ArrowLeft"
        ) {

            changeLightboxImage(-1);

        }

    }
);