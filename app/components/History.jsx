import React from "react";
import BaseComponent from "./BaseComponent";
import {connect} from "alt-react";
import HistoryActions from "../actions/HistoryActions";
import HistoryStore from "../stores/HistoryStore";
import WalletStore from "../stores/WalletStore";
import WalletUnlockActions from '../actions/WalletUnlockActions';
import PrivateKeyStore from "../stores/PrivateKeyStore";
import DownSelect from "./form/DownSelect";
import ConfirmActions from "../actions/layout/ConfirmActions";

class History extends BaseComponent {
    constructor() {
        super();
        this.state = this.__initHistoryState();
        HistoryActions.getHistoryByUid(this.state.master, null, 0);
    }

    componentWillReceiveProps(nextProps){
        let {wallet} = nextProps;
        if(wallet && this.state.master != wallet.yoyow_id){
            this.setState({ master: wallet.yoyow_id });
            HistoryActions.changeAccount();
            HistoryActions.getHistoryByUid(wallet.yoyow_id, null, 0);
        }
        this.setState({ types: this.__initSelectTypes() });
    }

    componentWillUnmount(){
        HistoryActions.clear();
    }

    __initHistoryState(){
        let initState = {
            master: WalletStore.getWallet().yoyow_id,
            types: this.__initSelectTypes(),
            curType: 0
        }
        return initState;
    }

    __initSelectTypes(){
        return [
                {value: 0, text: this.translate("history.type_all")},
                {value: 1, text: this.translate("history.type_in")},
                {value: 2, text: this.translate("history.type_out")},
                {value: 3, text: this.translate("history.type_csaf")},
                {value: 4, text: this.translate("history.type_token")},
            ]
    }

    onLoadMore(){
        let {master} = this.state;
        let {source, start} = this.props;
        HistoryActions.getHistoryByUid(master, null, start);
    }

    handleTypeChange(selected){
        HistoryActions.changeOpType(selected.value);
        this.setState({curType: selected.value});
    }

    decodeMemo(memo){
        let {wallet} = this.props;
        let cur_memo_key = wallet.encrypted_memo.pubkey;
        if(cur_memo_key != memo.from && cur_memo_key != memo.to){
            ConfirmActions.alert(this.translate("error.error_account_memo"))
        }else{
            let tryDecode = new Buffer(memo.message, 'hex').toString('utf-8');
            if( tryDecode.indexOf('uncrypto') === 0){
                return ConfirmActions.alert(tryDecode.substring(8, tryDecode.length), 'memo_title');
            }
            let memoStand = () => {
                let result = PrivateKeyStore.decodeMemo(memo);
                if(result.text != '**'){
                    ConfirmActions.alert(result.text, 'memo_title');
                }
            };
            if(WalletStore.isLocked(true)){
                WalletUnlockActions.unlock(true).then(() => {
                    memoStand();
                });
            }else{
                memoStand();
            }
        }
    }

    render(){
        let {types, curType} = this.state;
        let {history, isEnd, isLoading, wallet} = this.props;
        return (
            <div className="layer-settings">
                <h3>{this.translate("history.title")}</h3>
                <DownSelect className="selecter float-right m-t-20 m-b-20" onChange={this.handleTypeChange.bind(this)} defaultObj={types[curType]} data={types}/>
                <table className="content-table m-t-20" cellSpacing={0} style={{clear: 'right'}}>
                    <thead>
                    <tr>
                        <th style={{width: '85px'}} width={80}>{this.translate("history.tab_head_type")}</th>
                        <th style={{width: '140px'}} width={140}>{this.translate("history.tab_head_change")}</th>
                        <th >{this.translate("history.tab_head_info")}</th>
                        <th >{this.translate("history.tab_head_csaf")}</th>
                        <th >{this.translate("history.tab_head_fees")}</th>
                        <th >{this.translate("history.tab_head_date")}</th>
                        <th style={{width: '80px'}} width={80}>{this.translate("history.tab_head_memo")}</th>
                    </tr>
                    </thead>
                    <tbody>
                    {
                        history.length == 0 ? (<tr><td colSpan={7} className="text-center">{this.translate("history.text_empty_data")}</td></tr>)
                            : history.map(op => {
                            return (<tr key={'history'+Date.now()+Math.random()}>
                                <td style={{width: '85px'}}>{this.translate(["history.op_type", op.type])}</td>
                                <td>
                                    {op.changeMemo.length == 0 ? (<span>{this.translate("history.text_none")}</span>) :
                                        op.changeMemo.map(c => {
                                        return (<span className="span-inline" key={'history'+Date.now()+Math.random()}>
                                            <span className="blue-font">{
                                                (c.mark == 'balance' || c.mark == 'prepaid') ? this.translate(["history.op_change", c.mark]) :
                                                c.mark
                                                }：</span>
                                            <span style={{display:"inline-block"}}><span className="symbol-text">{c.symbol}</span>{c.amount}</span>
                                            </span>)
                                    })}
                                </td>
                                <td style={{width: '200px'}}>
                                    {   op.type == '4' ? this.translate(["history.op_transfer",op.transferType],{token: op.transferMemo}) :
                                        op.from == op.to ? 
                                            this.translate(["history.op_transfer",op.transferType],{amount: op.transferMemo}) :
                                            (<div ><span className="green-font">#{op.from}</span>&nbsp;<span>{this.translate(["history.op_transfer",op.transferType],{amount: op.transferMemo})}
                                            &nbsp;{this.translate("history.text_to")}&nbsp;
                                            </span><span className="green-font">#{op.to}</span></div>)

                                    }
                                </td>
                                <td>{op.csaf}</td>
                                <td>{this.translate(["history.op_fees",op.feesMemo])}</td>
                                <td>{op.time}</td>
                                <td style={{width: '80px'}}>{!op.memo ? '' : (<span className="font-btn hover-hand" onClick={this.decodeMemo.bind(this, op.memo)}>{this.translate("history.text_view")}</span>)}</td>
                            </tr>)
                        })
                    }
                    </tbody>
                </table>

                <div className="m-t-20 text-center">
                    <span className="normal-text hover-hand font-btn" hidden={ isEnd || isLoading} onClick={this.onLoadMore.bind(this)}>{this.translate("history.text_load_more")}</span>
                    <span className="normal-text green-font" hidden={ !isLoading}>{this.translate("history.text_loading")}</span>
                    <span className="normal-text green-font" hidden={ !isEnd}>{this.translate("history.text_load_done")}</span>
                </div>
            </div>
        );
    }
}

const stores = [HistoryStore, WalletStore];

export default connect(History, {
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