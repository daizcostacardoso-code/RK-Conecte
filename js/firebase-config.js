const firebaseConfig = {
    apiKey: "AIzaSyBYZYbcYwU2U-mUXAEKsQzZddsUEHNynPI",
    authDomain: "rk-vidracaria.firebaseapp.com",
    projectId: "rk-vidracaria",
    storageBucket: "rk-vidracaria.firebasestorage.app",
    messagingSenderId: "591785291580",
    appId: "1:591785291580:web:8c28e751fcb859cd5eb839"
};

let db = null;

try {
    if (typeof firebase !== "undefined" && firebaseConfig.apiKey && firebaseConfig.projectId) {
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }

        db = firebase.firestore();
        db.enablePersistence({ synchronizeTabs: true }).catch(erro => {
            if (erro?.code !== "failed-precondition" && erro?.code !== "unimplemented") {
                console.warn("Persistencia offline do Firestore indisponivel:", erro);
            }
        });
    } else {
        console.error("Firebase não carregado. O Firestore está indisponível.");
    }
} catch (erro) {
    console.error("Erro ao inicializar Firebase:", erro);
    db = null;
}
