
import React from "react";
import BaseComponent from "./BaseComponent";
import {connect} from "alt-react";
import {Link} from "react-router"
import WalletStore from "../stores/WalletStore";
import WalletUnlockStore from "../stores/WalletUnlockStore";
import AuthorizeServiceStore from "../stores/AuthorizeServiceStore";
import AccountSelect from "./form/AccountSelect";
import Validation from "../utils/Validation";
import TextLoading from "./Layout/TextLoading";

import NotificationActions from "../actions/NotificationActions";
import WalletUnlockActions from "../actions/WalletUnlockActions";
import WalletActions from "../actions/WalletActions";

//import logo_1 from "../assets/img/logo_1.png";

import {
    PrivateKey,
    PublicKey,
    ChainStore,
    AccountUtils,
    Signature
} from "yoyowjs-lib";

class AuthorizeService extends BaseComponent {
    constructor(props) {
        super(props);
        this.state = {error: null, loading: true, platform: 0};
    }

    onSelectAccount(item) {
        WalletActions.changeAccount(item);
    }

    componentWillMount() {
        // console.log("this.props.location", this.props.location)
        let urlHash = window.location.hash;
        urlHash = urlHash.substring(urlHash.indexOf('?'));
        this.setState({urlHash: urlHash});
        let location = this.props.location;
        let {platform, sign, state, which, time, redirect} = location.query;
        if (Validation.isEmpty(platform) || Validation.isEmpty(sign) || Validation.isEmpty(time)) {
            this.setState({error: this.translate("authorize_service.invalid"), loading: false});
            return;
        }
        if (Validation.isEmpty(which)) which = "Login";
        AuthorizeServiceStore.checkPlatform(platform, which, state, redirect).then((p) => {
            this.setState({platform: p.name})
            AuthorizeServiceStore.checkSign("" + p.owner.uid, time, sign).then(() => {
                this.setState({loading: false})
            }).catch((err) => {
                this.setState({error: err, loading: false});
            });
        }).catch((err) => {
            this.setState({error: err, loading: false});
        });
    }

    onAuth(e) {
        e.preventDefault();
        let _this = this;
        WalletUnlockActions.unlock(false).then(() => {
            _this.setState({loading: true});
            setTimeout(() => {
                let wallet = WalletStore.getWallet();
                AuthorizeServiceStore.doAuth(wallet.yoyow_id, wallet.encrypted_active.pubkey).then(url => {
                    _this.setState({loading: false});
                    if(url){
                        window.top.location = url;     
                    }else{
                        _this.setState({error: _this.translate("authorize_service.invalid_state")});
                    }
                }).catch(e => {
                    _this.setState({loading: false});
                    NotificationActions.error(e.message);
                })
            }, 300);
        });
    }

    render() {

        let {error, loading, platform, urlHash} = this.state;
        //let {platform} = this.props.ass;
        let {accountList, wallet, shortLocked, locked} = this.props;
        let hashAccount = !(wallet && wallet.yoyow_id && error == null);
        return (
            <div className="page">
                <div></div>
                <div className="white-box">
                    <h2>{this.translate("authorize_service.title")}</h2>
                    <hr/>
                    <div className="form">
                        <p>{this.translate("authorize_service.platform")}</p>
                        <p className="account-id">{platform}</p>
                        <p>{this.translate("authorize_service.yoyow_id")}</p>
                        <div className="account-owner"
                             style={{textAlign: "center", backgroundColor: "#3d4f60", marginBottom: "0px"}}>
                            {wallet && wallet.yoyow_id ?
                                <AccountSelect onChange={this.onSelectAccount.bind(this)}
                                accountList={accountList.toArray()}
                                currentUid={wallet.yoyow_id}
                                /> :
                                <input className="blue-button-400" type="button" onClick={() => {
                                    this.routerPush(`/create-account${urlHash}`)
                                }}
                                       value={this.translate("create_account.create")}
                                />
                            }
                        </div>
                    </div>
                    <div style={{height: "30px", lineHeight: "30px"}}>
                        {error != null ?
                            <div className="wrong-box " style={{marginTop: "0px", marginBottom: "0px"}}>
                                <span className="error-text">{error}</span>
                            </div> : null}
                    </div>
                    <div className="wrong-box" style={{marginTop: "0px", marginBottom: "10px"}}>
                        <p>{this.translate("create_account.note")}</p>
                        <p>{this.translate("authorize_service.note_msg", {platform: platform})}</p>
                    </div>
                    <div style={{marginTop: "0px"}}>
                        {loading ? <TextLoading/> :
                            <input className="blue-button-400" type="button" disabled={hashAccount}
                                   onClick={this.onAuth.bind(this)} value={this.translate("authorize_service.auth")}
                            />
                        }
                    </div>
                    <Link className="text-link" to={`/import-file${urlHash}`}
                          style={{marginTop: "12px"}}>{this.translate("restore_account.import_file_with_auth")}</Link>
                    <Link className="text-link" to={`/restore-account${urlHash}`}
                          style={{marginTop: "12px"}}>{this.translate("restore_account.restore_key_with_auth")}</Link>
                    {/*
                        <input className="blue-button-400" type="button" onClick={this.onTest.bind(this)}
                               value="TEST"
                        />
                    */}
                </div>
            </div>
        );
    }
}

export default connect(AuthorizeService, {
    listenTo() {
        return [WalletStore, WalletUnlockStore, AuthorizeServiceStore];
    },
    getProps() {
        return {
            accountList: WalletStore.getState().accountList,
            wallet: WalletStore.getState().wallet,
            locked: WalletUnlockStore.getState().locked,
            shortLocked: WalletUnlockStore.getState().shortLocked,
            ass: AuthorizeServiceStore.getState()
        };
    }
});