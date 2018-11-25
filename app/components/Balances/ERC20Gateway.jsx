import React from "react";
import BaseComponent from "../BaseComponent";
import {connect} from "alt-react";
import WalletStore from "../../stores/WalletStore";
import ERC20GatewayStore from "../../stores/gateway/ERC20GatewayStore";
import ERC20GatewayActions from "../../actions/gateway/ERC20GatewayActions";
import globalParams from "../../utils/GlobalParams";
import Validation from "../../utils/Validation";
import Utils from "../../utils/Utils";
import ConfirmActions from '../../actions/layout/ConfirmActions';
import WalletUnlockActions from '../../actions/WalletUnlockActions';
import TextLoading from "../Layout/TextLoading";
import NotificationActions from "../../actions/NotificationActions";
import QRCode from "qrcode.react";
import Modal from "../Layout/Modal"
import Example from "../../assets/img/example.png";
import {round} from "lodash";
class ERC20GatewayContainer extends BaseComponent {

    constructor() {
        super();
        this.state = {curInx: 0}
    }

    handleChangeTab(inx) {
        this.setState({curInx: inx});
    }

    render() {
        let {children} = this.props;
        let {curInx} = this.state;
        return (
            <div className="layer-settings">
                <h3>{this.translate("erc20.title")}</h3>
                <ul className="nav-changepassword">
                    {
                        children.map((ele, i) => {
                            let title = ele.props['data-title'];
                            return <li className={curInx == i ? 'cur' : ''} key={'tab-' + i}><a
                                onClick={this.handleChangeTab.bind(this, i)}>{title}</a></li>
                        })
                    }
                </ul>
                {
                    children.map((ele, i) => {
                        if (curInx == i) {
                            return ele;
                        }
                    })
                }
            </div>
        );
    }

}

class ERC20Gateway extends BaseComponent {
    constructor() {
        super();
        this.state = this.__init();
        this.showQrcode = this.showQrcode.bind(this);
    }

    componentWillReceiveProps(nextProps) {
        let {yoyow_id} = nextProps.wallet;
        if (yoyow_id && this.state.master != yoyow_id) {
            this.setState(this.__init(yoyow_id));
        }
        
    }

    __init(uid) {
        let master = uid;
        if (!master)
            master = WalletStore.getWallet().yoyow_id;

        ERC20GatewayActions.getAddrByUid(master);
        ERC20GatewayActions.getBalanceByUid(master);
        ERC20GatewayActions.getFees(master, 0, `eth#0x0000000000000000000000000000000000000000`, 'fromBalance');
        return {
            master: master,
            address: '',
            amount: '',
            amount_bts:"",
            account_bts:'',
            modalIsShow: false,
            useCsaf: true
        }

    }

    doGenerate(e) {
        ERC20GatewayActions.bindAccount(this.props.wallet.yoyow_id).then(() => {
            this.refs.btnGenerate && this.refs.btnGenerate.removeAttribute("disabled");
        });
    }

    handleAddressChange(e) {
        this.setState({address: e.target.value});
    }
    handleAccountChange(e) {
        this.setState({account_bts: e.target.value});
    }
    handleAmountChange(e) {
        let {value} = e.target;
        let {balance} = this.props;
        if (Validation.isNumber(value) && value <= balance.core_balance) {
            value = Utils.formatAmount(value);
            this.setState({
                amount: value
            });
        }
    }

