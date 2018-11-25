import SettingsStore from "../stores/SettingsStore";
import validation from "../utils/Validation";

let serializeObj = (obj) => {
    let arr = [];
    for(let o in obj){
        arr.push(`${o}=${obj[o]}`);
    }
    return arr.join('&');
};

let baseFetch = (url, type = 'get', data) => {
    let faucetAddress = SettingsStore.getSetting("faucet_address");
    if (window && window.location && window.location.protocol === "https:") {
        faucetAddress = faucetAddress.replace(/http:\/\//, "https://");
    }

    return new Promise((resolve, reject) => {
        let requestObj = {
            method: type,
            mode: 'cors',
            headers: {
                "Accept": "application/json",
                "Content-type": "application/json"
            },
        };
        if(!validation.isEmpty(data)){
            requestObj.body = data;
        }
        fetch(`${faucetAddress}/${url}`, requestObj).then(response => {
            return response.json()
        }).then(res => {
            if(res.code == 0){
                resolve(res);
            }else{
                reject(res.msg);
            }
        }).catch(err => {
            reject(err.message);
        });
    });

};

export default {
    get(url, data){
        let params = serializeObj(data);
        return baseFetch(`${url}?${params}`);
    },

    post(url, data){
        return baseFetch(url, 'post', data);
    },
};