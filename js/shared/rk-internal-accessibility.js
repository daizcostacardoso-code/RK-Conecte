(function () {
    "use strict";

    const SELETOR_CAMPO = "input, select, textarea";
    function campoVisivel(campo) {
        if (!campo || campo.disabled || campo.readOnly || campo.type === "hidden") return false;
        const estilo = window.getComputedStyle(campo);
        return estilo.display !== "none" && estilo.visibility !== "hidden" && campo.getClientRects().length > 0;
    }

    function campoPendente(campo) {
        if (!campoVisivel(campo) || !campo.required) return false;
        if (campo.type === "checkbox" || campo.type === "radio") return !campo.checked;
        return !String(campo.value || "").trim() || campo.validity?.valueMissing;
    }

    function primeiroPendente(formulario) {
        if (!formulario || formulario.getClientRects().length === 0) return null;
        return [...formulario.querySelectorAll(SELETOR_CAMPO)].find(campoPendente) || null;
    }

    function formulariosVisiveis() {
        return [...document.forms].filter(formulario => formulario.getClientRects().length > 0);
    }

    function destacarProximo(formularioPreferido) {
        const formularios = formularioPreferido
            ? [formularioPreferido, ...formulariosVisiveis().filter(item => item !== formularioPreferido)]
            : formulariosVisiveis();
        return formularios.map(primeiroPendente).find(Boolean) || null;
    }

    function focarCampo(campo) {
        if (!campo) return;
        campo.classList.add("rk-campo-invalido");
        campo.scrollIntoView({ behavior: "smooth", block: "center" });
        window.setTimeout(() => campo.focus({ preventScroll: true }), 220);
    }

    function atualizarDepoisDaInteracao(evento) {
        const campo = evento.target.closest?.(SELETOR_CAMPO);
        if (!campo) return;
        if (!campoPendente(campo)) campo.classList.remove("rk-campo-invalido");
        destacarProximo(campo.form);
    }

    function prepararFormulario(formulario) {
        if (!formulario || formulario.dataset.rkAcessibilidade === "true") return;
        formulario.dataset.rkAcessibilidade = "true";
        formulario.addEventListener("submit", evento => {
            const pendente = primeiroPendente(formulario);
            if (!pendente) return;
            evento.preventDefault();
            destacarProximo(formulario);
            focarCampo(pendente);
        }, true);
    }

    function prepararTela() {
        document.body.classList.add("rk-internal-ui");
        document.querySelectorAll("form").forEach(prepararFormulario);
        destacarProximo();

        document.addEventListener("input", atualizarDepoisDaInteracao, true);
        document.addEventListener("change", atualizarDepoisDaInteracao, true);
        document.addEventListener("focusin", evento => {
            const campo = evento.target.closest?.(SELETOR_CAMPO);
            if (campo?.form) destacarProximo(campo.form);
        }, true);
        document.addEventListener("invalid", evento => {
            const campo = evento.target.closest?.(SELETOR_CAMPO);
            if (!campo) return;
            destacarProximo(campo.form);
            focarCampo(campo);
        }, true);

        let quadroPendente = 0;
        new MutationObserver(() => {
            window.cancelAnimationFrame(quadroPendente);
            quadroPendente = window.requestAnimationFrame(() => {
                document.querySelectorAll("form").forEach(prepararFormulario);
                destacarProximo(document.activeElement?.form);
            });
        }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["required", "disabled", "hidden"] });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", prepararTela, { once: true });
    } else {
        prepararTela();
    }
})();
