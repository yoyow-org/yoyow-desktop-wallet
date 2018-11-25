import alt from "../altInstance";
import {key} from "yoyowjs-lib";
import SettingsStore from "../stores/SettingsStore";
import WalletStore from "../stores/WalletStore";
import CachedSettingActions from "../actions/CachedSettingActions";

class WalletActions {

    /**
     * 创建账户
     * @param accountPwd 账户密码
     * @param shortPwd 零钱密码
     */
    createAccount(accountPwd, shortPwd = null) {
        if (shortPwd == null) shortPwd = accountPwd;
        let faucetAddress = SettingsStore.getSetting("faucet_address");
        if (window && window.location && window.location.protocol === "https:") {
            faucetAddress = faucetAddress.replace(/http:\/\//, "https://");
        }
        return new Promise(resolve => {
            let owner_private = key.get_random_key();
            let active_private = key.get_random_key();
            let secondary_private = key.get_random_key();
            let memo_private = key.get_random_key();
            resolve({owner_private, active_private, secondary_private, memo_private});
        }).then(keys => {
            let saveWallet = (uid) => {
                let created = WalletStore.onCreateWallet(
                    accountPwd,
                    shortPwd,
                    uid,
                    keys.active_private.toWif(),
                    keys.secondary_private.toWif(),
                    keys.memo_private.toWif());

                return new Promise((resolve, reject) => {
                    created.then(() => {
                        resolve({uid, owner: keys.owner_private.toWif(), secondary_private: keys.secondary_private});
                    }).catch(error => {
                        if (__DEBUG__) console.log("创建钱包失败：", error);
                        reject(error);
                    });
                });
            };

            let create_account_promise = fetch(faucetAddress + "/api/v1/createAccount", {
                method: "post",
                mode: "cors",
                headers: {
                    "Accept": "application/json",
                    "Content-type": "application/json"
                },
                body: JSON.stringify({
                    "account": {
                        "owner_key": keys.owner_private.toPublicKey().toPublicKeyString(),
                        "active_key": keys.active_private.toPublicKey().toPublicKeyString(),
                        "secondary_key": keys.secondary_private.toPublicKey().toPublicKeyString(),
                        "memo_key": keys.memo_private.toPublicKey().toPublicKeyString()
                    }
                })
            }).then(r => r.json());

            return create_account_promise.then(result => {
                if (result.code != 0) {
                    //throw new Error(result.msg);
                    return Promise.reject({message: result.msg});
                }

                // let uidStr = result.data[0].trx.operations[0][1].uid + "";
                let uidStr = result.data + '';
                return saveWallet(uidStr);
            }).catch(error => {
                //throw error;
                return Promise.reject(error);
            });
        });
    }

    setBackupDate() {
        CachedSettingActions.set("backup_recommended", false);
        return true;
    }

    /**
     * 恢复钱包
     * @param wallet_name 钱包名
     * @param wallet_object 钱包对象
     * @returns {{wallet_name: string, wallet_object: *}}
     */
    restore(wallet_name = "default", wallet_object) {
        wallet_name = wallet_name.toLowerCase();
        return (dispatch) => {
            return new Promise(resolve => {
                dispatch({wallet_name, wallet_object, resolve});
            });
        };
    }

    /**
     * 用owner重置用户授权（可以用作重建账户）
     * @param uid 账号id
     * @param owner_key 备份的账号私钥
     * @param account_pwd 账号密码
     * @param short_pwd 短密码
     * @return {function(*)}
     */
    resetAccount(uid, owner_key, account_pwd, short_pwd) {
        return (dispatch) => {
            return new Promise((resolve, reject) => {
                dispatch({uid, owner_key, account_pwd, short_pwd, resolve, reject});
            });
        };
    }

    /**
     * 切换账号
     * @param uid 账号字符串
     * @return {function(*)}
     */
    changeAccount(uid) {
        return (dispatch) => {
            return new Promise((resolve, reject) => {
                dispatch({uid, resolve, reject});
            });
        };
    }

    /**
     * 根据当前账号生成账号二维码
     */
    generateQRcode(){
        return dispatch => {
            return new Promise((resolve, reject) => {
               dispatch({resolve, reject}); 
            });
        }
    }
    checkAccountValid(uid, memo_key){
        return dispatch => {
            return new Promise((resolve, reject) => {
                dispatch({uid, memo_key, resolve, reject});
            });
        }
    }
}

export default alt.createActions(WalletActions);