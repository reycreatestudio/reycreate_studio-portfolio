import { auth } from "./firebase-config.js";

import {
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";


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

        console.error(error);

        loginMessage.textContent =
            "Login failed. Check your email and password.";

    }

});


logoutButton.addEventListener("click", async () => {

    await signOut(auth);

});


onAuthStateChanged(auth, (user) => {

    if (user) {

        loginSection.style.display = "none";
        adminSection.style.display = "block";

    } else {

        loginSection.style.display = "block";
        adminSection.style.display = "none";

    }

});