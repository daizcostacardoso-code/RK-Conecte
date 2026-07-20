class StorageAdapter {
    async save(collection, id, data) {
        throw new Error("StorageAdapter.save deve ser implementado pelo adapter concreto.");
    }

    async get(collection, id) {
        throw new Error("StorageAdapter.get deve ser implementado pelo adapter concreto.");
    }

    async list(collection) {
        throw new Error("StorageAdapter.list deve ser implementado pelo adapter concreto.");
    }

    async update(collection, id, data) {
        throw new Error("StorageAdapter.update deve ser implementado pelo adapter concreto.");
    }

    async delete(collection, id) {
        throw new Error("StorageAdapter.delete deve ser implementado pelo adapter concreto.");
    }
}

const StorageAdapterContract = {
    metodos: ["save", "get", "list", "update", "delete"],

    validar(adapter) {
        return !!adapter && this.metodos.every(metodo => typeof adapter[metodo] === "function");
    }
};

