import { auth } from "./firebase-config.js";

import {
    signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";


const form = document.getElementById("login-form");
const message = document.getElementById("login-message");


console.log("ADMIN.JS LOADED");


form.addEventListener("submit", async (event) => {

    event.preventDefault();

    console.log("LOGIN BUTTON CLICKED");

    const email =
        document.getElementById("email").value.trim();

    const password =
        document.getElementById("password").value;

    message.textContent = "Logging in...";

    try {

        console.log("Trying Firebase login:", email);

        const result =
            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

        console.log(
            "LOGIN SUCCESS:",
            result.user.email
        );

        message.textContent =
            "Login successful!";

    } catch (error) {

        console.error("FIREBASE LOGIN ERROR:", error);

        message.textContent =
            error.code + " — " + error.message;

    }

});