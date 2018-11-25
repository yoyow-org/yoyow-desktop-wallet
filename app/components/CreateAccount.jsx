
import React from "react";
import BaseComponent from "./BaseComponent";
import {connect} from "alt-react";
import {Link} from "react-router"
import ConfirmActions from "../actions/layout/ConfirmActions";
import AccountActions from "../actions/AccountActions";
import PrivateKeyActions from "../actions/PrivateKeyActions";
import WalletStore from "../stores/WalletStore";

import TextLoading from "./Layout/TextLoading";
import AccountStore from "../stores/AccountStore";
import AuthorizeServiceStore from "../stores/AuthorizeServiceStore";
import InputPwd from "./form/InputPwd"

import ico_ok from "../assets/img/ico_ok.png";
import Validation from "../utils/Validation";
import NotificationActions from "../actions/NotificationActions";
//import logo_1 from "../assets/img/logo_1.png";

class CreateAccount extends BaseComponent {

    constructor() {
        super();
        this.state = {
            step: 0,
            loading: false,
            error: null,
            wrong: null,
            pwd: null,
            confirmPwd: null,
            backed: false,
            isAuth: false, //是否为授权情况
            checkAuth: true, //检查授权状态
            checkAuthMsg: '', //授权异常消息
        }
        this.timeOut = null;
        this.__createAccount = this.__createAccount.bind(this);
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

    onPwdChange(e) {
        let pwd = e.target.value;
        if (pwd.length < 12) {
            this.setState({wrong: this.translate("password.wrong_length"), pwd: null});
        } else {
            this.setState({wrong: null, pwd: pwd});
        }
    }

    onConfirmPwdChange(e) {
        let cpwd = e.target.value;
        if (this.state.pwd == null) return;
        if (cpwd != this.state.pwd) {
            this.setState({wrong: this.translate("password.wrong_confirm")});
        } else {
            this.setState({wrong: null});
        }
    }

    __createAccount() {
        AccountActions.createAccount(this.state.pwd).then((newAcc) => {
            if (newAcc != undefined && newAcc != null) {
                clearTimeout(this.timeOut);
                //this.setState({step: 1, uid: newAcc.uid, owner: newAcc.owner, loading: false});
                this.setState({step: 1, loading: false});
                PrivateKeyActions.cleanKey();
                PrivateKeyActions.loadDbData();
            }
        }).catch(err => {
            this.setState({error: err.message, loading: false});
            clearTimeout(this.timeOut);
        });
    }

    onCreate(e) {
        e.preventDefault();
        if (!this.isValid()) return;
        this.setState({loading: true});
        this.timeOut = setTimeout(this.__createAccount, 100);
    }

    onBackedCheck(e) {
        this.setState({backed: e.target.checked});
    }

    onEnter(e) {
        let {isAuth, checkAuth, checkAuthMsg, pwd} = this.state;

        if(isAuth && checkAuth ){
            let {uid, secondary_private} = this.props;
            WalletStore.validatePassword(pwd, false, true)
            AuthorizeServiceStore.doAuth(uid, WalletStore.getWallet().encrypted_active.pubkey).then(url => {
                if(url){
                    window.top.location = url;
                }else{
                    this.setState({error: this.translate("authorize_service.invalid_state")});  
                }
            }).catch(e => {
                NotificationActions.error(e.message);
            });
        }
        else{
            this.routerPush("/balance");
        }
    }

    render() {
        let {step, loading, backed, isAuth, checkAuth} = this.state;
        let content = null;
        if (step == 0) {
            content = (
                <div className="white-box">
                    <h2>
                        {
                            isAuth ? this.translate("create_account.title_register_with_auth") : this.translate("create_account.title_register")
                        }
                    </h2>
                    <hr/>
                    <InputPwd className="input-reg-pwd-400" placeholder={this.translate("create_account.ph_pwd")} name="password" ref="pwd"
                              onChange={this.onPwdChange.bind(this)}/>
                    <br/>
                    <InputPwd className="input-reg-pwd-400" placeholder={this.translate("create_account.ph_pwd_confirm")} name="ConfirmPwd" ref="confirmPwd"
                              onChange={this.onConfirmPwdChange.bind(this)} style={{marginTop: "20px"}}/>
                    <div style={{height: "30px", paddingTop: "10px"}}>
                        {this.state.wrong != null ?
                            <div className="wrong-box" style={{marginTop: "0px", marginBottom: "6px"}}>
                                <span className="wrong-text">{this.state.wrong}</span>
                            </div> : null
                        }
                        {this.state.error != null ?
                            <div className="wrong-box " style={{marginTop: "0px", marginBottom: "0px"}}>
                                <span className="error-text">{this.state.error}</span>
                            </div> : null}
                    </div>
                    <div className="wrong-box" style={{marginTop: "10px"}}>
                        <p>{this.translate("create_account.note")}</p>
                        <p>{this.translate("create_account.note_msg")}</p>
                    </div>
                    <div style={{marginTop: "40px"}}>
                        {
                            loading ? <TextLoading/> :
                                <input className="blue-button-400" type="button" 
                                disabled={loading || (isAuth && !checkAuth)} 
                                value={isAuth ? this.translate("create_account.create_with_auth") : this.translate("create_account.create")}
                                       onClick={this.onCreate.bind(this)}/>
                        }
                    </div>
                    { isAuth ? null : <Link className="text-link" to="/import-file" style={{marginTop: "12px"}}>{this.translate("create_account.import_file")}</Link>}
                    { isAuth ? null : <Link className="text-link" to="/restore-account" style={{marginTop: "12px"}}>{this.translate("create_account.restore_key")}</Link>}
                    
                </div>
            );
        } else if (step == 1) {
            content = (
                <div className="white-box">
                    <h2><img src={ico_ok}/>{this.translate("create_account.register_success")}</h2>
                    <hr/>
                    <div className="form">
                        <p>{this.translate("create_account.yoyow_id")}</p>
                        <p className="account-id">{this.props.uid}</p>
                        <p>{this.translate("create_account.account_key")}</p>
                        <p className="account-owner">{this.props.owner}</p>
                    </div>
                    <div className="wrong-box">
                        <p>{this.translate("create_account.prompt_p1")}</p>
                        <p>{this.translate("create_account.prompt_p2")}</p>
                    </div>
                    <div className="wrong-box">
                        <label className="check-label">
                            <input type="checkbox" checked={backed} onClick={this.onBackedCheck.bind(this)}/>{this.translate("create_account.backed_up")}</label>
                    </div>
                    <input className="blue-button-400" type="button" disabled={!backed}
                           onClick={this.onEnter.bind(this)} value={isAuth ? this.translate("create_account.complete_with_jump") : this.translate("create_account.complete")}/>
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

export default connect(CreateAccount, {
    listenTo() {
        return [AccountStore];
    },
    getProps() {
        return AccountStore.getState();
    }
});
 