    confirmTransferBts(){
        this.checkAccountValid(()=>{
            let {master, account_bts, amount, useCsaf} = this.state;
            let {balance, fees} = this.props;
            let requireAmount = parseFloat(amount); //实际操作需要金额 含手续费
            requireAmount += useCsaf ? fees.with_csaf_fees : fees.min_fees;

            let msg = null;
            if (Validation.isEmpty(account_bts)) {
                msg = this.translate("bts.alert_input_address");
            } else if (Validation.isEmpty(amount)) {
                msg = this.translate("bts.alert_input_amount");
            } else if (amount <= global.walletConfig.bts_fees ) {
                msg = this.translate("bts.alert_valid_amount", {amount: global.walletConfig.bts_fees, unit: global.walletConfig.coin_unit});
            } else if (requireAmount > balance.core_balance) {
                msg = this.translate("bts.error_balance");
            } else {
                if (WalletStore.isLocked(false)) {
                    WalletUnlockActions.unlock(false).then(() => {
                        this.__confirmBts();
                    })
                } else {
                    this.__confirmBts();
                }
            }

            if (msg) {
                ConfirmActions.alert(msg);
            }
        })

    }
    confirmTransfer() {
        this.checkAccountValid(() => {
            let {master, address, amount, useCsaf} = this.state;
            let {balance, fees} = this.props;
            let requireAmount = parseFloat(amount); //实际操作需要金额 含手续费
            requireAmount += useCsaf ? fees.with_csaf_fees : fees.min_fees;
            let msg = null;
            if (Validation.isEmpty(address)) {
                msg = this.translate("erc20.alert_input_address");
            } else if (Validation.isEmpty(amount)) {
                msg = this.translate("erc20.alert_input_amount");
            } else if (amount <= global.walletConfig.erc20_fees ) {
                msg = this.translate("erc20.alert_valid_amount", {amount: global.walletConfig.erc20_fees, unit: global.walletConfig.coin_unit});
            } else if (requireAmount > balance.core_balance) {
                msg = this.translate("erc20.error_balance");
            } else if(!Validation.validateEtherAddress(address)){
                ConfirmActions.error(this.translate("erc20.error_address"));
            } else {
                if (WalletStore.isLocked(false)) {
                    WalletUnlockActions.unlock(false).then(() => {
                        this.__confirm();
                    })
                } else {
                    this.__confirm();
                }
            }

            if (msg) {
                ConfirmActions.alert(msg);
            }
        });
    }
    __confirmBts(){
        let {master, account_bts, amount, useCsaf} = this.state;
        amount = round(amount * Utils.precisionToNum(5));
        ERC20GatewayActions.confirmTransferBts(master, account_bts, amount, useCsaf).then(() => {
            ERC20GatewayActions.getBalanceByUid(master);
            NotificationActions.success(this.translate("bts.success_info"));
            this.setState({account_bts: '', amount: ''});
        }).catch(code => {
            if (code == 2) {
                ConfirmActions.error(this.translate("bts.error_balance"));
            } else if (code == 3) {
                ConfirmActions.error(this.translate("bts.error_master"));
            } else {
                ConfirmActions.error(this.translate("bts.unknown_error"));
            }
        });
    }
    __confirm() {
        let {master, address, amount, useCsaf} = this.state;
        amount = round(amount * Utils.precisionToNum(5));
        ERC20GatewayActions.confirmTransfer(master, address, amount, useCsaf).then(() => {
            ERC20GatewayActions.getBalanceByUid(master);
            NotificationActions.success(this.translate("erc20.success_info"));
            this.setState({address: '', amount: ''});
        }).catch(code => {
            if (code == 2) {
                ConfirmActions.error(this.translate("erc20.error_balance"));
            } else if (code == 3) {
                ConfirmActions.error(this.translate("erc20.error_master"));
            } else {
                ConfirmActions.error(this.translate("error.unknown_error"));
            }
        });
    }

    checkChangeHandle(e) {
        this.setState({useCsaf: e.target.checked});
    }

    closeQrcode() {
        this.setState({modalIsShow: false});
    }

    showQrcode() {
        this.setState({modalIsShow: true});
    }

