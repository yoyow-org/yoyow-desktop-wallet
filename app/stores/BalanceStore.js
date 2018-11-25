import alt from "../altInstance";
import BaseStore from "./BaseStore";
import BalanceActions from "../actions/BalanceActions";
import Utils from "../utils/Utils";
import {ChainStore} from "yoyowjs-lib";
import {remove} from 'lodash';

class BalanceStore extends BaseStore{
    constructor(){
        super();
        this.bindActions(BalanceActions);
        this.state = {
            balance: {},
            fees: {},
            loading: false,
            max_csaf_limit: 0,
            transferWindow: this.__initPupWindow(),
            collectWindow: this.__initPupWindow(),
            pledgeWindow: this.__initPupWindow()
        }
    }

    onGetBalance({balance, tokens}){
        remove(tokens, t => {
            return t.amount == 0;
        });
        tokens.sort((t1, t2) => {
            
            return Utils.formatToken(t2.amount, t2.precision) - Utils.formatToken(t1.amount, t1.precision);
        })
        this.setState({
            balance, tokens,
            max_csaf_limit: balance.max_csaf_limit,
        });
    }

    onGetFees(data){
        this.setState({fees: data});
    }

    onGetCsafFees({resolve, fees}){
        if(resolve)
            this.setState({ fees: fees });
            resolve(fees);
    }

    onConfirmTransfer(resolve){
        if(resolve){
            resolve();
        }
    }

    onGetContacts(contacts){
        let data = [];
        for(let c of contacts){
            data.push({
                text: c.uid,
                value: c.uid,
                remark: c.remark,
            });
        }
        this.setState({contacts: data});
    }

    onConfirmCsafCollect(resolve){
        if(resolve){
            resolve();
        }
    }

    onGetMaxCsafLimit({balance, resolve}){
        let max = balance.max_csaf_limit - balance.csaf_balance;
        this.setState({
            max_csaf_limit: balance.max_csaf_limit,
            max_csaf_collect: Utils.formatAmount(max.toFixed(5))
        });
        resolve();
    }

    __initPupWindow(isTransfer, visible = false, title = ''){
        return {
            visible: visible,
            title: title,
            height: isTransfer ? 240 : 320,
            width: 630,
        };
    }

    onOpenTransfer({isShort, title}){
        let dialogProps = this.__initPupWindow(true, true, title, 500);
        this.setState({transferWindow: dialogProps, isShort: isShort});
    }

    onOpenCollect(title){
        let dialogProps = this.__initPupWindow(false, true, title);
        this.setState({collectWindow: dialogProps});
    }

    onOpenPledge({is_witness, title, pledge, pledge_type, min_pledge}){
        let dialogProps = this.__initPupWindow(false, true, title);
        this.setState({is_witness: is_witness, pledgeWindow: dialogProps, pledge: pledge, pledge_type: pledge_type, min_pledge: min_pledge});
    }

    onCloseDialog(windowName){
        let s = {};
        s[windowName] = this.__initPupWindow(windowName != 'collectWindow');
        this.setState(s);
    }

    onLoading(flag){
        this.setState({ loading: flag});
    }

    onGetPledgeFees(fees){
        this.setState({fees: fees});
    }

    onConfirmUpdatePledge(resolve){
        if(resolve){
            resolve();
        }
    }
}

export default alt.createStore(BalanceStore, 'BalanceStore');
