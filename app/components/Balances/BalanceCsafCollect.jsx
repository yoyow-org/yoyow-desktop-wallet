import React from "react";
import BaseComponent from "../BaseComponent";
import Modal from "../Layout/Modal";
import {connect} from "alt-react";
import BalanceActions from '../../actions/BalanceActions';
import BalanceStore from '../../stores/BalanceStore';
import DownSelect from "../form/DownSelect"
import Seekbar from "../Layout/Seekbar";
import WalletStore from '../../stores/WalletStore';
import WalletUnlockActions from '../../actions/WalletUnlockActions';
import ConfirmActions from '../../actions/layout/ConfirmActions';
import TextLoading from "../Layout/TextLoading";
import NotificationActions from "../../actions/NotificationActions";
import globalParams from "../../utils/GlobalParams";
import Utils from "../../utils/Utils";
import Validation from "../../utils/Validation";

class BalanceCsafCollect extends BaseComponent {
    constructor(props) {
        super(props);
        this.state = this.__initCsafCollect(props);
    }

    __initCsafCollect(props) {
        return {
            amount: 0,//积分领取量
            percent: 0,//拖动条百分比
            useCsaf: true,
            isSelf: true,
            toAccount: '0',
            isInput: false,
            real_csaf_collect: 0,
            getMaxCsafError: false
        }
    }

    handleAmountChange(amount, percent) {
        amount = Utils.formatAmount(amount, 4);
        this.setState({
            amount: amount,
            percent: percent,
            isInput: false
        });
    }

    handleAmountInputChange(e) {
        let val = e.target.value;
        let {real_csaf_collect} = this.state;
        if (Validation.isNumber(val) && val <= real_csaf_collect * global.walletConfig.csaf_param) {
            val = Utils.formatAmount(val, 4);
            this.setState({
                amount: val,
                percent: val / real_csaf_collect,
                isInput: true
            });
        }
    }

    componentWillReceiveProps(nextProps) {
        let {csafInput} = this.refs;
        csafInput.focus();
        csafInput.setSelectionRange(0, 0);
        let {max_csaf_collect, max_csaf_limit, balance} = nextProps;
        let real_csaf_collect = max_csaf_limit;

        real_csaf_collect = Math.min(max_csaf_collect, real_csaf_collect);
        real_csaf_collect = Math.min(balance.csaf_collect / global.walletConfig.csaf_param, real_csaf_collect);
        if (this.state.real_csaf_collect != real_csaf_collect) {
            let {percent} = this.state;
            let count = Utils.formatAmount(percent * real_csaf_collect*100, 4);

            this.setState({
                real_csaf_collect: parseFloat(real_csaf_collect),
                amount: count
            });
        }
    }

    confirm() {
        this.checkAccountValid(()=>{
            let {isSelf, amount, useCsaf, toAccount, getMaxCsafError} = this.state;
            let {balance, fees} = this.props;
            let finalFee = useCsaf ? fees.with_csaf_fees : fees.min_fees;
            if (!isSelf && getMaxCsafError){
                ConfirmActions.alert(this.translate("balance.alert_csaf_invalid_uid"));
                return;
            }else if (amount == 0) {
                ConfirmActions.alert(this.translate("balance.alert_casf_invalid_amount"));
                return;
            } else if (isSelf && balance.prepaid_balance < finalFee) {
                ConfirmActions.alert(this.translate("balance.alert_casf_prepaid_cant_pay"));
                return;
            } else if (!isSelf && balance.core_balance < finalFee) {
                ConfirmActions.alert(this.translate("balance.alert_csaf_balance_cant_pay"));
                return;
            } else if (!isSelf && toAccount.trim() == '') {
                ConfirmActions.alert(this.translate("balance.alert_csaf_choose_account"));
                return;
            }
            if (WalletStore.isLocked(isSelf)) {
                WalletUnlockActions.unlock(isSelf).then(() => {
                    setTimeout(this.__csafCollect(), 300);
                })
            } else {
                this.__csafCollect();
            }
        })

    }

    __csafCollect() {
        let {isSelf, useCsaf, toAccount, amount} = this.state;
        let {master} = this.props;
        BalanceActions.confirmCsafCollect(isSelf ? master : toAccount, Utils.formatAmount(amount / global.walletConfig.csaf_param), useCsaf)
            .then(() => {
                this.close();
                BalanceActions.getBalance(master);
                BalanceActions.getMaxCsafLimit(master);
                NotificationActions.success(this.translate("balance.notify_csaf_success"));
            }).catch(code => {
            let msg = '';
            if (code == 1) {
                msg = this.translate("balance.alert_csaf_over_limit");
            } else if (code == 2) {
                msg = this.translate("balance.alert_csaf_not_enough");
            } else if (code == 3){
                msg = this.translate("balance.error_head_time");
            }else {
                msg = this.translate("balance.error_csaf_collect");
            }
            ConfirmActions.error(msg);
        });
    }

    close() {
        this.setState(this.__initCsafCollect());
        BalanceActions.closeDialog('collectWindow');
    }