    render() {
        let {master, address,account_bts, amount, useCsaf} = this.state;
        let {wallet, ethaddr, balance, loading, fees} = this.props;

        return (
            <ERC20GatewayContainer>
                <div data-title={this.translate("erc20.transfer_in_title")}>
                    <div className="m-t-20">{this.translate("erc20.note")}</div>
                    <br/>
                    <div>{this.translate("erc20.current_account")}</div>
                    <input type="button" className="erc-btn text-center m-t-14" value={master}/><br/><br/><br/>
                    <div>{this.translate("erc20.bind_eth")}</div>
                    {ethaddr == null ?
                        <input onClick={this.doGenerate.bind(this)} type="button"
                               className="erc-btn text-center m-t-14" value={this.translate("erc20.btn_generate")}/>
                        : (
                            <span>
                            <input type="text" readOnly={true} className="erc-btn text-center m-t-14" value={ethaddr}/>
                            <input type="button" value={this.translate("view_purview.button_generate_QR")}
                                   className="button" onClick={this.showQrcode}
                                   style={{height: "34px", lingHeight: "34px", marginTop: "14px", width: "160px"}}/>
                            <Modal
                                ref="modal"
                                visible={this.state.modalIsShow}
                                onClose={this.closeQrcode.bind(this)}
                                width={400}
                                height={260}
                            >
                                <div className="layer-modal">
                                    <div>
                                        <h4>{this.translate("erc20.qrcode")}</h4>
                                        <dl>
                                            <dt>
                                                <span className="qrcode">
                                                <QRCode size={136} value={ethaddr} /></span>
                                            </dt>
                                            <dd>
                                                <button className="button-cancel" type="button"
                                                        onClick={this.closeQrcode.bind(this)}>{this.translate("button.cancel")}
                                                </button>
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </Modal>

                        </span>
                        )

                    }
                    <span className="mini_code"></span>
                </div>
                <div data-title={this.translate("erc20.transfer_out_title")}>
                    <div className="m-t-20">{this.translate("erc20.transfer_out_note")}</div>
                    <br/>
                    <div>{this.translate("erc20.transfer_out_to")}</div>
                    <input type="text" placeholder={this.translate("erc20.placeholder_out_address")}
                           className="input-500 m-t-14" onChange={this.handleAddressChange.bind(this)} value={address}/><br/><br/><br/>
                    <div>{this.translate("erc20.transfer_out_amount")}</div>
                    <input type="text"
                           placeholder={this.translate("erc20.placeholder_out_amount", {unit: global.walletConfig.coin_unit})}
                           className="input-500 m-t-14" onChange={this.handleAmountChange.bind(this)} value={amount}/>
                    <span className="erc-usable">{this.translate("erc20.useable")}<span
                        className="money-font">{balance.core_balance}</span>&nbsp;{global.walletConfig.coin_unit}</span>
                    <br/><br/><br/>
                    <div>{this.translate("erc20.fees")}</div>
                    <input type="text" className="input-500 m-t-14 "
                           value={global.walletConfig.erc20_fees + ' ' + global.walletConfig.coin_unit} disabled="disabled"/><br/>
                    <div className="m-t-20">{this.translate("erc20.confirm_note",{amount:global.walletConfig.erc20_fees+''+global.walletConfig.coin_unit})}</div>
                    <br/><br/>
                    <div>
                        <span className="normal-text w-82">{this.translate("layout_fees.title")}</span>
                        <span className="money-font">{useCsaf ? fees.with_csaf_fees  : fees.min_fees}</span>
                        &nbsp;&nbsp;{global.walletConfig.coin_unit}
                        <label className="m-l-30" hidden={fees.use_csaf == 0}>
                            <input type="checkbox" checked={useCsaf} onChange={this.checkChangeHandle.bind(this)}/>
                            &nbsp;&nbsp;{this.translate("layout_fees.text",{count: Utils.formatAmount(fees.use_csaf * global.walletConfig.csaf_param, 4)})}
                        </label>
                    </div>
                    <br/><br/>
                    {loading ? <TextLoading/> :
                        <input type="button" value={this.translate("erc20.confirm_btn")} className="button"
                               onClick={this.confirmTransfer.bind(this)}/>}
                </div>
                <div  data-title={this.translate("bts.transfer_in_title")} >
                    <div className="m-t-20">{this.translate("bts.note_info")}</div>
                    <div>{this.translate("bts.note")}</div>
                    <br/>
                    <img className="img-bts" src={Example}/>
                </div>
                <div data-title={this.translate("bts.transfer_out_title")} >
                    <div className="m-t-20">
                        {this.translate("bts.transfer_out_note")}
                    </div>
                    <br/>
                    <div>{this.translate("bts.transfer_out_to")}</div>
                    <input type="text" className="input-500 m-t-14" placeholder={this.translate("bts.placeholder_out_address")} onChange={this.handleAccountChange.bind(this)} value={account_bts}/>
                    <br/><br/><br/>
                    <div>{this.translate("bts.transfer_out_amount")}</div>
                    <input type="text"
                           placeholder={this.translate("bts.placeholder_out_amount", {unit: global.walletConfig.coin_unit})}
                           className="input-500 m-t-14"
                           onChange={this.handleAmountChange.bind(this)}  value={amount}/>
                    <span className="erc-usable">{this.translate("bts.useable")}<span
                        className="money-font">{balance.core_balance}</span>&nbsp;{global.walletConfig.coin_unit}</span>
                    <br/><br/><br/>
                    <div>{this.translate("bts.fees")}</div>
                    <input type="text"
                           value={global.walletConfig.bts_fees + ' ' + global.walletConfig.coin_unit}
                           className="input-500 m-t-14 "
                           disabled="disabled"/><br/>
                    <div className="m-t-20">{this.translate("bts.confirm_note",{amount:global.walletConfig.bts_fees+''+global.walletConfig.coin_unit})}</div>
                    <br/><br/>
                    <div>
                        <span className="normal-text w-82">{this.translate("layout_fees.title")}</span>
                        <span className="money-font">{useCsaf ? fees.with_csaf_fees  : fees.min_fees}</span>
                        &nbsp;&nbsp;{global.walletConfig.coin_unit}
                        <label className="m-l-30" hidden={fees.use_csaf == 0}>
                            <input type="checkbox" checked={useCsaf}  onChange={this.checkChangeHandle.bind(this)}/>
                            &nbsp;&nbsp;{this.translate("layout_fees.text",{count: Utils.formatAmount(fees.use_csaf * global.walletConfig.csaf_param, 4)})}
                        </label>
                    </div>
                    <br/><br/>
                    {loading ? <TextLoading/> :
                        <input type="button" value={this.translate("bts.confirm_btn")} className="button"
                               onClick={this.confirmTransferBts.bind(this)}/>}
                </div>
            </ERC20GatewayContainer>
        );
    }
}

const stores = [WalletStore, ERC20GatewayStore];

export default connect(ERC20Gateway, {
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