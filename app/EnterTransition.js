
import {Apis, Manger} from "yoyowjs-ws";
import {ChainStore} from "yoyowjs-lib/es";
import globalParams from './utils/GlobalParams';

import ls from "../lib/localStorage";
import walletDatabase from "./db/WalletDatabase";
//actions
import PrivateKeyActions from "./actions/PrivateKeyActions";
import FooterActions from "./actions/layout/FooterActions";

//stores
import SettingsStore from "./stores/SettingsStore";
import WalletStore from "./stores/WalletStore";

ChainStore.setDispatchFrequency(20);
let connect = true;
let enterTransition = (nextState, replaceState, callback) => {
    let connectionString = SettingsStore.getSetting("apiServer");
    if (nextState.location.pathname === "/init-error") {
        return Apis.reset(connectionString, true).init_promise
            .then((result) => {
                globalParams.init().then(() => {
                    globalParams.setConf('coin_unit', result[0].network.core_asset);
                    var db = walletDatabase.initInstance().initPromise;
                    return db.then(() => {
                        return callback();
                    }).catch((err) => {
                        console.log("err:", err);
                        return callback();
                    });
                });
            }).catch((err) => {
                console.log("err:", err);
                return callback();
            });

    }
    let initNet = () => {
        Apis.setRpcConnectionStatusCallback((msg) => {
            FooterActions.setConnStatus(msg);
        });
        Apis.instance(connectionString, !!connect).init_promise.then((result) => {
            globalParams.init().then(() => {
                globalParams.setConf('coin_unit', result[0].network.core_asset);
                var db;
                try {
                    db = walletDatabase.initInstance().initPromise;
                } catch (err) {
                    console.error("db init error:", err);
                }

                return Promise.all([db]).then(() => {
                    if (__DEBUG__) console.log("db init done");
                    return Promise.all([
                        PrivateKeyActions.loadDbData().then(() => {
                            if (__DEBUG__) console.log("=====================PrivateKeyActions.loadDbData");
                        }),
                        WalletStore.loadDbData().then(() => {
                            if (__DEBUG__) console.log("=====================WalletStore.loadDbData");
                            let urls = ["/restore-account", "/create-account", "/import-file", "/authorize-service"];//允许直接访问的url
                            if (!WalletStore.getWallet() && urls.indexOf(nextState.location.pathname) == -1) {
                                replaceState("/create-account");
                            }

                        }).catch((error) => {
                            console.error("----- WalletStore.enterTransition error ----->", error);
                        })
                    ]).then(() => {
                        callback();
                    });
                });
            });
        }).catch(error => {
            console.error("----- enterTransition error ----->", error, (new Error).stack);
            if (error.name === "InvalidStateError") {
                alert("Can't access local storage.\nPlease make sure your browser is not in private/incognito mode.");
            } else {
                replaceState("/init-error");
                callback();
            }
        });
        connect = false;
    };
    setTimeout(initNet, 200);
};

export default enterTransition;