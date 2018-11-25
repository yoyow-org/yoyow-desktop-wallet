
import Utils from "../utils/Utils";
import React from "react";
import BaseComponent from "./BaseComponent";
import {AccountUtils, PrivateKey} from "yoyowjs-lib";
import WalletActions from "../actions/WalletActions";
import TextLoading from "./Layout/TextLoading";
import {connect} from "alt-react";
import WalletStore from "../stores/WalletStore";
import InputPwd from "./form/InputPwd"
import Translate from "react-translate-component";
import AuthorizeServiceStore from "../stores/AuthorizeServiceStore";
import Validation from "../utils/Validation";
import ico_ok from "../assets/img/ico_ok.png";
import AccountStore from "../stores/AccountStore";
import NotificationActions from "../actions/NotificationActions";
//import logo_1 from "../assets/img/logo_1.png";

class RestoreAccount extends BaseComponent {
    constructor(props) {
        super(props);
        this.state = this.__getInitState();
        this.timeOut = null;
    }

    __getInitState() {
        return {
            step: 0,
            loading: false,
            error: null,
            wrong: null,
            pwd: null,
            confirmPwd: null,
            uid: null,
            owner: null,
            backed: false,
            isAuth: false, //是否为授权情况
            checkAuth: true, //检查授权状态
            checkAuthMsg: '', //授权异常消息
        };
    }
    componentWillMount(){
        let qObj = this.props.location.query;
        if(!Validation.isEmptyObject(qObj)){
            let {platform, sign, state, which, time, redirect} = qObj;
            this.setState({isAuth: true});
            let checkPromise = new Promise((resolve, reject) => {
                AuthorizeServiceStore.checkPlatform(platform, which, state, redirect).then(p => {
                    AuthorizeServiceStore.checkSign("" + p.owner.uid, time, sign).then(() => {
                        resolve();
                    }).catch(err => {
                        reject(err);
                    });
                }).catch(err => {
                    reject(err);
                })
            });
            Promise.all([checkPromise]).then(() => {})
                .catch(err => {
                    this.setState({wrong: err, checkAuth: false, checkAuthMsg: err});
                });

        }

    }
    __resetAccount(owner_key) {
        let tmp = Utils.decodeBackOwner(owner_key);
        let error_key_invalid = this.translate("restore_account.error_key_invalid");
        if (tmp == null) {
            this.setState({error: error_key_invalid, loading: false});
            clearTimeout(this.timeOut);
            return;
        }
        let {uid, owner} = tmp;
        if (!AccountUtils.validAccountUID(uid)) {
            this.setState({error: error_key_invalid, loading: false});
            clearTimeout(this.timeOut);
            return;
        }
        let privateKey = null;
        try {
            privateKey = PrivateKey.fromWif(owner);
        } catch (err) {
            this.setState({error: err.message, loading: false});
            clearTimeout(this.timeOut);
            return;
        }
        WalletActions.resetAccount(uid, privateKey, this.state.pwd, this.state.pwd).then(() => {
            clearTimeout(this.timeOut);
            this.setState({uid: uid.toString(), owner: owner_key, step: 1});
        }).catch(err => {
            clearTimeout(this.timeOut);
            this.setState({error: err ? err.message : this.translate("error.unknown_error"), loading: false});
        });
    }

    isValid() {
        if (this.state.pwd == null) {
            this.setState({wrong: this.translate("password.wrong_length")});
            return false;
        }
        if (this.refs.confirmPwd.refs.pwd.value != this.state.pwd) {
            this.setState({wrong: this.translate("password.wrong_confirm")});
            return false;
        }
        return this.state.error == null && this.state.wrong == null;
    }

    onInputChange(e) {
        e.preventDefault();
        if (this.state.error != null) {
            this.setState({error: null});
        }
    }

    onPwdChange(e) {
        e.preventDefault();
        let pwd = e.target.value;
        if (pwd.length < 12) {
            this.setState({wrong: this.translate("password.wrong_length"), pwd: null});
        } else {
            this.setState({wrong: null, pwd: pwd});
        }
    }

    onConfirmPwdChange(e) {
        e.preventDefault();
        let cpwd = e.target.value;
        if (this.state.pwd == null) return;
        if (cpwd != this.state.pwd) {
            this.setState({wrong: this.translate("password.wrong_confirm")});
        } else {
            this.setState({wrong: null});
        }
    }

    onBackedCheck(e) {
        this.setState({backed: e.target.checked});
    }

    onEnter() {
        let {isAuth, checkAuth, checkAuthMsg, pwd} = this.state;
        if(isAuth && checkAuth){
            WalletStore.validatePassword(pwd, false, true);
            let wallet = WalletStore.getWallet();
            AuthorizeServiceStore.doAuth(wallet.yoyow_id, wallet.encrypted_active.pubkey).then(url => {
                if(url){
                    window.top.location = url;
                }else{
                    this.setState({error: this.translate("authorize_service.invalid_state")});  
                }
            }).catch(e => {
                NotificationActions.error(e.message);
            });
        }else{
            this.routerPush("/balance");
        }
    }

