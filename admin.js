import { auth, db } from "./firebase-config.js";

import {
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";

import {
    collection,
    getDocs,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";


/* =========================
   ELEMENTS
========================= */

const loginSection =
    document.getElementById("login-section");

const adminSection =
    document.getElementById("admin-section");

const loginForm =
    document.getElementById("login-form");

const loginMessage =
    document.getElementById("login-message");

const logoutButton =
    document.getElementById("logout-button");

const categoryManager =
    document.getElementById("category-manager");


/* =========================
   LOGIN
========================= */

loginForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const email =
        document.getElementById("email").value.trim();

    const password =
        document.getElementById("password").value;

    loginMessage.textContent = "Logging in...";

    try {

        await signInWithEmailAndPassword(
            auth,
            email,
            password
        );

        loginMessage.textContent = "";

    } catch (error) {

        console.error("Login error:", error);

        loginMessage.textContent =
            "Login failed. Check your email and password.";

    }

});


/* =========================
   LOGOUT
========================= */

logoutButton.addEventListener("click", async () => {

    try {

        await signOut(auth);

    } catch (error) {

        console.error("Logout error:", error);

    }

});


/* =========================
   AUTH STATE
========================= */

onAuthStateChanged(auth, async (user) => {

    if (user) {

        console.log("Admin logged in:", user.email);

        loginSection.hidden = true;

        adminSection.hidden = false;

        await loadCategories();

    } else {

        console.log("No user logged in.");

        loginSection.hidden = false;

        adminSection.hidden = true;

    }

});


/* =========================
   LOAD CATEGORIES
========================= */

async function loadCategories() {

    categoryManager.innerHTML =
        "<p>Loading categories...</p>";

    try {

        const categoryQuery = query(
            collection(db, "portfolio_categories"),
            orderBy("sortOrder")
        );

        const snapshot =
            await getDocs(categoryQuery);

        categoryManager.innerHTML = "";

        if (snapshot.empty) {

            categoryManager.innerHTML =
                "<p>No categories yet.</p>";

            return;
        }

        snapshot.forEach((doc) => {

            const data = doc.data();

            const item =
                document.createElement("div");

            item.className = "category-row";

            item.textContent =
                data.name || "Unnamed category";

            categoryManager.appendChild(item);

        });

    } catch (error) {

        console.error("Category loading error:", error);

        categoryManager.innerHTML =
            "<p>Unable to load categories.</p>";

    }

}