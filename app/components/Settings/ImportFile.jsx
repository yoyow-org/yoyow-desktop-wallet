import React from "react";
import BaseComponent from "../BaseComponent";
import BackupActions, {decryptAccountBackup} from "../../actions/BackupActions";
import BackupStore from "../../stores/BackupStore";
import {connect} from "alt-react";
import WalletStore from "../../stores/WalletStore";
import {PrivateKey} from "yoyowjs-lib";
import NotificationActions from "../../actions/NotificationActions";
import WalletActions from "../../actions/WalletActions";
import InputPwd from "../form/InputPwd";
import AuthorizeServiceStore from "../../stores/AuthorizeServiceStore";
import Validation from "../../utils/Validation";
import WalletUnlockActions from "../../actions/WalletUnlockActions";
import WalletUnlockStore from "../../stores/WalletUnlockStore";
import TextLoading from "../Layout/TextLoading";
//import logo_1 from "../../assets/img/logo_1.png";

class ImportFile extends BaseComponent {
    constructor(props) {
        super(props)
        this.state = {
            isAuth: false, //是否为授权情况
            checkAuth: true, //检查授权状态
            checkAuthMsg: '', //授权异常消息
            loading: false
        }
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
    onSelectClick(e) {
        let file = this.refs.file;
        file.click();
    }

    onFileUpload(e) {
        let fileName = this.refs.file.value.substring(this.refs.file.value.lastIndexOf('\\') + 1);
        this.refs.text.value = fileName;
        let file = e.target.files[0];
        BackupActions.incommingWebFile(file);
        this.forceUpdate();
    }

    onRestore(e) {
        let {isAuth, checkAuth, checkAuthMsg} = this.state;
        let pass = this.refs.password.refs.pwd.value;
        let private_key = PrivateKey.fromSeed(pass || "");
        let contents = this.props.backup.contents;
        this.setState({loading: true});
        decryptAccountBackup(private_key.toWif(), contents).then(wallet_object => {
            BackupStore.setWalletObjct(wallet_object);
            WalletActions.restore(wallet_object.public_name, wallet_object).then(wallet => {
                this.setState({loading: false});
                if(isAuth){
                    if(checkAuth){
                        WalletStore.validatePassword(pass, false, true);
                        AuthorizeServiceStore.doAuth(wallet.yoyow_id, wallet.encrypted_active.pubkey).then(url => {
                            if(url){
                                window.top.location = url;
                            }else{
                                NotificationActions.error(this.translate("authorize_service.invalid_state"));
                            }
                        }).catch(e => {
                            NotificationActions.error(e.message);
                        });
                    }else{
                        NotificationActions.error(checkAuthMsg);
                    }
                }else{
                    this.routerPush("/balance");
                }
            });
        }).catch(error => {
            this.setState({loading: false});
            console.error("Error verifying wallet " + this.props.backup.name, error, error.stack);
            if (error === "invalid_decryption_key")
                NotificationActions.error(this.translate("import_file.notice_pwd_error"));
            else
                NotificationActions.error("" + error);
        })
    }

    onReset(e) {
        e.preventDefault();
        this.refs.file.value = "";
        BackupActions.reset();
    }

    render() {
        let {isAuth, loading} = this.state
        return (

            <div className="page">
                <div></div>
                <div className="white-box">
                    <div className="layer-import">
                        <h2>
                            {!isAuth?this.translate("import_file.title"):this.translate("restore_account.import_file_with_auth")}
                            </h2>
                        <span className="tips-import">{this.translate("import_file.prompt")}</span>
                        <div className="box-button">
                            <input ref="text" disabled type="text"/>
                            <input className="button" type="button"
                                   value={this.translate("import_file.select_file")}
                                   onClick={this.onSelectClick.bind(this)}/>
                            <input ref="file" type="file" style={{display: 'none'}}
                                   onChange={this.onFileUpload.bind(this)} accept=".bin"/>
                        </div>

                        {!this.props.backup.sha1 ? null :
                            <div className="info-account">
                                <p><span>{this.translate("import_file.file_size")}</span>{this.props.backup.size}</p>
                                <p><span>{this.translate("import_file.file_hash")}</span>{this.props.backup.sha1}</p>
                                <p><span>{this.translate("import_file.password")}</span><InputPwd placeholder={this.translate("create_account.ph_pwd")} className="input-icon-pwd-330"
                                                             ref="password"/></p>

                                {
                                    loading ? <p style={{textAlign: 'center'}}><TextLoading /></p>
                                    : <p>
                                        <input className="button-normal" type="button" value={this.translate("button.ok")}
                                            onClick={this.onRestore.bind(this)}/>
                                        <input className="button-normal" type="button" value={this.translate("button.reset")}
                                            onClick={this.onReset.bind(this)}/>
                                    </p>
                                }
                            </div>
                        }
                    </div>
                </div>
            </div>
        )
    }
}

export default connect(ImportFile, {
    listenTo() {
        return [WalletStore, BackupStore];
    },
    getProps() {
        return {wallet: WalletStore.getState().wallet, backup: BackupStore.getState()};
    }
});