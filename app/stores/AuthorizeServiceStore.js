
import alt from "../altInstance";
import BaseStore from "./BaseStore";
import counterpart from "counterpart";
import {
    Aes,
    PrivateKey,
    PublicKey,
    ChainStore,
    AccountUtils,
    Signature
} from "yoyowjs-lib";
import Validation from "../utils/Validation";
import WalletStore from "./WalletStore";
import FetchApi from "../api/FetchApi";
import ChainApi from "../api/ChainApi";

class AuthorizeServiceStore extends BaseStore {
    constructor() {
        super();
        this.state = this.__getInitialState();
        this._export("checkPlatform", "checkSign", "doAuth");
    }

    __getInitialState() {
        return {
            platform: 0,        //平台ID
            state: null,        //平台页面状态(url)，用于回跳转
            which: null,        //平台请求授权功能(Login,Secondary),目前只有Login
            redirect: null      //平台服务器接收钱包请求的uri
        };
    }

    /**
     * 生成授权请求
     * 修改 新增参数password
     * 直接登录授权方式，传secondary_pubkey
     * @param yoyow_id YOYOW号id
     * @param secondary_pubkey 零钱公钥，用于浏览器存在账号情况下，以密码解锁后使用
     * @param password 密码，用于创建账号，私钥恢复，备份文件恢复 时使用
     * @return {*}
     * 2018-02-25 
     * 更改用户使用资金密钥签名，因为上链修改secondray授权需要active权限
     * 
     */
    doAuth(yoyow_id, active_pubkey) {
        let sObj = {
            yoyow: "" + yoyow_id,
            time: "" + (new Date()).getTime()
        };
        let active_priKey = WalletStore.getPrivateKey(active_pubkey);
        if(active_priKey == null) return Promise.reject({message: counterpart.translate("authorize_service.invalid_key")});
        let signed = Signature.signBuffer(new Buffer(JSON.stringify(sObj)), active_priKey);
        let query = `yoyow=${sObj.yoyow}&time=${sObj.time}&sign=${signed.toHex()}`;
        let {platform, state, redirect} = this.state;
        let hasRedirect = Validation.isEmpty(redirect) == false;
        let finalUrl = null;
        if (hasRedirect) {
            finalUrl = (redirect + (redirect.indexOf('?') > 0 ? "&" : "?") + query + `&state=${state}`);
        }
        if (!Validation.isEmpty(state)) {
            if(state.lastIndexOf('/') == (state.length - 1) && state.lastIndexOf('#') != (state.length - 2))
                state = state.substring(0, state.length - 1);

            state += state.indexOf('?') > 0 ? '&' : '?' + query;
            if(!finalUrl) finalUrl = state;
        }
        
        return ChainApi.updateAuthority(yoyow_id, platform, active_priKey).then(res => {
            return finalUrl;
        }).catch(e => {
            return Promise.reject(e);
        });
    }

    /**
     * 检查平台请求
     * @param platform 平台id
     * @param which 平台请求的授权方式
     * @param state 平台页面状态，用于回跳转
     * @param redirect 平台服务器接收钱包请求的uri
     * @return {Promise}
     */
    checkPlatform(platform, which, state, redirect = null) {
        return new Promise((resolve, reject) => {
            FetchApi.get("platform/getByPid", {pid: platform}).then((res) => {
                this.setState({platform, which, state, redirect});
                resolve(res.data);
            }).catch(() => {
                reject(counterpart.translate("authorize_service.invalid"));
            });
        });
    }

    /**
     * 效验平台签名
     * @param platform 平台id
     * @param time 时间戳
     * @param sign 签名
     */
    checkSign(platform, time, sign) {
        return new Promise((resolve, reject) => {
            ChainStore.fetchAccountByUid(platform).then(uObj => {
                //.log("fetchAccountByUid.............")
                if (uObj.secondary && uObj.secondary.key_auths && uObj.secondary.key_auths.length > 0) {
                    let secondary = uObj.secondary.key_auths[0][0];
                    //console.log("secondary.............",secondary)
                    if (secondary == null) {
                        reject(counterpart.translate("authorize_service.invalid"));
                        return;
                    }
                    //验证是否过期
                    let cur = (new Date()).getTime();
                    let req = (new Date(parseInt(time))).getTime();
                    if (cur - req > 2 * 60 * 1000) {//请求时间与当前时间相关2分钟被视为过期
                        reject(counterpart.translate("authorize_service.expired"));
                        return;
                    }
                    //验证签名
                    let pars = JSON.stringify({platform, time});
                    //console.log("pars.......", pars, sign)
                    let ePkey = PublicKey.fromPublicKeyString(secondary);
                    let verify = Signature.fromHex(sign).verifyBuffer(new Buffer(pars), ePkey);
                    //console.log("verify.......", verify)
                    if (!verify) {
                        reject(counterpart.translate("authorize_service.invalid_sign"));
                        return;
                    }
                    resolve();
                } else {
                    reject(counterpart.translate("authorize_service.invalid"));
                }
            });
        });
    }
}

export default alt.createStore(AuthorizeServiceStore, "AuthorizeServiceStore");