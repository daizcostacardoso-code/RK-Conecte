const ApiAdapter = {
    ativo: false,
    baseUrl: "",
    mensagemPlaceholder: "ApiAdapter e um placeholder seguro da Sprint 5.3. Firebase/localStorage continuam como fontes atuais.",

    configurar(config = {}) {
        return {
            ...this,
            ativo: config.ativo === true,
            baseUrl: this.normalizarBaseUrl(config.baseUrl)
        };
    },

    async save(collection, id, data) {
        return this.bloquearCrud(collection, id, data);
    },

    async get(collection, id) {
        return this.bloquearCrud(collection, id);
    },

    async list(collection) {
        return this.bloquearCrud(collection);
    },

    async update(collection, id, data) {
        return this.bloquearCrud(collection, id, data);
    },

    async delete(collection, id) {
        return this.bloquearCrud(collection, id);
    },

    async health() {
        return this.request("/api/health");
    },

    async dbHealth() {
        return this.request("/api/db-health");
    },

    bloquearCrud() {
        throw new Error(this.mensagemPlaceholder);
    },

    async request(path) {
        if (!this.ativo) {
            throw new Error(this.mensagemPlaceholder);
        }

        if (typeof fetch !== "function") {
            throw new Error("Fetch indisponivel para ApiAdapter.");
        }

        const response = await fetch(`${this.baseUrl}${path}`, {
            headers: {
                Accept: "application/json"
            }
        });
        const data = await response.json().catch(() => null);

        return {
            ok: response.ok,
            status: response.status,
            data
        };
    },

    normalizarBaseUrl(baseUrl) {
        if (!baseUrl || typeof baseUrl !== "string") {
            return "";
        }

        return baseUrl.replace(/\/+$/, "");
    }
};

function criarApiAdapter(config = {}) {
    return ApiAdapter.configurar(config);
}

