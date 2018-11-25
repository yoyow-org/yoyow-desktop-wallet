import alt from "../altInstance";

class WalletUnlockActions {

    /**
     * 解锁指定密码
     * @returns {function(*)}
     */
    unlock(isShort = true) {
        return (dispatch) => {
            return new Promise((resolve, reject) => {
                dispatch({isShort, resolve, reject});
            }).then(was_unlocked => {
                if (was_unlocked) WrappedWalletUnlockActions.change();
            });
        };
    }

    /**
     * 锁定指定密码
     * @param isShort 是否锁定短密码，默认为true
     * @returns {function(*)}
     */
    lock(isShort = true) {
        return (dispatch) => {
            return new Promise(resolve => {
                dispatch({isShort, resolve});
            }).then(was_unlocked => {
                if (was_unlocked) WrappedWalletUnlockActions.change();
            });
        };
    }

    lockall(){
        return (dispatch) => {
            return new Promise(resolve => {
                dispatch({resolve});
            }).then(was_unlocked => {
                if (was_unlocked) WrappedWalletUnlockActions.change();
            });
        };
    }

    /**
     * 取消
     * @returns {boolean}
     */
    cancel() {
        return true;
    }

    /**
     * 通知改变状态
     * @returns {boolean}
     */
    change() {
        return true;
    }

    passwordChange(password){
        return password;
    }
}
var WrappedWalletUnlockActions = alt.createActions(WalletUnlockActions)
export default WrappedWalletUnlockActions;