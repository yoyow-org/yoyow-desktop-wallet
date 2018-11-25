import alt from '../altInstance';
import ChainApi from '../api/ChainApi';
import validation from "../utils/Validation";
import walletDatabase from "../db/WalletDatabase";
import { dispatch } from 'alt/lib/utils/AltUtils';
import {ChainStore} from "yoyowjs-lib";
import {remove} from "lodash";

class BalanceActions{

    getBalance(uid){
        return dispatch => {

            return Promise.all([
                ChainApi.getBalanceByUid(uid),
                ChainStore.fetchAccountBalances(uid, [])
            ]).then(res => {
                let balance = res[0];
                let tokens = res[1];
                dispatch({balance, tokens});
            }).catch(err => {
                if(__DEBUG__) console.log(err);
            });
        };
    }

    getFees(to_account, amount, type){
        return dispatch => {
            ChainApi.getTransferFees(to_account, amount, null, type).then(res => {
                dispatch(res);
            }).catch(err => {
                if(__DEBUG__){
                    console.log(err);
                }
            });
        }
    }

    getCsafFees(to_account, amount){
        return dispatch => {
            return new Promise((resolve, reject) => {
                ChainApi.getCsafCollectFees(to_account, amount).then(fees => {
                    dispatch({resolve, fees});
                }).catch(err => {
                    reject(1);
                });
            });

        }
    }

    confirmTransfer(to_account, amount, memo, type, use_csaf){
        this.loading(true);
        return dispatch => {
            return new Promise((resolve, reject) => {
                ChainApi.processTransfer(to_account, amount, memo, type, use_csaf).then(res => {
                    this.loading(false);
                    dispatch(resolve);
                }).catch(err => {
                    this.loading(false);
                    if(__DEBUG__){
                        console.log('内部转账失败');
                        console.log(err);
                    }
                    reject(1)
                });
            });
        }
    }

    getContacts(master, keywords){
        return dispatch => {
            walletDatabase.instance().walletDB().loadData('contacts', {
                master: master
            })
                .then(res => {
                    if(validation.isEmpty(keywords)){
                        dispatch(res);
                    }else{
                        let data = [];
                        for(let obj of res){
                            if(obj.uid.toString().indexOf(keywords) >= 0 || obj.remark.indexOf(keywords) >= 0){
                                data.push(obj);
                            }
                        }
                        dispatch(data);
                    }
                }).catch(err => {
                    dispatch(err.message);
                });
        };
    }

    confirmCsafCollect(to_account, amount, use_csaf){
        this.loading(true);
        return dispatch => {
            return new Promise((resolve, reject) => {
                ChainApi.processCsafCollect(to_account, amount, use_csaf).then(res => {
                    this.loading(false);
                    dispatch(resolve);
                }).catch(err => {
                    this.loading(false);
                    if(__DEBUG__){
                        console.log('领取积分失败');
                        console.log(err);
                    }
                    if(err.message.indexOf('Maximum CSAF per account') >= 0){
                        reject(1); //达到币龄采集上限
                    }else if(err.message.indexOf('YOYO is less than required') >= 0){
                        reject(2); //积分不足
                    }else if(err.message.indexOf('Time should not be') >= 0){
                        reject(3); //与链上时间不匹配
                    }else{
                        reject(-1);
                    }
                });
            });
        }
    }

    openTransfer(isShort, title){
        return {isShort, title} ;
    }

    openCollect(title){
        return title;
    }

    openPledge(is_witness, title, pledge, pledge_type, min_pledge){
        return {is_witness, title, pledge, pledge_type, min_pledge};
    }

    getMaxCsafLimit(uid){
        return dispatch => {
            return new Promise((resolve, reject) => {
                ChainApi.getBalanceByUid(uid).then(res => {
                    let balance = res;
                   dispatch({balance, resolve});
                }).catch(err => {
                    reject(err);
                });
            });
        }
    }

    getPledgeFees(pledge_type){
        return dispatch => {
            ChainApi.getPledgeFees(pledge_type).then(res => {
                dispatch(res);
            }).catch(err => {
                if(__DEBUG__){
                    console.log(err);
                }
            });
        }
    }

    confirmUpdatePledge(amount, pledge_type, use_csaf){
        this.loading(true);
        return dispatch => {
            return new Promise((resolve, reject) => {
                ChainApi.processUpdatePledge(amount, pledge_type, use_csaf).then(res => {
                    this.loading(false);
                    dispatch(resolve);
                }).catch(err => {
                    this.loading(false);
                    if(__DEBUG__){
                        console.log('修改抵押失败');
                        console.log(err);
                    }
                    if(err.message.indexOf('not found') > 0){
                        reject(1);
                    }else{
                        reject(-1);
                    }
                });
            });
        }
    }

    /**
     * 关闭弹窗
     * @param windowName 弹窗名称
     */
    closeDialog(windowName){
        return windowName;
    }

    loading(flag){
        return flag;
    }
}

export default alt.createActions(BalanceActions);