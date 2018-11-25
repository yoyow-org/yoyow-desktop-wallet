
import alt from "../altInstance";
import WalletActions from "./WalletActions";

class AccountActions {

    createAccount(accountPwd) {
        return (dispatch) => {
            return WalletActions.createAccount(accountPwd).then(({uid, owner, secondary_private}) => {
                dispatch({uid, owner, secondary_private});
                return {uid, owner, secondary_private};
            });
        };
    }
}

export default alt.createActions(AccountActions);