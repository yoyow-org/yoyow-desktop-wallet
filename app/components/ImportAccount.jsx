
import React from "react";
import BaseComponent from "./BaseComponent";
import BackupActions, {decryptAccountBackup} from "../actions/BackupActions";
import BackupStore from "../stores/BackupStore";
import {connect} from "alt-react";
import WalletStore from "../stores/WalletStore";
import {PrivateKey} from "yoyowjs-lib";
import NotificationActions from "../actions/NotificationActions";
import WalletActions from "../actions/WalletActions";
import {Link} from "react-router"

class ImportAccount extends BaseComponent {
    constructor(props) {
        super(props);
    }

    // onSelectClick(e) {
    //     let file = this.refs.file;
    //     file.click();
    // }
    //
    // onFileUpload(e) {
    //     let file = e.target.files[0];
    //     BackupActions.incommingWebFile(file);
    //     this.forceUpdate();
    // }
    //
    // onRestore(e) {
    //     e.preventDefault();
    //     let pass = this.refs.password.value;
    //     let private_key = PrivateKey.fromSeed(pass || "");
    //     let contents = this.props.backup.contents;
    //     decryptAccountBackup(private_key.toWif(), contents).then(wallet_object => {
    //         //console.log('==-=-=', wallet_object)
    //         BackupStore.setWalletObjct(wallet_object);
    //         WalletActions.restore(wallet_object.public_name, wallet_object).then(wallet => {
    //             this.routerPush("/balance");
    //         });
    //     }).catch(error => {
    //         console.error("Error verifying wallet " + this.props.backup.name, error, error.stack);
    //         if (error === "invalid_decryption_key")
    //             NotificationActions.error("密码不正确");
    //         else
    //             NotificationActions.error("" + error);
    //     })
    // }
    //
    // onReset(e) {
    //     e.preventDefault();
    //     this.refs.file.value = "";
    //     BackupActions.reset();
    // }

    onLinkToPaper(){
        this.routerPush("/import-file");
    }
    render() {
        return (
            <div className="layer-settings">
                <h3>{this.translate("import_account.title")}</h3>
                <div className="layer-import">
                    <div className="info-import">{this.translate("import_account.account_backup.label")}</div>
                    <input className="button-longest" type="button"
                           value={this.translate("import_account.account_backup.button_value")}
                           onClick={this.onLinkToPaper.bind(this)}
                           />

                </div>

                <hr/>
                <div className="layer-import">
                    <div className="info-import">
                        <span>{this.translate("import_account.private_key_backup.label_1")}</span>
                        <span style={{color: 'red'}}>{this.translate("import_account.private_key_backup.label_2")}</span><br/>
                        <span>{this.translate("import_account.private_key_backup.label_3")}</span>
                    </div>
                    <Link className="button-longest" to="restore-account">{this.translate("import_account.private_key_backup.button_value")}</Link>
                </div>
            </div>
        );
    }
}

export default connect(ImportAccount, {
    listenTo() {
        return [WalletStore, BackupStore];
    },
    getProps() {
        return {wallet: WalletStore.getState().wallet, backup: BackupStore.getState()};
    }
});
 