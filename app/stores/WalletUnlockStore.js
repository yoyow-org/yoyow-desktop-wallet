
import alt from "../altInstance";
import BaseStore, {STORAGE_KEY} from "./BaseStore";
import WalletStore from "./WalletStore";
import WalletUnlockActions from "../actions/WalletUnlockActions";
import ls from "../../lib/localStorage";

let ss = new ls(STORAGE_KEY);

class WalletUnlockStore extends BaseStore {
    constructor() {
        super();
        this.bindActions(WalletUnlockActions);
        this.state = {
            locked: true, shortLocked: true,
            actionIsShort: true,                 //用于处理action转入的解锁标记
            password_input: ''
        };
        this.walletLockTimeout = this.__getTimeout(); // seconds (1 minutes
        this.timeout = null;
        this.shortTimeout = null;
        this._export("__setLockTimeout");
    }

    __getTimeout() {
        return parseInt(ss.get("lockTimeout", 60), 10);
    }

    __setLockTimeout(isShort) {
        this.__clearLockTimeout(isShort);
        this.timeout = setTimeout(() => {
            if (!WalletStore.isLocked(isShort)) {
                if (__DEBUG__) console.log("auto locking after", this.walletLockTimeout, "s");
                WalletStore.onLock(isShort);
                if (!isShort)
                    this.setState({
                        locked: true, actionIsShort: isShort, resolve: null,
                        reject: null,
                    });
                else
                    this.setState({
                        shortLocked: true, actionIsShort: isShort, resolve: null,
                        reject: null,
                    });
            }
        }, this.walletLockTimeout * 1000);
    }

    __clearLockTimeout(isShort) {
        if (!isShort) {
            if (this.timeout) {
                clearTimeout(this.timeout);
                this.timeout = null;
            }
        } else {
            if (this.shortTimeout) {
                clearTimeout(this.shortTimeout);
                this.shortTimeout = null;
            }
        }
    }

    onUnlock({isShort, resolve, reject}) {
        if (__DEBUG__) console.log(`onUnlock isShort=${isShort} `, WalletStore.isLocked(isShort));

        this.__setLockTimeout(isShort);
        if (!WalletStore.isLocked(isShort)) {
            resolve();
            return;
        }
        this.setState({
            resolve, reject, locked: WalletStore.isLocked(false), shortLocked: WalletStore.isLocked(),
            actionIsShort: isShort,
            password_input: ''// 每次打开解锁弹窗的时候，清空密码框
        });
    }

    onLock({isShort, resolve}) {
        if (WalletStore.isLocked(isShort)) {
            resolve();
            return;
        }
        WalletStore.onLock(isShort);
        this.setState({
            resolve: null,
            reject: null,
            locked: WalletStore.isLocked(false),
            shortLocked: WalletStore.isLocked(),
            actionIsShort: isShort
        });
        resolve();
    }

    onLockall({resolve}) {
        if (WalletStore.isLocked() && WalletStore.isLocked(false)) {
            resolve();
            return;
        }
        WalletStore.onLockall();
        this.setState({
            resolve: null,
            reject: null,
            locked: WalletStore.isLocked(false),
            shortLocked: WalletStore.isLocked(),
            actionIsShort: true
        });
        resolve();
    }

    onCancel() {
        this.setState({resolve: null, reject: null});
    }

    onChange() {
        this.setState({locked: WalletStore.isLocked(false), shortLocked: WalletStore.isLocked()});
    }

    onPasswordChange(password) {
        this.setState({password_input: password});
    }
}

export default alt.createStore(WalletUnlockStore, "WalletUnlockStore");