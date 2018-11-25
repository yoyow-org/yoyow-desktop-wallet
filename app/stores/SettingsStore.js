import alt from "../altInstance";
import SettingsActions from "../actions/SettingsActions";
import IntlActions from "../actions/IntlActions";
import Immutable from "immutable";
import {merge} from "lodash";
import BaseStore, {STORAGE_KEY} from "./BaseStore";
import ls from "../../lib/localStorage";

let sk = new ls(STORAGE_KEY);

class SettingsStore extends BaseStore {
    constructor() {
        super();
        //处理环境参数

        this.exportPublicMethods({getSetting: this.getSetting.bind(this),setFastestAddr:this.setFastestAddr.bind(this)});

        this.bindListeners({
            onChangeSetting: SettingsActions.changeSetting,
            onAddWS: SettingsActions.addWS,
            onRemoveWS: SettingsActions.removeWS,
            onClearSettings: SettingsActions.clearSettings,
            onSwitchLocale: IntlActions.switchLocale
        });
        let apisvr = "ws://47.52.155.181:10011";
        let faucetsvr = "http://demo.yoyow.org:3000";
        if (!process.env.test) {
            apisvr = "wss://wallet.yoyow.org/ws";
            faucetsvr = "https://faucet.yoyow.org";
        }

        this.defaultSettings = Immutable.Map({
            locale: "zh",
            apiServer: apisvr,
            faucet_address: faucetsvr,
            walletLockTimeout: 60 * 1
        });
        let apiFaucets = [
            {value: faucetsvr, text: faucetsvr}
        ];

        let apiServers = this.getApiServers();

        if(!sessionStorage.fastestAddr){
            this.setFastestAddr()
        }
        let defaults = {
            locale: [
                "zh",
                "en"
            ],
            apiServers: [],
            apiFaucets: apiFaucets
        };
        this.settings = Immutable.Map(merge(this.defaultSettings.toJS(), sk.get("settings_v1")));
        let savedDefaults = sk.get("defaults_v1", {});
        this.defaults = merge({}, defaults, savedDefaults);
        (savedDefaults.apiServers || []).forEach(api => {
            let hasApi = false;
            if (typeof api === "string") {
                api = {value: api, text: api};
            }
            this.defaults.apiServers.forEach(server => {
                if (server.value === api.value) {
                    hasApi = true;
                }
            });

            if (!hasApi) {
                this.defaults.apiServers.push(api);
            }
        });

        for (let i = apiServers.length - 1; i >= 0; i--) {
            let hasApi = false;
            this.defaults.apiServers.forEach(api => {
                if (api.value === apiServers[i].value) {
                    hasApi = true;
                }
            });
            if (!hasApi) {
                this.defaults.apiServers.unshift(apiServers[i]);
            }
        }
    }

    getApiServers(){
        let apiServers = [];
        if(process.env.test){
            apiServers.push({value: "ws://47.52.155.181:10011", text: "TESTNET"});
        }else{
            apiServers.push({value: "wss://wallet.yoyow.org/ws", text: "wallet.yoyow.org"});
            apiServers.push({value: "wss://api-bj.yoyow.org/ws", text: "api-bj.yoyow.org"});
            apiServers.push({value: "wss://api-hz.yoyow.org/ws", text: "api-hz.yoyow.org"});
            apiServers.push({value: "wss://yoyow.onblockchain.org", text: "yoyow.onblockchain.org"});
        }
        // apiServers.push({value: "ws://localhost:8090", text: "localhost:8090"});

        return apiServers;
    }

    setFastestAddr(){
        let apiServers = this.getApiServers();
        let times = []
        apiServers.map((i,l)=>{
            let socket = new WebSocket(i.value);
            socket.onopen =()=>{
                times.push(i);
                sessionStorage.fastestAddr = times[0].value;
                this.onChangeSetting({setting: "apiServer", value: sessionStorage.fastestAddr});
                socket.close();
            }
            socket.onclose=()=>{
                // console.log(socket)
            }
        })

    }
    getSetting(setting) {
        return this.settings.get(setting);
    }

    onChangeSetting(payload) {
        this.settings = this.settings.set(
            payload.setting,
            payload.value
        );
        sk.set("settings_v1", this.settings.toJS());
        if (payload.setting === "walletLockTimeout") {
            sk.set("lockTimeout", payload.value);
        }
    }

    onAddWS(ws) {
        if (typeof ws === "string") {
            ws = {value: ws, text: ws};
        }
        this.defaults.apiServers.push(ws);
        sk.set("defaults_v1", this.defaults);
    }

    onRemoveWS(index) {
        if (index !== 0) {
            this.defaults.apiServers.splice(index, 1);
            sk.set("defaults_v1", this.defaults);
        }
    }

    onClearSettings() {
        sk.remove("settings_v1");
        this.settings = this.defaultSettings;
        sk.set("settings_v1", this.settings.toJS());
        if (window && window.location) {
            window.location.reload();
        }
    }

    onSwitchLocale({locale}) {
        this.onChangeSetting({setting: "locale", value: locale});
    }
}

export default alt.createStore(SettingsStore, "SettingsStore");