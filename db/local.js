import fs from 'fs'
//construct 
//namespace key value 

function CacheDB(namespace) {
    this.namespace = namespace || "CacheDBDefaultNameSpace";
    this.get = async function (key) {
        let data = await fs.readFileSync("./database/"+this.namespace + ".json", 'utf8');
        data = JSON.parse(data);
        return data[key];
    }
    this.set = async function (key, value) {
        let data = await fs.readFileSync("./database/"+this.namespace + ".json", 'utf8');
        data = JSON.parse(data);
        data[key] = value;
        await fs.writeFileSync("./database/"+this.namespace + ".json", JSON.stringify(data));
    }
    this.init = async function () {

        if (!fs.existsSync("./database/"+this.namespace + ".json")) {
            await fs.writeFileSync("./database/"+this.namespace + ".json", "{}");
        }
    }
}
export default CacheDB;