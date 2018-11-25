import React from "react";
import BaseComponent from "../BaseComponent";
import Modal from "../Layout/Modal";
import {connect} from "alt-react";
import BalanceActions from '../../actions/BalanceActions';
import BalanceStore from '../../stores/BalanceStore';
import Validation from '../../utils/Validation';
import ConfirmActions from '../../actions/layout/ConfirmActions';
import TextLoading from "../Layout/TextLoading";
import NotificationActions from "../../actions/NotificationActions";
import Utils from "../../utils/Utils";
import globalParams from "../../utils/GlobalParams";
import WalletStore from '../../stores/WalletStore';
import WalletUnlockActions from '../../actions/WalletUnlockActions';
import {round, remove} from 'lodash';

class BalanceTransfer extends BaseComponent{
    constructor(){
        super();
        this.state = this.__initTransfer();
    }

    __initTransfer(){
        return {
            useCsaf: true,
            amount: 0
        }
    }

    handleAmountChange(e){
        let val = e.target.value;
        if (Validation.isNumber(val)) {
            val = Utils.formatAmount(val);
            this.setState({amount: val});
        }
    }

    checkChangeHandle(e){
        this.setState({ useCsaf: e.target.checked });
    }

    confirm(){
        let {tokens} = this.props;
        let token = remove(tokens, t => { return t.asset_id == 0 })[0];
        let {amount, useCsaf} = this.state;
        let {master, isShort, fees, balance} = this.props;
        amount = parseFloat(amount);
        let memo = isShort ? this.translate("balance.memo_to_balance") : this.translate("balance.memo_to_prepaid");
        let type = isShort ? 'toBalance' : 'toPrepaid';
        let requireAmount = amount; //实际操作需要金额 含手续费
        requireAmount += useCsaf ? fees.with_csaf_fees : fees.min_fees;
        if(Validation.isEmpty(amount)){
            ConfirmActions.alert(this.translate("balance.alert_invalid_amount"));
        }else if(isShort && requireAmount > balance.prepaid_balance){
            ConfirmActions.alert(this.translate("balance.alert_prepaid_cant_pay"));
        }else if(!isShort && requireAmount > balance.core_balance){
            ConfirmActions.alert(this.translate("balance.alert_balance_cant_pay"));
        }else{
            let confirmTransfer = () => {
                //待解锁弹窗关闭动画结束后执行确认操作
                setTimeout(() => {
                    BalanceActions.confirmTransfer(master, round(amount * Utils.precisionToNum(token.precision)), '', type, useCsaf)
                        .then(() => {
                            this.close();
                            BalanceActions.getBalance(master);
                            NotificationActions.success((memo + this.translate("balance.success")));
                        }).catch(code => {
                            ConfirmActions.error((memo + this.translate("balance.failure")));
                    });
                }, 300);
            };
            if(WalletStore.isLocked(isShort)){
                WalletUnlockActions.unlock(isShort).then(() => {
                    confirmTransfer();
                })
            }else{
                confirmTransfer();
            }
        }
    }

    close(){
        this.setState(this.__initTransfer());
        BalanceActions.closeDialog('transferWindow');
    }

    render(){
        let {useCsaf, amount} = this.state;
        let {title, visible, width, height} = this.props.transferWindow;
        let {balance, fees, isShort, loading} = this.props;
        if(!balance) balance = {};
        if(!fees) fees = {};
        return(
            <div className="popup-window">
                <Modal visible={visible} onClose={this.close.bind(this)} height={height} width={width}>
                    <div className="title">{title}</div>
                    <div className="vh-flex">
                        <div className="edit-line" >
                            <label className="normal-text">{this.translate("balance.transfer_amount")}</label>
                            <input type="text" className="input-460 m-l-30" placeholder={this.translate("balance.placeholder_transfer_amount")} name="amount" value={amount} onChange={this.handleAmountChange.bind(this)}/>
                        </div>
                        <div className="edit-line">
                            <label className="normal-text w-82">{this.translate("layout_fees.title")}</label>
                            <label className="money-font">{useCsaf ? fees.with_csaf_fees : fees.min_fees}</label>
                            &nbsp;&nbsp;{global.walletConfig.coin_unit}
                            <label className="m-l-30" hidden={fees.use_csaf == 0}><input type="checkbox" checked={useCsaf} onChange={this.checkChangeHandle.bind(this)}/>&nbsp;&nbsp;{this.translate("layout_fees.text",{count: Utils.formatAmount(fees.use_csaf * global.walletConfig.csaf_param, 4)})}</label>
                        </div>
                    </div>
                    <div className="buttons">
                        {loading ? <TextLoading/> : <input onClick={this.confirm.bind(this)} className="button-short" type="button" value={this.translate("button.ok")}/>}
                    </div>
                </Modal>
            </div>
        );
    }
}

export default connect(BalanceTransfer, {
    listenTo() {
        return [BalanceStore];
    },
    getProps() {
        return BalanceStore.getState();
    }
});