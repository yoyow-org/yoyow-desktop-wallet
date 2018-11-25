
import React from "react";
import BaseComponent from "../BaseComponent";
import {connect} from "alt-react";
import BalanceActions from '../../actions/BalanceActions';
import BalanceStore from '../../stores/BalanceStore';
import WalletStore from '../../stores/WalletStore';
import ConfirmActions from '../../actions/layout/ConfirmActions';
import BalanceTransfer from './BalanceTransfer';
import BalanceCsafCollect from './BalanceCsafCollect';
import BalanceUpdatePledge from './BalanceUpdatePledge';
import globalParams from '../../utils/GlobalParams';
import Utils from "../../utils/Utils";
import {ChainStore} from 'yoyowjs-lib';
import {Long} from 'bytebuffer';

class BalanceContainer extends BaseComponent {
    constructor() {
        super();
        this.state = this.__initState();
        this.timeTask = setInterval(() => {
            BalanceActions.getBalance(this.state.master);
        }, global.walletConfig.balance_task_timeout);
        BalanceActions.getBalance(this.state.master);
        BalanceActions.getMaxCsafLimit(this.state.master);
    }

    componentWillReceiveProps(nextProps) {
        let {yoyow_id} = nextProps.wallet;
        if (yoyow_id && this.state.master != yoyow_id) {
            this.setState({ master: yoyow_id });
            BalanceActions.getBalance(yoyow_id);
            BalanceActions.getMaxCsafLimit(yoyow_id);
        }

        let {max_csaf_collect, max_csaf_limit, balance} = nextProps;
        let real_csaf_collect = max_csaf_limit;

        real_csaf_collect = Math.min(max_csaf_collect, real_csaf_collect);
        real_csaf_collect = Math.min(balance.csaf_collect / global.walletConfig.csaf_param, real_csaf_collect);
        if (this.state.real_csaf_collect != real_csaf_collect) {
            this.setState({
                real_csaf_collect: parseFloat(real_csaf_collect),
            });
        }
    }

    __initState(){
        return {
            master: WalletStore.getWallet().yoyow_id,
            description: '',
            unlockResult: '',
            amount: 0,
            useCsaf: true, //是否使用积分
            isSelf: true, //是否领取积分到自己
            real_csaf_collect: 0
        }
    }

    /**
     * 余额与零钱互转
     * @param e
     */
    onInnerTransfer(e) {
        let {balance} = this.props;
        let { master, amount} = this.state;
        let isShort = e.target.getAttribute('data-ctrl') == 'from_prepaid';
        this.checkAccountValid(() => {

            // 零钱到余额，零钱为0 || 余额到零钱，余额为0
            if ((isShort && balance.prepaid_balance == 0) || (!isShort && balance.core_balance == 0)) {
                let msg = isShort ? this.translate("balance.alert_prepaid_not_enough") : this.translate("balance.alert_balance_not_enough");
                ConfirmActions.alert(msg);
                return;
            }

            let dialog_title = isShort ?  this.translate("balance.transfer_to_balance") : this.translate("balance.transfer_to_prepaid");
            BalanceActions.getFees(master, amount, isShort ? 'toBalance' : 'toPrepaid');
            BalanceActions.openTransfer(isShort, dialog_title);
        });
    }

    /**
     * 打开领取积分
     */
    onCollectCsaf() {
        let {master} = this.state;
        let {balance} = this.props;
        if(balance.csaf_collect == 0){
            ConfirmActions.alert(this.translate("balance.alert_empty_csaf"));
            return;
        }

        BalanceActions.getCsafFees(master, 0).then(fees => {
            BalanceActions.getMaxCsafLimit(master);
            BalanceActions.openCollect(this.translate("balance.csaf_collect_title"));
            BalanceActions.getContacts(master);
        }).catch(code => {
            ConfirmActions.error(this.translate("error.get_fees_error"));
        });
    }

    onChangePledge(e) {
        let {balance} = this.props;
        let {master, amount} = this.state;
        let is_witness = e.target.getAttribute('data-ctrl') == 'witness';
        let title = is_witness ? this.translate("balance.witness_pledge") : this.translate("balance.committee_member_pledge");
        let pledge = is_witness ? balance.total_witness_pledge : balance.total_committee_member_pledge;
        let pledge_type = is_witness ? 'witness_update' : 'committee_member_update';
        let min_pledge = is_witness ? global.walletConfig.min_witness_pledge : global.walletConfig.min_committee_member_pledge;
        BalanceActions.getPledgeFees(pledge_type);
        BalanceActions.openPledge(is_witness, title, pledge, pledge_type, min_pledge);
    }

    /**
     * 跳转到转账页面
     */
    toTransfer(e){
        this.routerPush('/transfer?from='+e.target.getAttribute('data-ctrl'));
    }

    toERC20(){
        this.routerPush('/ERC20Gateway');
    }

    issueToken(){
        this.routerPush('/token');
    }

    componentWillUnmount(){
        clearInterval(this.timeTask);
    }

