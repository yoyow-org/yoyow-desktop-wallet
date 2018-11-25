import alt from "../../altInstance";
import FetchApi from "../../api/FetchApi";
import ChainApi from "../../api/ChainApi";
import SettingsStore from "../../stores/SettingsStore";
import GlobalParams from "../../utils/GlobalParams";

class ERC20GatewayActions {

    getAddrByUid(uid) {
        return (dispatch) => {
            FetchApi.get('gateway/v1/erc20/getAddrByUid', {uid}).then(ethaddr => {
                dispatch(ethaddr);
            }).catch(err => {
                dispatch(null);
                if (__DEBUG__) {
                    console.log(err);
                }
            });
        };
    }

    bindAccount(uid) {
        return (dispatch) => {
            return FetchApi.get('gateway/v1/erc20/bindAccount', {uid}).then(ethaddr => {
                dispatch(ethaddr);
            }).catch(err => {
                dispatch(null);
                if (__DEBUG__) {
                    console.log(err);
                }
            });
        };
    }

    getBalanceByUid(uid) {
        return dispatch => {
            ChainApi.getBalanceByUid(uid).then(res => {
                dispatch(res);
            }).catch(err => {
                dispatch(null);
                if (__DEBUG__){
                    console.log(err);
                }
            });
        }
    }

    __checkAddress(address) {
        return FetchApi.get('gateway/v1/erc20/checkAddress', {address}).then(res => {
            return res;
        }).catch(err => {
            return Promise.reject(1);
        });
    }

    confirmTransfer(uid, address, amount, useCsaf){
        this.loading(true);
        return dispatch => {
            return new Promise((resolve, reject) => {
                let memo = `eth#${address}`;
                let type = 'fromBalance';
                return ChainApi.processTransfer(global.walletConfig.erc20_master, amount, memo, type, useCsaf).then(op_data => {
                    dispatch({err: null, resolve, reject});
                }).catch(err => {
                    dispatch({err, resolve, reject});
                });
            });
        }
    }
    confirmTransferBts(uid, address, amount, useCsaf){
        this.loading(true);
        return dispatch => {
            return new Promise((resolve, reject) => {
                let memo = `bts#${address}`;
                let type = 'fromBalance';
                return ChainApi.processTransfer(global.walletConfig.bts_master, amount, memo, type, useCsaf).then(op_data => {
                    dispatch({err: null, resolve, reject});
                }).catch(err => {
                    dispatch({err, resolve, reject});
                });
            });
        }
    }
    getFees(toAccount, amount, memo, type) {
        this.loading(true);
        let code = 0;
        return dispatch => {
            return new Promise((resolve, reject) => {
                ChainApi.getTransferFees(toAccount, amount, memo, type).then(fees => {
                    dispatch({resolve, fees, code});
                }).catch(err => {
                    this.loading(false);
                    if (err.toString().indexOf('argument is not an account uid') >= 0) {
                        reject(1);
                    } else {
                        reject(-1);
                    }
                });
            });
        }
    }

    loading(flag){
        return flag;
    }
}

export default alt.createActions(ERC20GatewayActions);