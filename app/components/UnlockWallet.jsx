
import React from "react";
import BaseComponent from "./BaseComponent";
import WalletUnlockStore from "../stores/WalletUnlockStore";
import WalletStore from "../stores/WalletStore";
import NotificationActions from "../actions/NotificationActions";
import WalletUnlockActions from "../actions/WalletUnlockActions";
import {connect} from "alt-react";
import {Apis} from "yoyowjs-ws";
import Modal from "./Layout/Modal";
import InputPwd from "./form/InputPwd"

class UnlockWallet extends BaseComponent {
    constructor(props) {
        super(props);
        this.state = this.getInitialState();
        this.onPasswordEnter = this.onPasswordEnter.bind(this);
    }

    getInitialState() {
        return {
            visible: false,
            password_error: null,
            password_input_reset: Date.now()
        }
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.resolve) {
            if (WalletStore.isLocked(nextProps.actionIsShort))
                this.show();
            else
                nextProps.resolve();
        }
    }

    show() {
        let wallet = WalletStore.getWallet();
        if (!wallet) {
            return;
        }
        if (Apis.instance().chain_id !== wallet.chain_id) {
            NotificationActions.error("This wallet was intended for a different block-chain; expecting " +
                wallet.chain_id.substring(0, 4).toUpperCase() + ", but got " +
                Apis.instance().chain_id.substring(0, 4).toUpperCase());
            return;
        }
        this.setState({visible: true});
    }

    hide(ok) {
        if (!ok) {
            WalletUnlockActions.cancel();
            if (this.refs.password_input) {
                this.refs.password_input.value = "";
            }
        }
        this.setState({visible: false, password_error: null});

    }

    cancelClick(e) {
        e.preventDefault();
        this.hide(false);
    }

    onPasswordEnter(e) {
        e.preventDefault();
        let {actionIsShort, password_input} = this.props;
        //this.setState({password_error: null});
        WalletStore.validatePassword(password_input || "", actionIsShort, true);
        if (WalletStore.isLocked(actionIsShort)) {
            this.setState({password_error: this.translate(["unlockWallet.error_text",actionIsShort ? "second" : "active"])});
            return false;
        }
        else {
            this.setState({password_input_reset: Date.now(), password_error: null, visible: false});
            let _this = this;
            let t = setTimeout(() => {
                _this.props.resolve();
                WalletUnlockActions.change();
                clearTimeout(t);
            }, 300);
        }
        return false;
    }

    handlePwdChange(e) {
        WalletUnlockActions.passwordChange(e.target.value);
    }

    render() {
        let {actionIsShort, password_input} = this.props;
        let auth = actionIsShort ? "second" : "active";
        return (
            <div className="popup-window">
                <Modal visible={this.state.visible} onClose={this.hide.bind(this)} height={260} width={560}>
                    <div className="title">{this.translate(["unlockWallet.title", auth])}</div>
                    <div className="message-box"></div>
                    <div className="body">
                        <div className="input-row">
                            <div className="label" style={{marginRight: "21px"}}>{this.translate(["unlockWallet.text", auth])}</div>
                            <InputPwd ref="password_input" className="input-icon-pwd-400" type="password"
                                      value={password_input} onChange={this.handlePwdChange.bind(this)}
                                      placeholder={this.translate(["unlockWallet.placeholder_text", auth])}/>
                        </div>
                    </div>
                    <div className="error-box">
                        &nbsp;{this.state.password_error == null ? "" : this.state.password_error}
                    </div>
                    <div className="buttons">
                        <input onClick={this.onPasswordEnter} className="button-short" type="button"
                               value={this.translate("button.ok")}/>&nbsp;&nbsp;
                        <input onClick={this.cancelClick.bind(this)} className="button-cancel" type="button"
                               value={this.translate("button.cancel")}/>
                    </div>
                </Modal>
            </div>
        );
    }
}

export default connect(UnlockWallet, {
    listenTo() {
        return [WalletUnlockStore];
    },
    getProps() {
        return WalletUnlockStore.getState();
    }
});
 