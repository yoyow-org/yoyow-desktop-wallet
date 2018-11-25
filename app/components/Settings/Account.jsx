import React from "react"
import BaseComponent from "../BaseComponent"
import {Link} from "react-router"
import WalletStore from "../../stores/WalletStore"
import {connect} from "alt-react";
import Translate from "react-translate-component";
import Modal from "../Layout/Modal";
import QRCode from "qrcode.react";
import WalletActions from "../../actions/WalletActions";
import ConfirmActions from '../../actions/layout/ConfirmActions';
import Validation from "../../utils/Validation";

class Account extends BaseComponent {
    constructor(props) {
        super(props);
        this.state = {
            show_qr: false,
            qr_str: ''
        }
    }

    handleGen(e){
        this.checkAccountValid(() => {
            WalletActions.generateQRcode().then(qr_str => {
                this.setState({show_qr: true, qr_str});
            }).catch(err => {
                if(Validation.isString(err))
                    ConfirmActions.alert(this.translate(err));
                else
                    ConfirmActions.alert(this.translate('error.unknown_error'));
            });
        });
    }

    close(e){
        this.setState({show_qr: false});
    }

    render() {
        let {wallet} = this.props;
        let {show_qr, qr_str} = this.state;
        return (
            <div className="layer-settings">
                <h3>{this.translate("account.title")}</h3>
                <div className="content-settings">
                    <span className="account-name">{this.translate("account.current_account")}</span><span className="content-account"><i></i><em>{wallet.yoyow_id}</em></span><Link className="button" to="/settings/viewpurview">{this.translate("account.view_permission")}</Link>
                    <button className="button" style={{width: '140px'}} onClick={this.handleGen.bind(this)}>{this.translate('QRCode.button_gen')}</button>
                </div>

                <Modal visible={show_qr} onClose={this.close.bind(this)} className="account_qr_wrapper">
                    <QRCode size={256} value={qr_str}/>
                </Modal>

            </div>
        )
    }
}
export default connect(Account, {
    listenTo() {
        return [WalletStore];
    },
    getProps() {
        return WalletStore.getState();
    }
});