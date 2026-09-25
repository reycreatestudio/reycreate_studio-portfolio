/* =========================================================
   REYCREATE STUDIO - MAIN JAVASCRIPT
   ========================================================= */


/* =========================================================
   HAMBURGER MENU
   ========================================================= */

function toggleMenu() {

    const menu =
        document.querySelector(".menu-links");

    const icon =
        document.querySelector(".hamburger-icon");

    if (!menu || !icon) {
        return;
    }

    menu.classList.toggle("open");
    icon.classList.toggle("open");
}


/* =========================================================
   PAGE INITIALIZATION
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {


    /* =====================================================
       SCROLL FADE-IN ANIMATION
       ===================================================== */

    const fadeElements =
        document.querySelectorAll(".fade-in");


    if (
        fadeElements.length &&
        "IntersectionObserver" in window
    ) {

        const fadeObserver =
            new IntersectionObserver(
                function (entries) {

                    entries.forEach(function (entry) {

                        if (entry.isIntersecting) {

                            entry.target.classList.add("show");

                        } else {

                            entry.target.classList.remove("show");

                        }

                    });

                },
                {
                    threshold: 0.15
                }
            );


        fadeElements.forEach(function (element) {

            fadeObserver.observe(element);

        });

    } else {

        fadeElements.forEach(function (element) {

            element.classList.add("show");

        });

    }

    /* =====================================================
       PORTFOLIO LIGHTBOX
       ===================================================== */

    const portfolioLightbox =
        document.getElementById(
            "portfolio-lightbox"
        );

    const lightboxImage =
        document.getElementById(
            "lightbox-image"
        );

    const lightboxTitle =
        document.getElementById(
            "lightbox-title"
        );

    const lightboxDescription =
        document.getElementById(
            "lightbox-description"
        );


    /*
     * If lightbox doesn't exist,
     * stop lightbox code.
     */

    if (
        !portfolioLightbox ||
        !lightboxImage ||
        !lightboxTitle ||
        !lightboxDescription
    ) {

        return;

    }


    let currentLightboxIndex = 0;


    /* =====================================================
       GET VISIBLE PORTFOLIO ITEMS
       ===================================================== */

    function getVisiblePortfolioItems() {

        return Array.from(
            document.querySelectorAll(
                ".portfolio-item"
            )
        ).filter(
            function (item) {

                return !item.classList.contains(
                    "hidden"
                );

            }
        );

    }


    /* =====================================================
       SHOW LIGHTBOX ITEM
       ===================================================== */

    function showLightboxItem() {

        const visibleItems =
            getVisiblePortfolioItems();


        if (!visibleItems.length) {

            return;

        }


        /* Safety check */

        if (
            currentLightboxIndex < 0
        ) {

            currentLightboxIndex =
                visibleItems.length - 1;

        }


        if (
            currentLightboxIndex >=
            visibleItems.length
        ) {

            currentLightboxIndex = 0;

        }


        const item =
            visibleItems[
                currentLightboxIndex
            ];


        if (!item) {

            return;

        }


        const image =
            item.querySelector("img");


        const title =
            item.querySelector(
                ".portfolio-overlay h3"
            );


        const description =
            item.querySelector(
                ".portfolio-overlay p"
            );


        if (!image) {

            return;

        }


        /* Image */

        lightboxImage.src =
            image.src;

        lightboxImage.alt =
            image.alt ||
            "Portfolio image";


        /* Title */

        lightboxTitle.textContent =
            title
                ? title.textContent
                : "";


        /* Description */

        lightboxDescription.textContent =
            description
                ? description.textContent
                : "";

    }


    /* =====================================================
       OPEN LIGHTBOX
       ===================================================== */

    function openLightbox(item) {

        const visibleItems =
            getVisiblePortfolioItems();


        const index =
            visibleItems.indexOf(item);


        if (index === -1) {

            return;

        }


        currentLightboxIndex =
            index;


        showLightboxItem();


        portfolioLightbox.classList.add(
            "open"
        );


        document.body.style.overflow =
            "hidden";

    }


    /* =====================================================
       NEXT / PREVIOUS
       ===================================================== */

    function changeLightboxImage(
        direction
    ) {

        const visibleItems =
            getVisiblePortfolioItems();


        if (!visibleItems.length) {

            return;

        }


        currentLightboxIndex +=
            direction;


        if (
            currentLightboxIndex >=
            visibleItems.length
        ) {

            currentLightboxIndex = 0;

        }


        if (
            currentLightboxIndex < 0
        ) {

            currentLightboxIndex =
                visibleItems.length - 1;

        }


        showLightboxItem();

    }


    /* =====================================================
       CLOSE LIGHTBOX
       ===================================================== */

    function closeLightbox() {

        portfolioLightbox.classList.remove(
            "open"
        );


        document.body.style.overflow =
            "";

    }


    /* =====================================================
       MAKE FUNCTIONS AVAILABLE TO HTML
       ===================================================== */

    window.openLightbox =
        openLightbox;

    window.closeLightbox =
        closeLightbox;

    window.changeLightboxImage =
        changeLightboxImage;


    /* =====================================================
       PORTFOLIO ITEM CLICK
       ===================================================== */

    portfolioItems.forEach(
        function (item) {


            item.addEventListener(
                "click",
                function () {

                    openLightbox(item);

                }
            );


            /* Keyboard accessibility */

            item.setAttribute(
                "tabindex",
                "0"
            );


            item.addEventListener(
                "keydown",
                function (event) {

                    if (
                        event.key === "Enter" ||
                        event.key === " "
                    ) {

                        event.preventDefault();

                        openLightbox(item);

                    }

                }
            );

        }
    );


    /* =====================================================
       CLICK OUTSIDE LIGHTBOX
       ===================================================== */

    portfolioLightbox.addEventListener(
        "click",
        function (event) {

            if (
                event.target ===
                portfolioLightbox
            ) {

                closeLightbox();

            }

        }
    );


    /* =====================================================
       KEYBOARD CONTROLS
       ===================================================== */

    document.addEventListener(
        "keydown",
        function (event) {


            /* Only work when lightbox is open */

            if (
                !portfolioLightbox.classList.contains(
                    "open"
                )
            ) {

                return;

            }


            /* ESC */

            if (
                event.key === "Escape"
            ) {

                closeLightbox();

            }


            /* RIGHT ARROW */

            if (
                event.key === "ArrowRight"
            ) {

                changeLightboxImage(1);

            }


            /* LEFT ARROW */

            if (
                event.key === "ArrowLeft"
            ) {

                changeLightboxImage(-1);

            }

        }
    );

});