    render() {
        let {master, real_csaf_collect} = this.state;
        let {balance, tokens} = this.props;
        return(
            <div className="layer-settings">
                <table className="content-table" cellSpacing="0">
                    <thead className="balance-title" >
                        <tr><td colSpan={3}>{this.translate("balance.assets_title")}<a className="float-right font-btn m-t-0 hover-hand" onClick={this.issueToken.bind(this)}>{this.translate("balance.create_token")}</a></td></tr>
                    </thead>
                    <thead>
                    <tr>
                        <th width={200}>{this.translate("balance.assets_type")}</th>
                        <th>{this.translate("balance.assets_amounts")}</th>
                        <th width={260}>{this.translate("balance.assets_operation")}</th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr>
                        <td>{this.translate("balance.balance")}</td>
                        <td>{balance.core_balance}&nbsp;{global.walletConfig.coin_unit}</td>
                        <td>
                            <input type="button" value={this.translate("balance.transfer")} className="button" data-ctrl="balance" onClick={this.toTransfer.bind(this)}/>
                            <input type="button" value={this.translate("balance.transfer_to_prepaid")} className="button m-l-30" data-ctrl="from_balance" onClick={this.onInnerTransfer.bind(this)}/>
                        </td>
                    </tr>
                    <tr>
                        <td>{this.translate("balance.prepaid")}</td>
                        <td>{balance.prepaid_balance}&nbsp;{global.walletConfig.coin_unit}</td>
                        <td>
                            <input type="button" value={this.translate("balance.transfer")} className="button" data-ctrl="prepaid" onClick={this.toTransfer.bind(this)}/>
                            <input type="button" value={this.translate("balance.transfer_to_balance")} className="button m-l-30" data-ctrl="from_prepaid" onClick={this.onInnerTransfer.bind(this)}/>
                        </td>
                    </tr>
                    {
                        !tokens ? null : 
                        tokens.map((t, inx) => {
                            return t.asset_id != 0 ? (<tr key={'tokens'+inx}>
                                <td>{t.symbol}</td>
                                <td>{Utils.formatToken(t.amount, t.precision).toString()}&nbsp;{t.symbol}</td>
                                <td>
                                    <input type="button" value={this.translate("balance.transfer")} className="button" data-ctrl={t.asset_id} onClick={this.toTransfer.bind(this)}/>
                                </td>
                            </tr>) : null
                        })
                    }
                    </tbody>
                </table>
                <table className="content-table" cellSpacing="0">
                    <thead className="balance-title" >
                        <tr>
                            <td colSpan={3}>{this.translate("balance.csaf_title")}</td>
                        </tr>
                    </thead>
                    <thead>
                    <tr>
                        <th width={200}>{this.translate("balance.csaf_current_limit")}</th>
                        <th>{this.translate("balance.csaf_gather")}</th>
                        <th width={260}>{this.translate("balance.csaf_collect")}</th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr>
                        <td>{Utils.formatAmount(balance.csaf_balance * global.walletConfig.csaf_param, 4)}/{Utils.formatAmount(balance.max_csaf_limit * global.walletConfig.csaf_param, 4)}</td>
                        <td>{balance.csaf_accumulate}/{this.translate("balance.day")}</td>
                        <td>{Utils.formatAmount(real_csaf_collect * global.walletConfig.csaf_param, 4)}（<a className="font-btn m-t-0 hover-hand" onClick={this.onCollectCsaf.bind(this)}>{this.translate("balance.click_collect")}</a>）</td>
                    </tr>
                    </tbody>
                </table>
                {
                    balance.is_pledge ? 
                    <table className="content-table" cellSpacing="0">
                        <thead className="balance-title" >
                            <tr><td colSpan={4}>{this.translate("balance.pledge_title")}</td></tr>
                        </thead>
                        <thead>
                            <tr>
                                <th width={140}>{this.translate("balance.pledge_type")}</th>
                                <th>{this.translate("balance.pledge_price")}</th>
                                <th>{this.translate("balance.releasing_price")}</th>
                                <th width={130}>{this.translate("balance.assets_operation")}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {
                                balance.is_witness ?
                                <tr>
                                    <td>{this.translate("balance.witness_pledge")}</td>
                                    <td>{balance.total_witness_pledge}</td>
                                    <td>{balance.releasing_witness_pledge}</td>
                                    <td><input type="button" value={this.translate("balance.change_pledge")} className="button" data-ctrl="witness" onClick={this.onChangePledge.bind(this)} /></td>
                                </tr> : null
                            }
                            {
                                balance.is_committee ? 
                                <tr>
                                    <td>{this.translate("balance.committee_member_pledge")}</td>
                                    <td>{balance.total_committee_member_pledge}</td>
                                    <td>{balance.releasing_committee_member_pledge}</td>
                                    <td><input type="button" value={this.translate("balance.change_pledge")} className="button" data-ctrl="committee" onClick={this.onChangePledge.bind(this)} /></td>
                                </tr> : null
                            }
                            
                        </tbody>
                    </table> 
                    : null
                }
                
                <BalanceTransfer master={master} />
                <BalanceCsafCollect master={master}/>
                <BalanceUpdatePledge master={master}/>
            </div>
        );
    }
}

const stores = [BalanceStore, WalletStore];

export default connect(BalanceContainer, {
    listenTo(){
        return stores;
    },
    getProps(){
        let result = {};
        for (let store of stores) {
            for (let props in store.getState()) {
                result[props] = store.getState()[props];
            }
        }
        return result;
    }
});
 