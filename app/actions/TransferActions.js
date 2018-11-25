import alt from "../altInstance";
import ChainApi from "../api/ChainApi";
import walletDatabase from "../db/WalletDatabase";
import {ChainStore} from "yoyowjs-lib";
import {remove} from 'lodash';

class TransferActions {

    getBalance(uid, asset_id) {
        return dispatch => {
            return Promise.all([
                ChainApi.getBalanceByUid(uid),
                ChainStore.fetchAccountBalances(uid, [asset_id])
            ]).then(res => {
                let balance = res[0];
                let token = res[1][0];//remove(res[1], t => { return t.symbol == symbol })[0];
                dispatch({balance, token});
            }).catch(err => {
                if(__DEBUG__)
                    console.log(err);
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

    confirmTransfer(toAccount, amount, memo, type, use_csaf, isSave, asset_id) {
        this.loading(true);
        return dispatch => {
            return new Promise((resolve, reject) => {
                ChainApi.processTransfer(toAccount, amount, memo, type, use_csaf, asset_id).then((data) => {
                    let {op_data} = data;
                    if(isSave){
                        walletDatabase.instance().walletDB().loadData('contacts', {
                            uid: op_data.to,
                            master: op_data.from
                        }).then(res => {
                            if(res.length <= 0){
                                // 将联系人加入到indexDB
                                walletDatabase.instance().walletDB().addStore('contacts', {
                                    uid: op_data.to,
                                    master: op_data.from,
                                    remark: `YOYOW${op_data.to}`,
                                    head_img: 'null',
                                    last_modified: Date.now()
                                });
                            }
                        });

                    }
                    dispatch(resolve);
                }).catch(err => {
                    this.loading(false);
                    if (__DEBUG__) {
                        console.error('TransferActions confirmTransfer error');
                        console.error(err);
                    }
                    let code = 0;
                    if(err.message){
                        if(err.message.indexOf('Insufficient Balance') >= 0){
                            code = 1;
                        }
                    }
                    reject(code);
                });
            });

        }
    }

    checkAccount(uid) {
        return ChainApi.getAccountByUid(uid);
    }
    loading(flag){
        return flag;
    }

}

export default alt.createActions(TransferActions);