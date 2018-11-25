import alt from "../altInstance";
import ChainApi from "../api/ChainApi";
import {ChainStore} from 'yoyowjs-lib';

class HistoryActions{

    getHistoryByUid(uid, op_type = null, start = 0){
        return dispatch => {
            Promise.all([
                ChainApi.getHistoryByUid(uid, op_type, start),
                ChainStore.fetchAccountBalances(uid, [])
            ]).then(res => {
                dispatch({
                    uid: uid,
                    data: res[0].history,
                    start: res[0].start,
                    tokens: res[1]
                });
            }).catch(err => {
                if(__DEBUG__)
                    console.log(err);
            });

        }
    }

    changeAccount(){
        return true;
    }

    changeOpType(type){
        return type;
    }

    clear(){
        return true;
    }

    lodding(){
        return null;
    }

}

export default alt.createActions(HistoryActions);