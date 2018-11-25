import React from "react";
import BaseComponent from "../BaseComponent";
import { connect } from "alt-react";
import Modal from "../Layout/Modal";
import WalletUnlockActions from '../../actions/WalletUnlockActions';
import WalletStore from '../../stores/WalletStore';
import TokenActions from '../../actions/TokenActions';
import TokenStore from '../../stores/TokenStore';
import DownSelect from "../form/DownSelect";
import ConfirmActions from "../../actions/layout/ConfirmActions";
import { round } from 'lodash';
import Utils from "../../utils/Utils";
import TextLoading from "../Layout/TextLoading";

class TokenCreate extends BaseComponent {
    constructor() {
        super();
        this.state = {
            symbol: '',
            supply: 0,
            precision: 2,
            desc: '',
            st: null
        };
    }

    _init() {
        this.setState({
            symbol: '',
            supply: 0,
            precision: 2,
            desc: '',
            st: null
        });
    }

    componentWillUpdate(nextProps) {
        if (!this.props.visible && nextProps.visible) {
            this.getFees();
        }
    }

    getFees() {
        let { symbol, supply, precision, desc } = this.state;
        let { yoyow_id } = this.props.wallet;
        TokenActions.createToken(yoyow_id, symbol, precision, supply, desc, false);
    }

    close() {
        TokenActions.toggleDialog(false);
        setTimeout(() => {
            this._init();
        }, 500);
    }

    confirm() {
        this.checkAccountValid(() => {
            let { symbol, supply, desc } = this.state;
            let { balance, fees } = this.props;
            let msg;

            if (symbol == '') {
                msg = this.translate("Token.alert_require_symbol");
            } else if (symbol.length < 3) {
                msg = this.translate("Token.alert_min_symbol");
            } else if (supply <= 0) {
                msg = this.translate("Token.alert_require_supply");
            } else if (desc == '') {
                msg = this.translate("Token.alert_require_desc");
            } else if (fees.min_fees > balance.core_balance) {
                msg = this.translate("Token.alert_require_balance");
            } else {
                if (WalletStore.isLocked(false)) {
                    WalletUnlockActions.unlock(false).then(() => {
                        this.__confirmCreate();
                    });
                } else {
                    this.__confirmCreate();
                }
            }
            if (msg) {
                ConfirmActions.alert(msg);
            }
        })
    }

    __confirmCreate() {
        let { symbol, supply, precision, desc } = this.state;
        let { yoyow_id } = this.props.wallet;
        TokenActions.createToken(yoyow_id, symbol, precision, supply, desc, true).then(res => {
            ConfirmActions.alert(this.translate("Token.success_text"));
            TokenActions.getAssets();
            this.close();
        }).catch(err => {
            if (err.message.indexOf('asset_symbol_itr == asset_indx.end') >= 0) {
                ConfirmActions.error(this.translate("Token.error_unique"));
            } else {
                ConfirmActions.error(this.translate("Token.error_unknown"));
            }
        });
    }

    __timeoutGetFees() {
        if (this.st)
            clearTimeout(this.st);
        this.st = setTimeout(() => {
            this.getFees();
        }, 700)
    }

    handleSymbolChange(e) {
        let reg = /^[a-zA-Z]+$/g;
        let val = e.target.value
        if ((reg.test(val) && val.length <= 8) || val == '') {
            this.setState({ symbol: val.toUpperCase() });
            this.__timeoutGetFees();
        }
    }

    handleSupplyChange(e) {
        let reg = /^[0-9]+$/g;
        let val = e.target.value
        if (val == '') val = 0;
        if (reg.test(val) && val <= 10000000000)
            this.setState({ supply: round(val) });
    }

    handlePrecisionChange(obj) {
        this.setState({ precision: parseInt(obj.value) });
    }

    handleDescChange(e) {
        let desc = e.target.value;
        if (Utils.charCounter(desc) < 100) {
            this.setState({ desc });
            this.__timeoutGetFees();
        }
    }

    render() {
        let { symbol, supply, desc, precision } = this.state;
        let title = this.translate("Token.issue_button");
        let { visible, width, height, fees, loading } = this.props;
        return (
            <div className="popup-window token-container">
                <Modal visible={visible} onClose={this.close.bind(this)} height={height} width={width}>
                    <div className="title">{title}</div>
                    <div className="vh-flex">
                        <div className="edit-line" >
                            <label className="edit-text-label" style={{ width: '120px' }}>{this.translate("Token.edit_text_symbol")}</label>
                            <input type="text" className="input-440" placeholder={this.translate("Token.edit_placeholder_symbol")} onChange={this.handleSymbolChange.bind(this)} value={symbol} />
                        </div>
                        <div className="edit-line" >
                            <label className="edit-text-label" style={{ width: '120px' }}>{this.translate("Token.edit_text_max")}</label>
                            <input type="text" className="input-440" placeholder={this.translate("Token.edit_placeholder_max")} onChange={this.handleSupplyChange.bind(this)} value={supply} />
                        </div>
                        <div className="edit-line" >
                            <label className="edit-text-label" style={{ width: '120px' }}>{this.translate("Token.edit_text_precision")}</label>
                            <DownSelect width="440px" className="selecter" defaultObj={{ value: '2', text: '2' }} data={[{ value: '2', text: '2' }, { value: '3', text: '3' }, { value: '4', text: '4' }, { value: '5', text: '5' }]} onChange={this.handlePrecisionChange.bind(this)} chooseVal={precision} />
                        </div>
                        <div className="edit-line" >
                            <label className="edit-text-label" style={{ width: '120px' }}>{this.translate("Token.edit_text_desc")}</label>
                            <textarea type="text" className="desc-text" placeholder={this.translate("Token.edit_placeholder_desc")} onChange={this.handleDescChange.bind(this)} value={desc}></textarea>
                        </div>
                        <br /><br />
                        <div className="edit-line" >
                            <label className="edit-text-label" style={{ width: '120px' }}>{this.translate("Token.fees")}</label>
                            <label className="fee-text-label" ><span className="money-font">{symbol.length < 3 ? '--' : fees.min_fees}</span><span className="m-l-10">{global.walletConfig.coin_unit}</span></label>
                        </div>
                    </div>
                    <div className="buttons">
                        {
                            loading ? <TextLoading /> :
                                <div>
                                    <input onClick={this.confirm.bind(this)} className="button-short" type="button" value={this.translate("button.ok")} />
                                    <input onClick={this.close.bind(this)} className="button-cancel" type="button" value={this.translate("button.cancel")} />
                                </div>
                        }
                    </div>
                </Modal>
            </div>
        );
    }
}

const stores = [WalletStore, TokenStore];

export default connect(TokenCreate, {
    listenTo() {
        return stores;
    },
    getProps() {
        let result = {};
        for (let store of stores) {
            for (let props in store.getState()) {
                result[props] = store.getState()[props];
            }
        }
        return result;
    }
});