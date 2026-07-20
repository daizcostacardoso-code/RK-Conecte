(function (global) {
    "use strict";

    const configuracao = Object.freeze({
        apiKey: "AIzaSyBYZYbcYwU2U-mUXAEKsQzZddsUEHNynPI",
        authDomain: "rk-vidracaria.firebaseapp.com",
        projectId: "rk-vidracaria",
        storageBucket: "rk-vidracaria.firebasestorage.app",
        messagingSenderId: "591785291580",
        appId: "1:591785291580:web:8c28e751fcb859cd5eb839"
    });

    global.RK_FIREBASE_CONFIG = configuracao;

    try {
        if (typeof global.firebase === "undefined") {
            throw new Error("SDK do Firebase não carregado.");
        }

        const app = global.firebase.apps.length
            ? global.firebase.app()
            : global.firebase.initializeApp(configuracao);
        const autenticacao = typeof global.firebase.auth === "function"
            ? global.firebase.auth()
            : null;

        if (!autenticacao) {
            throw new Error("Firebase Authentication não carregado.");
        }

        global.RKFirebase = {
            ...(global.RKFirebase || {}),
            config: configuracao,
            app,
            auth: autenticacao
        };
        global.RKFirebaseAuth = autenticacao;
    } catch (erro) {
        console.error("Não foi possível iniciar o Firebase Authentication:", erro);
        global.RKFirebase = {
            ...(global.RKFirebase || {}),
            config: configuracao,
            auth: null,
            erroAuth: erro
        };
        global.RKFirebaseAuth = null;
    }
})(window);
