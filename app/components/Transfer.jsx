import React from "react";
import BaseComponent from "./BaseComponent";
import { connect } from "alt-react";
import WalletStore from "../stores/WalletStore";
import TransferActions from "../actions/TransferActions";
import TransferStore from "../stores/TransferStore";
import AccountImage from "./Layout/AccountImage";
import ConfirmActions from "../actions/layout/ConfirmActions";
import FetchApi from "../api/FetchApi";
import Validation from "../utils/Validation";
import WalletUnlockActions from "../actions/WalletUnlockActions";
import TextLoading from "./Layout/TextLoading";
import NotificationActions from "../actions/NotificationActions";
import globalParams from "../utils/GlobalParams";
import Utils from "../utils/Utils";
import {round} from "lodash";

let checkStand = null;

class Transfer extends BaseComponent {
    constructor() {
        super();
        this.state = {
            master: WalletStore.getWallet().yoyow_id,
            useCsaf: true, // 是否使用积分
            useBalance: true, // 从余额转
            toAccount: '',
            amount: 0,
            remark: '',
            isSave: true, //是否保存联系人,
            once: true,
            isCheckAccount: false, //是否检查过联系人
            isWaitting: false, //是否处于备注输入等待查询手续费中
            asset_id: 0,
        }
    }

    componentDidMount() {
        this.setState(this.__initState());
    }

    componentWillReceiveProps(nextProps) {
    }

    componentWillUpdate(nextProps, nextState){
        let { yoyow_id } = nextProps.wallet;
        let { uid, from } = nextProps.location.query;
        // TODO: 现设计隐藏菜单转账，则若手动输入transfer地址，不带from参数情况，跳转首页
        // if (yoyow_id && this.state.master != yoyow_id) {
        if(this.props.wallet.yoyow_id != nextProps.wallet.yoyow_id){
            this.setState({ master: yoyow_id });
            // 切换帐号之后再次拉取数据
            let asset_id = from;
            if (from == 'balance' || from == 'prepaid')
                asset_id = 0;
            TransferActions.getBalance(yoyow_id, asset_id);
            this.__getFees();
        }

        if (this.state.once) {
            let temState = { once: false };
            // 初始化执行
            if (!Validation.isEmpty(uid)) {
                temState.toAccount = uid;
                temState.isCheckAccount = true;
            }
            if (!Validation.isEmpty(from)) {
                // temState.useBalance = nextProps.location.query.from == 'balance';
                // 非零钱 都为余额
                temState.useBalance = from != 'prepaid';
            }
            this.setState(temState);
        }
    }

    __initState() {
        // 确认之后执行此部分
        let master = WalletStore.getWallet().yoyow_id;
        let toAccount = ''
        let isCheckAccount = false;
        let {uid, from} = this.props.location.query;
        let asset_id = 0;
        let useBalance = from != 'prepaid';
        if(from != undefined && from != 'balance' && from != 'prepaid'){
            asset_id = from;
        }
        if (uid) {
            toAccount = uid;
            isCheckAccount = true;
        }

        
        TransferActions.getBalance(master, asset_id);
        this.__getFees();

        return {
            master: master,
            useCsaf: true, // 是否使用积分
            useBalance: useBalance, // 从余额转
            toAccount: toAccount,
            amount: 0,
            remark: '',
            isSave: true, //是否保存联系人,
            once: true,
            isCheckAccount: isCheckAccount, //是否检查过联系人
            isWaitting: false, //是否处于备注输入等待查询手续费中
            asset_id
        };
    }

    /**
     * 使用余额还是零钱
     * @param e
     */
    handleFromChange(e) {
        let useBalance = e.target.value == 'balance';
        this.setState({ useBalance: useBalance });
    }

    /**
     * 转账目标账户change
     * @param e
     */
    handleToAccountChange(e) {
        let uid = e.target.value;
        TransferActions.checkAccount(uid).then(res => {
            this.setState({ toAccount: uid, isCheckAccount: true });
        }).catch(err => {
            this.setState({ toAccount: uid, isCheckAccount: false });
        });
    }

