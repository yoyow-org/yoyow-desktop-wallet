
import alt from "../altInstance";
import BaseStore from "./BaseStore";
import TransactionConfirmActions from "../actions/TransactionConfirmActions";

class TransactionConfirmStore extends BaseStore {
    constructor() {
        super();
        this.bindActions(TransactionConfirmActions);
        this.state = this.getInitialState();
        this._export("reset");
    }

    getInitialState() {
        return {
            transaction: null,
            error: null,
            broadcasting: false,
            broadcast: false,
            included: false,
            trx_id: null,
            trx_block_num: null,
            closed: true,
            broadcasted_transaction: null,
            propose: false,//提议(暂未使用)
            fee_paying_account: null // 提议费支付账户(暂未使用)
        };
    }

    onConfirm({transaction}) {
        let init_state = this.getInitialState();
        let state = {...init_state, transaction: transaction, closed: false, broadcasted_transaction: null}
        this.setState(state);
    }

    onClose() {
        this.setState({closed: true});
    }

    onBroadcast(payload) {
        this.setState(payload);
        if (payload.broadcasted_transaction) {
            this.setState({
                broadcasted_transaction: this.state.transaction
            });
        }
    }

    onWasBroadcast(res) {
        this.setState({broadcasting: false, broadcast: true});
    }

    onWasIncluded(res) {
        this.setState({
            error: null,
            broadcasting: false,
            broadcast: true,
            included: true,
            trx_id: res[0].id,
            trx_block_num: res[0].block_num,
            broadcasted_transaction: this.state.transaction
        });
    }

    onError({ error }) {
        this.setState({broadcast: false, broadcasting: false, error});
    }

    reset() {
        this.state = this.getInitialState();
    }
}

export default alt.createStore(TransactionConfirmStore, "TransactionConfirmStore");