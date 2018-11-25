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

class BalanceUpdatePledge extends BaseComponent{
    constructor(){
        super();
        this.state = this.__initPledge();
    }

    __initPledge(){
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
        let {amount, useCsaf} = this.state;
        let {balance, pledge, min_pledge, fees} = this.props;
        let max_pledge = pledge + balance.core_balance;
        max_pledge = Utils.formatAmount(max_pledge);
        let require_amount = parseFloat(amount) + Utils.formatAmount(useCsaf ? fees.with_csaf_fees : fees.min_fees);
        require_amount = Utils.formatAmount(require_amount);
        if(amount < min_pledge){
            ConfirmActions.alert(this.translate("balance.alert_min_pledge",{amount: min_pledge, unit: global.walletConfig.coin_unit}));
        }else if(require_amount > max_pledge){
            ConfirmActions.alert(this.translate("balance.alert_balance_not_enough"));
        }else if(!useCsaf && balance.core_balance < fees.min_fees){
            ConfirmActions.alert(this.translate("balance.alert_balance_cant_pay"));
        }else{
            if(WalletStore.isLocked(false)){
                WalletUnlockActions.unlock(false).then(() => {
                    this.__confirm();
                })
            }else{
                this.__confirm();
            }
        }
    }

    __confirm(){
        let {amount, useCsaf} = this.state;
        let {is_witness, master, pledge_type} = this.props;
        BalanceActions.confirmUpdatePledge(amount, pledge_type, useCsaf).then(res => {
            this.close();
            BalanceActions.getBalance(master);
            NotificationActions.success((this.translate("balance.change_pledge") + this.translate("balance.success")));
        }).catch(code => {
            if(code == 1){
                ConfirmActions.error(is_witness ? this.translate("balance.error_invalid_witness") : this.translate("balance.error_invalid_committee"));
            }else{
                ConfirmActions.error(this.translate("balance.error_update_pledge"));
            }
        });
    }

    close(){
        this.setState(this.__initPledge());
        BalanceActions.closeDialog('pledgeWindow');
    }

    render(){
        let {useCsaf, amount} = this.state;
        let {title, visible, width, height} = this.props.pledgeWindow;
        let {balance, fees, isShort, loading, pledge, min_pledge} = this.props;
        let max_pledge = pledge + balance.core_balance;
        max_pledge = Utils.formatAmount(max_pledge);
        if(!balance) balance = {};
        if(!fees) feees = {};

        return(
            <div className="popup-window">
                <Modal visible={visible} onClose={this.close.bind(this)} height={height} width={width}>
                    <div className="title">{title}</div>
                    <div className="vh-flex">
                        <div className="edit-line" >
                            <label className="normal-text w-115">{this.translate("balance.current_pledge_price")}:</label>
                            <label className="normal-text">{pledge}&nbsp;{global.walletConfig.coin_unit}</label>
                        </div>
                        <div className="edit-line" >
                            <label className="normal-text w-115">{this.translate("balance.max_pledge_price")}:</label>
                            <label className="normal-text">{max_pledge}&nbsp;{global.walletConfig.coin_unit}</label>
                        </div>
                        <div className="edit-line" >
                            <label className="normal-text w-115">{this.translate("balance.min_pledge_price")}:</label>
                            <label className="normal-text ">{min_pledge}&nbsp;{global.walletConfig.coin_unit}</label>
                        </div>
                        <div className="edit-line">
                            <label className="normal-text w-115">{this.translate("balance.upadte_pledge_price")}:</label>
                            <input type="text" className="input-460 " placeholder={this.translate("balance.place_holder_pledge_price")} name="amount" value={amount} onChange={this.handleAmountChange.bind(this)}/>
                        </div>
                        <div className="edit-line">
                            <label className="normal-text w-115">{this.translate("layout_fees.title")}</label>
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

export default connect(BalanceUpdatePledge, {
    listenTo() {
        return [BalanceStore];
    },
    getProps() {
        return BalanceStore.getState();
    }
});