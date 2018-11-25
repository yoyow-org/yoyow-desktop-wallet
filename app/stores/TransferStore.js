
import alt from "../altInstance";
import BaseStore from "./BaseStore";
import TransferActions from "../actions/TransferActions";

class TransferStore extends BaseStore{

    constructor(){
        super();
        this.state = {
            loading: false,
            balance: {},
            fees: {
                min_fees: 0,
                min_real_fees: 0,
                use_csaf: 0,
                with_csaf_fees: 0
            }
        };
        this.bindActions(TransferActions);
    }

    onGetBalance({balance, token}){
        this.setState({ balance, token });
    }

    onGetFees({resolve, fees}){
        if(resolve){
            resolve();
            this.setState({
                fees: fees,
                loading: false
            });
        }
    }

    onConfirmTransfer(resolve){
        if(resolve){
            this.setState({ loading: false });
            resolve();
        }
    }

    onLoading(flag){
        this.setState({loading: flag});
    }

}

export default alt.createStore(TransferStore, 'TransferStore');