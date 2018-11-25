
import Utils from "../utils/Utils";
import alt from "../altInstance";
import BaseStore from "./BaseStore";
import AccountActions from "../actions/AccountActions";
import WalletDatabase from "../db/WalletDatabase";

class AccountStore extends BaseStore {
    constructor() {
        super();
        this.state = this.__getInitialState();
        this.bindListeners({
            onCreateAccount: AccountActions.createAccount
        });
    }

    __getInitialState() {
        return {
            uid: 0,
            name: "",
            owner: null
        };
    }

    onCreateAccount(newAcc) {
        if (__DEBUG__) console.log("create new account:", newAcc.uid);

        WalletDatabase.instance().walletDB().setSetting("current_wallet", `yoyow${newAcc.uid}`);
        this.setState({
            uid: newAcc.uid,
            name: `yoyo${newAcc.uid}`,
            owner: Utils.encodeBackOwner(newAcc.uid, newAcc.owner),
            secondary_private: newAcc.secondary_private
        });
    }
}

export default alt.createStore(AccountStore, "AccountStore");