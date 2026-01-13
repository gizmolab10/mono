export default class Dictionary<K extends string | number | symbol, V> {
    private items: Record<K, V> = {} as Record<K, V>;

    constructor() {}

    static create<K extends string | number | symbol, V>(): Proxy<Record<K, V>> {
        return new Dictionary<K, V>().proxy;
    }

    private proxy: Proxy<Record<K, V>> = new Proxy(this.items, {
        get: (target, property) => target[property as K],
        set: (target, property, value) => {
            target[property as K] = value;
            return true;
        },
        deleteProperty: (target, property) => {
            delete target[property as K];
            return true;
        }
    });

    public add(key: K, value: V): void {
        this.proxy[key] = value;
    }

    public get(key: K): V | undefined {
        return this.proxy[key];
    }

    public remove(key: K): void {
        delete this.proxy[key];
    }

    public containsKey(key: K): boolean {
        return key in this.proxy;
    }

    public count(): number {
        return Object.keys(this.proxy).length;
    }

    public clear(): void {
        for (let key in this.proxy) {
            delete this.proxy[key];
        }
    }
}