    checkChangeHandle(e) {
        this.setState({useCsaf: e.target.checked});
    }

    handleCsafToChange(e) {
        let {value} = e.target;
        let {toAccount, isSelf} = this.state;
        let {master} = this.props;
        if (toAccount == master && isSelf || value.toString().trim() == '') {
            return;
        }
        this.setState({
            isSelf: value == master,
        });
        this.__getMaxCsafLimit(value, false);
    }

    handleContactChange(item) {
        let val = item.value;
        if(!val)
            val = item.trim() == '' ? '0' : item;

        this.setState({toAccount: val});
        this.__getMaxCsafLimit(val);
    }

    __getMaxCsafLimit(val, withInput = true){

        let standState = flag => {
            let {isSelf} = this.state;
            let state = this.state;
            state.getMaxCsafError = flag;
            if((!isSelf && withInput) || !withInput){
                state.isInput = true;
                state.amount = 0;
                state.percent = 0;
            }
            this.setState(state);
        };

        BalanceActions.getMaxCsafLimit(val).then(() => {
            standState(false);
        }).catch(err => {
            standState(true);
        });
    }

    render() {
        let {amount, useCsaf, toAccount, isSelf, isInput, real_csaf_collect, getMaxCsafError, percent} = this.state;
        let {title, visible, width, height} = this.props.collectWindow;
        let {fees, master, contacts, loading, max_csaf_limit} = this.props;
        if(!isSelf && getMaxCsafError){
            real_csaf_collect = 0;
        }
        return (
            <div className="popup-window">
                <Modal visible={visible} onClose={this.close.bind(this)} height={height} width={width}>
                    <div className="title">{title}</div>
                    <div className="vh-flex">
                        <div className="edit-line">
                            <label className="normal-text w-100">{this.translate("balance.csaf_collect_to")}</label>
                            <label ><input type="radio" name="collect-to" value={master}
                                                             checked={isSelf}
                                                             onChange={this.handleCsafToChange.bind(this)}/>&nbsp;&nbsp;
                                YOYOW{master}</label>
                            <label className="float-right p-r-16">
                                <input type="radio" name="collect-to" value={toAccount} checked={!isSelf}
                                       onChange={this.handleCsafToChange.bind(this)}/>&nbsp;&nbsp;
                                {visible ?
                                    <DownSelect width={260} className="selecter float-right top-sub5" isEdit={true}
                                                placeholder={this.translate("balance.csaf_placeholder_input_yoyow")} isContacts={true}
                                                onChange={this.handleContactChange.bind(this)} data={contacts}/> : ''}
                            </label>
                        </div>
                        { getMaxCsafError ? <span className="balance-limit-line error-text">{(!isSelf && toAccount) ? this.translate("balance.csaf_invalid_yoyow") : ''}</span>
                            : <span className="balance-limit-line">{(!isSelf && toAccount) ? 
                                (this.translate("balance.csaf_account_collect_limit") + '：' + Utils.formatAmount(max_csaf_limit * global.walletConfig.csaf_param, 4) + this.translate("balance.csaf_unit_text")) : ''}</span>
                        }

                        <div className="edit-line balance-m-line">
                            <label className="normal-text">{this.translate("balance.csaf_collect_text")}</label>
                            {visible ? <Seekbar className="balance-seekbar" width={300}
                                                total={real_csaf_collect * global.walletConfig.csaf_param}
                                                amount={amount} isInput={isInput}
                                                onChange={this.handleAmountChange.bind(this)}/> : ''}
                            <span className="seek-amount"><input ref="csafInput" type="text" className="csaf-input"
                                                                 value={amount}
                                                                 onChange={this.handleAmountInputChange.bind(this)}/>/{Utils.formatAmount(real_csaf_collect * global.walletConfig.csaf_param, 4)}</span>
                        </div>
                        <div className="edit-line">
                            <label className="normal-text w-100">{this.translate("layout_fees.title")}</label>
                            <label className="money-font">{useCsaf ? fees.with_csaf_fees : fees.min_fees}</label>
                            &nbsp;&nbsp;{global.walletConfig.coin_unit}
                            <label className="m-l-30" hidden={fees.use_csaf == 0}>
                            <input type="checkbox"
                                    checked={useCsaf}
                                    onChange={this.checkChangeHandle.bind(this)}/>&nbsp;&nbsp;
                                    {this.translate("layout_fees.text",{count: Utils.formatAmount(fees.use_csaf * global.walletConfig.csaf_param, 4)})}</label>
                        </div>
                    </div>
                    <div className="buttons">
                        {loading ? <TextLoading/> :
                            <input onClick={this.confirm.bind(this)} className="button-short" type="button"
                                   value={this.translate("button.ok")}/>}
                    </div>
                </Modal>
            </div>
        );
    }
}

export default connect(BalanceCsafCollect, {
    listenTo() {
        return [BalanceStore];
    },
    getProps() {
        return BalanceStore.getState();
    }
});