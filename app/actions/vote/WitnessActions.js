import alt from '../../altInstance';
import ChainApi from '../../api/ChainApi'
class WitnessActions {
    getBalance(uid) {
        return dispatch => {
            return ChainApi.getBalanceByUid(uid).then(res => {
                dispatch(res);
                return res
            }).catch(err => {
                if (__DEBUG__) {
                    console.log(err);
                }
            });
        };
    }
    getAccountVoteInfo(uid) {
        return (dispatch) => {
            return ChainApi.getVoteInfo(uid).then(res => {
                dispatch(res);
                return res
            }).catch(rej => {
                return rej
            })
        };
    };
    getLastVoteTime(block){
        return ChainApi.getBlockInfo(block).then(res=>{
            return res
        })
    }
    checkAccount(uid) {
        return ChainApi.getAccountByUid(uid).catch(rej=>{
            return rej
        })
    }
    getVotePrams() {
        return dispatch => {
            return ChainApi.getVotePrams().then(res => {
                dispatch(res);
                return res
            })
        }
    }
    confirmProxy(proxy,useCsaf,useBalance) {
        return ChainApi.processProxy(proxy,useCsaf,useBalance)
    }
    confirmWitnessVote(adds,removes,useCsaf,useBalance) {
        return ChainApi.witnessVote(adds,removes,useCsaf,useBalance)
    }
    confirmCommitteeVote(cadds,cremoves,useCsaf,useBalance) {
        return ChainApi.committeeVote(cadds,cremoves,useCsaf,useBalance)
    }
    getWitnessList(){
        return (dispatch) => {
            return ChainApi.getAllWitness().then(res => {
                dispatch(res);
                return res
            }).catch(rej => {
                if (__DEBUG__) {
                    console.log(rej);
                }
            })
        };
    }
    getCommitteeList(){
        return (dispatch) => {
            return ChainApi.getCommittee().then(res => {
                dispatch(res);
                return res
            }).catch(rej => {
                if (__DEBUG__) {
                    console.log(rej);
                }
            })
        };
    }
    tabCtr(c){
        return (dispatch) => {
            let t = c;
            dispatch(t)
        };
    }
    getFees(uid,uid_target,adds,removes,op_type){
        return dispatch => {
            return ChainApi.getFees(uid,uid_target,adds,removes,op_type).then(fees => {
                dispatch(fees);
                return fees
            }).catch(err => {
                return err
            });
        }
    }
    openConfirm(data){
        return dispatch => {
            return new Promise((resolve,reject) =>{
                dispatch({data, resolve, reject});
            })
        }
    }
    closeConfirm(){
        return dispatch => {
            dispatch(false)
        }
    }
    passwordChange(password){
        return password;
    }

}
export default alt.createActions(WitnessActions);