// Configuração pública do projeto Firebase. Chaves privadas e credenciais de
// serviço nunca devem ser adicionadas aqui; use o ambiente seguro do backend.
var firebaseConfig = window.RK_FIREBASE_CONFIG || {
    apiKey: "AIzaSyBYZYbcYwU2U-mUXAEKsQzZddsUEHNynPI",
    authDomain: "rk-vidracaria.firebaseapp.com",
    projectId: "rk-vidracaria",
    storageBucket: "rk-vidracaria.firebasestorage.app",
    messagingSenderId: "591785291580",
    appId: "1:591785291580:web:8c28e751fcb859cd5eb839"
};

var db = null;

(function (global) {
    "use strict";

    try {
        if (typeof global.firebase === "undefined" || !firebaseConfig.apiKey || !firebaseConfig.projectId) {
            throw new Error("Firebase não carregado.");
        }

        const app = global.firebase.apps.length
            ? global.firebase.app()
            : global.firebase.initializeApp(firebaseConfig);
        const autenticacao = typeof global.firebase.auth === "function"
            ? global.firebase.auth()
            : null;

        if (typeof global.firebase.firestore === "function") {
            db = global.firebase.firestore();
        }

        global.RKFirebase = {
            ...(global.RKFirebase || {}),
            config: firebaseConfig,
            app,
            auth: autenticacao || global.RKFirebase?.auth || null,
            db
        };

        global.dispatchEvent(new CustomEvent("rk:firebase-ready", {
            detail: { auth: global.RKFirebase.auth, db }
        }));
    } catch (erro) {
        console.error("Erro ao inicializar Firebase:", erro);
        db = null;
        global.RKFirebase = {
            ...(global.RKFirebase || {}),
            config: firebaseConfig,
            db: null,
            erro
        };
    }
})(window);
