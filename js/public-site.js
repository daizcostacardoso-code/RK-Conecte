(() => {
    "use strict";

    function initMenu() {
        const toggle = document.querySelector(".public-menu-toggle");
        const nav = document.querySelector(".public-nav");
        if (!toggle || !nav) return;

        const closeMenu = () => {
            nav.classList.remove("is-open");
            toggle.setAttribute("aria-expanded", "false");
        };

        closeMenu();

        toggle.addEventListener("click", () => {
            const aberto = nav.classList.toggle("is-open");
            toggle.setAttribute("aria-expanded", String(aberto));
        });

        nav.addEventListener("click", (event) => {
            if (!event.target.closest("a")) return;
            nav.classList.remove("is-open");
            toggle.setAttribute("aria-expanded", "false");
        });

        window.addEventListener("resize", () => {
            if (window.innerWidth > 768) {
                closeMenu();
            }
        });
    }

    function initExternalLinks() {
        document.querySelectorAll('a[target="_blank"]').forEach(link => {
            const rel = new Set(String(link.getAttribute("rel") || "").split(/\s+/).filter(Boolean));
            rel.add("noopener");
            link.setAttribute("rel", Array.from(rel).join(" "));
        });
    }

    document.addEventListener("DOMContentLoaded", () => {
        initMenu();
        initExternalLinks();
    });
})();