    /**
     * 转账金额change
     * @param e
     */
    handleAmountChange(e) {
        let {token} = this.props;
        let val = e.target.value;
        if (Validation.isNumber(val)) {
            val = Utils.formatAmount(val, token.precision + 1);
            this.setState({ amount: val });
        }
    }

    /**
     * 转账备注change
     * @param e
     */
    handleRemarkChange(e) {
        let remark = e.target.value;
        this.setState({ remark: remark, isWaitting: true });
        clearTimeout(checkStand);
        checkStand = setTimeout(this.__getFees.bind(this), 500);

    }

    /**
     * 是否使用积分按钮（根据设计，暂时省去）
     *
     */
    checkChangeHandle(e) {
        this.setState({ useCsaf: e.target.checked });
    }

    handleSaveChange(e) {
        this.setState({ isSave: e.target.checked });
    }

    __getFees() {
        let { toAccount, amount, remark, useBalance, master, isCheckAccount } = this.state;
        amount = round(amount);
        TransferActions.getFees(isCheckAccount ? toAccount : master, amount, remark, useBalance ? 'fromBalance' : 'fromPrepaid')
            .then(() => {
                this.setState({ isWaitting: false });
            }).catch(code => {
                this.setState({ isWaitting: false });
                if (code == 1) {
                    ConfirmActions.error(this.translate("transfer.error_invalid_account") + ' ' + toAccount);
                } else if (code == -1) {
                    ConfirmActions.error(this.translate("error.get_fees_error"));
                }

            });
    }

    __confirmTransfer() {
        let { toAccount, amount, remark, useBalance, useCsaf, isSave, asset_id } = this.state;
        let {token} = this.props;
        amount = round(amount * Utils.precisionToNum(token.precision));
        TransferActions.confirmTransfer(toAccount, amount, remark, useBalance ? 'fromBalance' : 'fromPrepaid', useCsaf, isSave, asset_id)
            .then(() => {
                this.setState(this.__initState());
                NotificationActions.success(this.translate("transfer.success_transfer"));
            }).catch(code => {
                if (code == 1) {
                    ConfirmActions.error(this.translate(["transfer", (useBalance ? 'alert_balance_not_enough' : 'alert_prepaid_not_enough')]))
                } else {
                    ConfirmActions.error(this.translate("error.unknown_error"));
                }
            });
    }

    onConfirmTransfer() {
        this.checkAccountValid(() => {
            let { toAccount, amount, useBalance, useCsaf, isCheckAccount, master, isWaitting } = this.state;
            let { balance, fees, token } = this.props;
            let residue = Utils.formatToken(token.amount, token.precision);
            let requireYOYO = round(amount, token.precision);

            let requireAmount = token.asset_id == 0 ? parseFloat(amount) : 0; //实际操作需要金额 含手续费
            requireAmount += useCsaf ? fees.with_csaf_fees : fees.min_fees;

            let msg = '';
            if (Validation.isEmpty(toAccount)) {
                msg = this.translate("transfer.alert_empty_to_account");
            } else if (!isCheckAccount) {
                msg = this.translate("transfer.error_invalid_account");
            } else if (toAccount == master) {
                msg = this.translate("transfer.alert_other_to_account");
            } else if (Validation.isEmpty(amount)) {
                msg = this.translate("transfer.alert_invalid_amount");
            } else if (token.asset_id == 0 && useBalance && balance.core_balance < amount) {
                msg = this.translate("transfer.alert_balance_not_enough");
            } else if (token.asset_id == 0 && !useBalance && balance.prepaid_balance < amount) {
                msg = this.translate("transfer.alert_prepaid_not_enough");
            } else if (token && residue < amount) {
                msg = this.translate("transfer.alert_balance_not_enough");
            } else if (useBalance && balance.core_balance < requireAmount) {
                msg = this.translate("transfer.alert_balance_cant_pay");
            } else if (!useBalance && balance.prepaid_balance < requireAmount) {
                msg = this.translate("transfer.alert_prepaid_cant_pay");
            } else {
                if (WalletStore.isLocked(!useBalance)) {
                    WalletUnlockActions.unlock(!useBalance).then(() => {
                        this.__confirmTransfer();
                    });
                } else {
                    this.__confirmTransfer();
                }
            }

            if (!Validation.isEmpty(msg))
                ConfirmActions.alert(msg);
        })


    }