    onRestore(e) {
        e.preventDefault();
        if (!this.isValid()) return;
        this.setState({loading: true});
        let owner_key = this.refs.ownerkey.value;
        let _this = this;
        let {isAuth, checkAuth, checkAuthMsg} = this.state;
        this.timeOut = setTimeout(() => {
            if(isAuth){
                if(!checkAuth){
                    this.setState({wrong: checkAuthMsg});
                    this.setState({loading: false});
                }else{
                    this.__resetAccount(owner_key)
                }
            }else{
                this.__resetAccount(owner_key);
            }
        }, 100);
    }

    render() {
        let {step, loading, backed, isAuth, checkAuth} = this.state;
        let content = null;
        if (step == 0) {
            content = (
                <div className="white-box">
                    <h2 className="tit-restore">
                        {!isAuth?this.translate("restore_account.title"):this.translate("restore_account.restore_key_with_auth")}
                    </h2>
                    <hr/>
                    <div className="layer-restore"><Translate unsafe content="restore_account.new_pwd" component="span" /><InputPwd className="input-icon-pwd-330"
                                                                                         placeholder={this.translate("password.ph_enter_new_pwd")}
                                                                                         name="password" ref="pwd"
                                                                                         onChange={this.onPwdChange.bind(this)}/>
                    </div>
                    <div className="layer-restore"><span>{this.translate("restore_account.confirm_pwd")}</span><InputPwd className="input-icon-pwd-330"
                                                                              placeholder={this.translate("password.ph_enter_new_pwd_confirm")} name="ConfirmPwd"
                                                                              ref="confirmPwd"
                                                                              onChange={this.onConfirmPwdChange.bind(this)}/>
                    </div>
                    <div className="layer-restore"><span>{this.translate("restore_account.account_key")}</span><input className="input-330" type="text"
                                                                           placeholder={this.translate("restore_account.ph_enter_key")} ref="ownerkey"
                                                                           onChange={this.onInputChange.bind(this)}/>
                    </div>
                    <div style={{height: "30px", paddingTop: "10px"}}>
                        {this.state.wrong != null ?
                            <div className="wrong-box" style={{marginTop: "0px", marginBottom: "6px"}}>
                                <span
                                    className="wrong-text">&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;&nbsp; &nbsp; &nbsp; &nbsp; &nbsp;
                                    {this.state.wrong}</span>
                            </div> : null
                        }
                        {this.state.error != null ?
                            <div className="wrong-box " style={{marginTop: "0px", marginBottom: "0px"}}>
                                <span
                                    className="error-text">&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;&nbsp; &nbsp; &nbsp; &nbsp; &nbsp;
                                    {this.state.error}</span>
                            </div> : null}
                    </div>
                    {
                        loading ? <TextLoading/> :
                            <div className="layer-restore"><input className="button-400" type="button"
                                                                  disabled={loading || (isAuth && !checkAuth)} value={!isAuth?this.translate("button.ok"):this.translate("restore_account.complete_and_back")}
                                                                  onClick={this.onRestore.bind(this)}/></div>
                    }


                </div>
            );
        } else if (step == 1) {
            content = (
                <div className="white-box">
                    <h2><img src={ico_ok}/>{this.translate("restore_account.restore_ok")}</h2>
                    <hr/>
                    <div className="form">
                        <p>{this.translate("create_account.yoyow_id")}</p>
                        <p className="account-id">{this.state.uid}</p>
                        <p>{this.translate("create_account.account_key")}</p>
                        <p className="account-owner">{this.state.owner}</p>
                    </div>
                    <div className="wrong-box">
                        <p>{this.translate("restore_account.prompt_p1")}</p>
                        <p>{this.translate("restore_account.prompt_p2")}</p>
                        <p>{this.translate("restore_account.prompt_p3")}</p>
                    </div>
                    <div className="wrong-box">
                        <label className="check-label">
                            <input type="checkbox" checked={backed} onClick={this.onBackedCheck.bind(this)}/>{this.translate("create_account.backed_up")}
                        </label>
                    </div>
                    <input className="blue-button-400" type="button" disabled={!backed}
                           onClick={this.onEnter.bind(this)} value={!isAuth?this.translate("create_account.complete"):this.translate("restore_account.complete_and_back")}/>
                </div>
            );
        }
        return (
            <div className="page">
                <div></div>
                {content}
            </div>
        );
    }
}

export default connect(RestoreAccount, {
    listenTo() {
        return [WalletStore,AccountStore];
    },
    getProps() {
        return [WalletStore.getState(),AccountStore.getState()];
    }
});
 