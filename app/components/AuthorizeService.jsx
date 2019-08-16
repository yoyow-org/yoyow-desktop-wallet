
import React from "react";
import BaseComponent from "./BaseComponent";
import {connect} from "alt-react";
import {Link} from "react-router";
import Modal from "components/Layout/Modal";
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
        this.state = {
            error: null, 
            loading: true, 
            platform: 0,
            platformOwner: 0, 
            permissionFlag: 0,
            maxLimit: 1000,
            showConfirmModal: false, 
            popupWindowWidth: 450, 
            popupWindowHeight: 647
        };
    }

    onSelectAccount(item) {
        WalletActions.changeAccount(item);
    }

    componentWillMount() {
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
            let extraData = JSON.parse(p.extra_data);
            this.setState({platform: p.name, platformOwner: p.owner.uid, logo: extraData.image});

            AuthorizeServiceStore.checkSign("" + p.owner.uid, time, sign).then(() => {
                this.setState({loading: false})
            }).catch((err) => {
                this.setState({error: err, loading: false});
            });
        }).catch((err) => {
            this.setState({error: err, loading: false});
        });
    }

    onConfirm(){
        let uid = this.props.wallet.yoyow_id;
        let platform = this.state.platformOwner;
        AuthorizeServiceStore.checkAccountPlatformAuth( uid, platform, 1 ).then( authObj => {
            if ( authObj.length > 0 ){
                let authInfo = authObj[0];
                if( authInfo.is_active == true ){
                    let maxLimit = ( ( authInfo.permission_flags >> 5 ) & 1 ) == 0 ? this.state.maxLimit : authInfo.max_limit / global.walletConfig.retain_count;
                    this.setState({ permissionFlag: authInfo.permission_flags, maxLimit: maxLimit });
                }
            }else{
                this.setState({ permissionFlag: 223 });
            }
            this.setState({ showConfirmModal: true });
        }).catch( err => {
            this.setState({error: err, loading: false});
        })
    }

    onAuth(e) {
        e.preventDefault();
        let _this = this;
        let permissionFlag = this.state.permissionFlag;
        let maxLimit = ( ( permissionFlag >> 5 ) & 1 ) == 0 ? 0 : this.state.maxLimit;
        WalletUnlockActions.unlock(false).then(() => {
            _this.setState({loading: true});
            setTimeout(() => {
                let wallet = WalletStore.getWallet();
                AuthorizeServiceStore.doAuth(wallet.yoyow_id, permissionFlag, maxLimit, wallet.encrypted_active.pubkey).then(url => {
                    if(url){
                        window.top.location = url;     
                    }else{
                        _this.setState({loading: false, showConfirmModal: false, error: _this.translate("authorize_service.invalid_state")});
                    }
                }).catch(e => {
                    _this.setState({loading: false});
                    NotificationActions.error(e.message);
                })
            }, 300);
        });
    }

    _getPermissionOption(){
        let permissionFlag = this.state.permissionFlag;
        let options = {
            forward:    permissionFlag & 1,
            score:      ( permissionFlag >> 1 ) & 1,
            buyout:     ( permissionFlag >> 2 ) & 1,
            comment:    ( permissionFlag >> 3 ) & 1,
            reward:     ( permissionFlag >> 4 ) & 1,
            transfer:   ( permissionFlag >> 5 ) & 1,
            post:       ( permissionFlag >> 6 ) & 1,
            update:     ( permissionFlag >> 7 ) & 1
        }
        return options;
    }

    _calPermisionFlag( options ){
        return  options.forward + 
                ( options.score    <<  1 ) +
                ( options.buyout   <<  2 ) + 
                ( options.comment  <<  3 ) + 
                ( options.reward   <<  4 ) + 
                ( options.transfer <<  5 ) + 
                ( options.post     <<  6 ) + 
                ( options.update   <<  7 );
    }

    onSwitchPermissionOption( option ){
        let options = this._getPermissionOption()
        for(let key in options){
            if ( key == String( option ) ){
                options[key] = !options[key];
                break;
            }
        }
        let permissionFlag = this._calPermisionFlag(options);
        this.setState({permissionFlag: permissionFlag});
    }

    handleMaxLimitChange( e ){
        e.preventDefault();
        let limit = parseInt( e.target.value == '' ? 0 : e.target.value );
        limit = ( limit < 0 ? 0 : ( limit > 1000 ? 1000 : limit ) );
        this.setState({ maxLimit: limit });
    }

    close(){
        this.setState({showConfirmModal: false, loading: false});
    }

    render() {

        let {error, loading, platform, urlHash, showConfirmModal, popupWindowWidth, popupWindowHeight, logo} = this.state;
        let {accountList, wallet, shortLocked, locked} = this.props;
        let hashAccount = !(wallet && wallet.yoyow_id && error == null);

        let options = this._getPermissionOption();
        
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
                        <input className="blue-button-400" type="button" disabled={hashAccount}
                                   onClick={this.onConfirm.bind(this)} value={this.translate("authorize_service.auth")}
                            />
                    </div>
                    <Link className="text-link" to={`/import-file${urlHash}`}
                          style={{marginTop: "12px"}}>{this.translate("restore_account.import_file_with_auth")}</Link>
                    <Link className="text-link" to={`/restore-account${urlHash}`}
                          style={{marginTop: "12px"}}>{this.translate("restore_account.restore_key_with_auth")}</Link>
                </div>
                <div className="popup-window">
                    <Modal visible={showConfirmModal}  height={popupWindowHeight} width={popupWindowWidth} onClose={this.close.bind(this)} customStyles={{"top": "10%", "paddingBottom": "20px"}}> 
                        <div className="title auth_title">
                            <img className="logo" src={logo}/>
                            <lable className="lable">{this.translate("authorize_service.platform_tip")}
                                <span className="platform">{platform}</span>
                            {this.translate("authorize_service.auth_tip")}</lable>
                        </div>
                        <div className="body auth_body">
                            <div className="auth_list">
                                <lable>{this.translate("authorize_service.auth_options")}</lable>
                                <div className="auth_item">
                                    <lable>{this.translate("authorize_service.auth_option_transfer")}</lable>
                                    <input type="checkbox" id='tipping' checked={options.transfer == 1}></input>
                                    <label className="switch" htmlFor='tipping' onClick={this.onSwitchPermissionOption.bind(this, 'transfer')}></label>
                                </div>
                                <div className="tipping_amount" style={{display: options.transfer == 1 ? 'flex' : 'none'}}>
                                    <lable>{this.translate("authorize_service.auth_option_transfer_limit")}</lable>
                                    <input autoComplete="off" value={this.state.maxLimit} onChange={this.handleMaxLimitChange.bind(this)}></input>
                                    <lable>YOYO</lable>
                                </div>
                                <div className="auth_item">
                                    <lable>{this.translate("authorize_service.auth_option_forward")}</lable>
                                    <input type="checkbox" id='allow_forward' checked={options.forward == 1}></input>
                                    <label className="switch" htmlFor='allow_forward' onClick={this.onSwitchPermissionOption.bind(this, 'forward')}></label>
                                </div>
                                <div className="auth_item">
                                    <lable>{this.translate("authorize_service.auth_option_score")}</lable>
                                    <input type="checkbox" id='allow_score' checked={options.score == 1}></input>
                                    <label className="switch" htmlFor='allow_score' onClick={this.onSwitchPermissionOption.bind(this, 'score')}></label>
                                </div>
                                <div className="auth_item">
                                    <lable>{this.translate("authorize_service.auth_option_buyout")}</lable>
                                    <input type="checkbox" id='allow_buyout' checked={options.buyout == 1}></input>
                                    <label className="switch" htmlFor='allow_buyout' onClick={this.onSwitchPermissionOption.bind(this, 'buyout')}></label>
                                </div>
                                <div className="auth_item">
                                    <lable>{this.translate("authorize_service.auth_option_comment")}</lable>
                                    <input type="checkbox" id='allow_comment' checked={options.comment == 1}></input>
                                    <label className="switch" htmlFor='allow_comment' onClick={this.onSwitchPermissionOption.bind(this, 'comment')}></label>
                                </div>
                                <div className="auth_item">
                                    <lable>{this.translate("authorize_service.auth_option_reward")}</lable>
                                    <input type="checkbox" id='allow_reward' checked={options.reward == 1}></input>
                                    <label className="switch" htmlFor='allow_reward' onClick={this.onSwitchPermissionOption.bind(this, 'reward')}></label>
                                </div>
                                <div className="auth_item">
                                    <lable>{this.translate("authorize_service.auth_option_post")}</lable>
                                    <input type="checkbox" id='allow_post' checked={options.post == 1}></input>
                                    <label className="switch" htmlFor='allow_post' onClick={this.onSwitchPermissionOption.bind(this, 'post')}></label>
                                </div>
                                <div className="auth_item">
                                    <lable>{this.translate("authorize_service.auth_option_update")}</lable>
                                    <input type="checkbox" id='allow_update' checked={options.update == 1}></input>
                                    <label className="switch" htmlFor='allow_update' onClick={this.onSwitchPermissionOption.bind(this, 'update')}></label>
                                </div>
                            </div>
                        </div>
                        <div className="auth_buttons">
                            {loading ? <TextLoading/> : 
                                    <input className="button" disabled={this.state.permissionFlag == 0} type="button" onClick={this.onAuth.bind(this)} value={this.translate("authorize_service.agree_to_authorize")}/> }
                        </div>
                    </Modal>
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