    render() {

        let { useCsaf, useBalance, toAccount, amount, remark, isSave, isCheckAccount } = this.state;

        let { wallet, balance, fees, loading, token } = this.props;

        let residue = useBalance ? balance.core_balance : balance.prepaid_balance;
        if(token && token.asset_id != 0){
            residue = Utils.formatToken(token.amount, token.precision);
        }

        return (

            <div className="layer-settings">
                <h3>{token ? token.symbol : ''}{(token && token.asset_id == 0) ? useBalance ? this.translate("transfer.balance") : this.translate("transfer.prepaid") :''}{this.translate("transfer.title")}</h3>
                <div className="sub-title">{this.translate("transfer.from")}</div>
                <AccountImage account={wallet.yoyow_id} size={{ width: 32, height: 32 }} style={{ float: 'left' }} />
                <input type="text" className="input-440 m-l-50" disabled value={wallet.yoyow_id} />
                {/* <label className="m-l-30"><input type="radio" name="coinFrom" checked={useBalance} onChange={this.handleFromChange.bind(this)} value="balance"/>&nbsp;&nbsp;{this.translate("transfer.balance")}</label>
                <label className="m-l-30"><input type="radio" name="coinFrom" checked={!useBalance} onChange={this.handleFromChange.bind(this)}/>&nbsp;&nbsp;{this.translate("transfer.prepaid")}</label><br/> */}
                <div className="sub-title">{this.translate("transfer.to")}</div>
                <AccountImage account={toAccount} size={{ width: 32, height: 32 }} style={{ float: 'left' }} />
                <input type="text" className="input-440 m-l-50" value={toAccount} placeholder={this.translate("transfer.placeholder_account")} onChange={this.handleToAccountChange.bind(this)} />
                <label className="m-l-30">
                    <input type="checkbox" checked={isSave} onChange={this.handleSaveChange.bind(this)} />&nbsp;&nbsp;{this.translate("transfer.save_contact")}
                </label><br />
                <span hidden={isCheckAccount || toAccount.trim() == ''} className="error-text m-l-85">{this.translate("transfer.error_invalid_account")}</span><br /><br />

                <span className="normal-text w-82">{this.translate("transfer.amount")}</span>
                <input className="input-340" type="text" value={amount} placeholder={this.translate("transfer.placeholder_amount")} onChange={this.handleAmountChange.bind(this)} />
                <input className="input-100 text-center" type="text" disabled value={token ? token.symbol : ''} /><br /><br />
                <span className="m-l-80">
                    {this.translate("transfer.usable")}：<span className="money-font">{residue}</span>
                    &nbsp;&nbsp;{token ? token.symbol : ''}</span><br /><br />
                <div className="float-left p-t-6 normal-text w-82">{this.translate("transfer.memo")}</div>
                <textarea className="memo-textarea" placeholder={this.translate("transfer.placeholder_memo")} value={remark} onChange={this.handleRemarkChange.bind(this)} /><br /><br />
                <div>
                    <span className="normal-text w-82">{this.translate("layout_fees.title")}</span>
                    <span className="money-font">{useCsaf ? fees.with_csaf_fees : fees.min_fees}</span>
                    &nbsp;&nbsp;{global.walletConfig.coin_unit}
                    <label className="m-l-30" hidden={fees.use_csaf == 0}>
                        <input type="checkbox" checked={useCsaf} onChange={this.checkChangeHandle.bind(this)} />
                        &nbsp;&nbsp;{this.translate("layout_fees.text", { count: Utils.formatAmount(fees.use_csaf * global.walletConfig.csaf_param, 4) })}
                    </label>
                </div>
                <br /><br />
                {loading ? (<TextLoading style={{ marginLeft: '90px' }} />) :
                    (<input type="button" className="button m-l-80" value={this.translate("button.ok")} onClick={this.onConfirmTransfer.bind(this)} />)
                }


            </div>
        );
    }
}

const stores = [TransferStore, WalletStore];

export default connect(Transfer, {
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