
import alt from "../../altInstance";
import BaseStore from "../BaseStore";
import ERC20GatewayActions from "../../actions/gateway/ERC20GatewayActions";

class ERC20GatewayStore extends BaseStore {
    constructor() {
        super();
        this.state = {
            ethaddr: null, 
            error: null, 
            balance: {}, 
            loading: false,
            fees: {
                min_fees: 0,
                min_real_fees: 0,
                use_csaf: 0,
                with_csaf_fees: 0
            }
        };
        this.bindActions(ERC20GatewayActions);
    }

    onGetAddrByUid(ethaddr) {
        if (ethaddr && ethaddr.code == 0) {
            this.setState({ethaddr: ethaddr.data});
        } else {
            this.setState({ethaddr: null, error: ethaddr});
        }
    }

    onBindAccount(ethaddr) {
        if (ethaddr && ethaddr.code == 0) {
            this.setState({ethaddr: ethaddr.data});
        } else {
            this.setState({error: ethaddr});
        }
    }
    
    onGetBalanceByUid(balance){
        if(balance){
            this.setState({balance: balance})
        }
    }

    onConfirmTransfer({err, resolve, reject}){
        if(err){
            let code = 0;
            if(err.message){
                if(err.message.indexOf('Insufficient Balance') >= 0){
                    code = 2;
                }else if(err.message.indexOf("'toUncompressed' of null") >= 0){
                    code = 3;
                }
            }else{
                code = err;
            }
            reject(code);
        }else{
            resolve();
        }
        this.setState({loading: false});
    }
    onConfirmTransferBts({err, resolve, reject}){
        if(err){
            let code = 0;
            if(err.message){
                if(err.message.indexOf('Insufficient Balance') >= 0){
                    code = 2;
                }else if(err.message.indexOf("'toUncompressed' of null") >= 0){
                    code = 3;
                }
            }else{
                code = err;
            }
            reject(code);
        }else{
            resolve();
        }
        this.setState({loading: false});
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

    onLoading(flag){
        this.setState({loading: flag});
    }

}

export default alt.createStore(ERC20GatewayStore, "ERC20GatewayStore");