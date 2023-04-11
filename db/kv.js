//cf kv

function CacheDB(namespace) {
    this.namespace = namespace || "CacheDBDefaultNameSpace";
    this.get = async function (key) {
        let data = await KV.get(this.namespace)
        data = JSON.parse(data||"{}")
        return data[key];
    }
    this.set = async function (key, value) {
        let data = await KV.get(this.namespace)
        data = JSON.parse(data||"{}")
        data[key] = value;
        await KV.put(this.namespace, JSON.stringify(data));
    }
    this.init = async function () {
        if (!KV.get(this.namespace)) {
            await KV.put(this.namespace, "{}");
        }
    }   
}
export default CacheDB
