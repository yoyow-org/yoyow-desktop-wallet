
import alt from "../altInstance";
import BaseStore from "./BaseStore";
import Immutable from "immutable";
import PrivateKeyActions from "../actions/PrivateKeyActions";
import walletDatabase from "../db/WalletDatabase";
import {PrivateKeyTcomb, WalletTcomb} from "../db/TcombStructs";
import CachedSettingActions from "../actions/CachedSettingActions";
import IdbHelper from "../../lib/IdbHelper";
import {PublicKey, Aes} from "yoyowjs-lib";
import WalletStore from "./WalletStore";

class PrivateKeyStore extends BaseStore {
    constructor() {
        super();
        this.state = this.getDefaultState();
        this.pending_operation_count = 0;
        this.bindListeners({
            onLoadDbData: PrivateKeyActions.loadDbData,
            onAddKey: PrivateKeyActions.addKey,
            onCleanKey: PrivateKeyActions.cleanKey
        });
        this._export(
            "hasKey",
            "getPubkeys",
            "getTcomb_byPubkey",
            "getPubkeys_having_PrivateKey",
            "decodeMemo",
            "onCleanKey",
            "onLoadDbData"
        );
    }

    getDefaultState() {
        return {
            keys: Immutable.Map(),
            privateKeyStorage_error: false,
            pending_operation_count: 0,
            privateKeyStorage_error_add_key: null,
            privateKeyStorage_error_loading: null
        }
    }

    backupRecommended() {
        CachedSettingActions.set("backup_recommended", true);
    }

    pendingOperation() {
        this.pending_operation_count++;
        this.setState({pending_operation_count: this.pending_operation_count});
    }

    pendingOperationDone() {
        if (this.pending_operation_count == 0)
            throw new Error("Pending operation done called too many times");
        this.pending_operation_count--;
        this.setState({pending_operation_count: this.pending_operation_count});
    }

    privateKeyStorageError(property, error) {
        this.pendingOperationDone();
        var state = {privateKeyStorage_error: true};
        state["privateKeyStorage_error_" + property] = error;
        console.error("privateKeyStorage_error_" + property, error);
        this.setState(state);
    }

    onLoadDbData(resolve) {
        this.pendingOperation();
        this.setState(this.getDefaultState());
        var keys = Immutable.Map().asMutable();
        var wallet_name = "default";
        var _this = this;
        var p = walletDatabase.instance().walletDB().getSetting("current_wallet", "default").then(current_wallet => {
            wallet_name = current_wallet;
            var tr = walletDatabase.instance().walletDB().walletHelper.getTransactionOnly("wallet");
            var store = tr.objectStore("wallet");
            return IdbHelper.onRequested(store.get(wallet_name)).then(event => {
                if (event.target.result == undefined) return;
                var result = event.target.result;
                var wallet_tcomb = WalletTcomb(result);
                PrivateKeyTcomb(wallet_tcomb.encrypted_active);
                PrivateKeyTcomb(wallet_tcomb.encrypted_secondary);
                PrivateKeyTcomb(wallet_tcomb.encrypted_memo);
                keys.set(wallet_tcomb.encrypted_active.pubkey, wallet_tcomb.encrypted_active);
                keys.set(wallet_tcomb.encrypted_secondary.pubkey, wallet_tcomb.encrypted_secondary);
                keys.set(wallet_tcomb.encrypted_memo.pubkey, wallet_tcomb.encrypted_memo);
                this.setState({keys: keys.asImmutable()});
                _this.pendingOperationDone();
            }).catch(err => {
                _this.setState(this.getDefaultState());
                _this.privateKeyStorageError('loading', err);
                throw err;
            });
        });
        resolve(p)
    }

    onAddKey({private_key_object, resolve}) {
        if (this.state.keys.has(private_key_object.pubkey)) {
            resolve({result: "duplicate", id: null});
            return;
        }
        this.pendingOperation();
        this.state.keys = this.state.keys.set(
            private_key_object.pubkey,
            PrivateKeyTcomb(private_key_object)
        );
        this.setState({keys: this.state.keys});
        resolve({
            result: "added",
            id: private_key_object.id
        });
    }

    onCleanKey() {
        this.setState({keys: Immutable.Map()});
    }

    getTcomb_byPubkey(public_key) {
        if (!public_key) return null
        if (public_key.Q)
            public_key = public_key.toPublicKeyString();
        return this.state.keys.get(public_key)
    }

    hasKey(pubkey) {
        return this.state.keys.has(pubkey)
    }

    getPubkeys() {
        return this.state.keys.keySeq().toArray();
    }

    getPubkeys_having_PrivateKey(pubkeys) {
        var return_pubkeys = []
        if (pubkeys) {
            for (let pubkey of pubkeys) {
                if (this.hasKey(pubkey)) {
                    return_pubkeys.push(pubkey)
                }
            }
        }
        return return_pubkeys
    }

    decodeMemo(memo) {
        let lockedWallet = false;
        let memo_text, isMine = false;
        let from_private_key = this.state.keys.get(memo.from)
        let to_private_key = this.state.keys.get(memo.to)
        let private_key = from_private_key ? from_private_key : to_private_key;
        let public_key = from_private_key ? memo.to : memo.from;
        public_key = PublicKey.fromPublicKeyString(public_key)

        try {
            private_key = WalletStore.decryptTcomb_PrivateKey(private_key);
            if(__DEBUG__) console.log(private_key.toWif());
        }
        catch (e) {
            // 由于钱包被锁定而失败
            lockedWallet = true;
            private_key = null;
            isMine = true;
        }

        if (private_key) {
            let tryLegacy = false;
            try {
                memo_text = private_key ? Aes.decrypt_with_checksum(
                    private_key,
                    public_key,
                    memo.nonce,
                    memo.message
                ).toString("utf-8") : null;

                if (private_key && !memo_text) {
                    // debugger
                }
            } catch (e) {
                if(__DEBUG__) console.log("transfer memo exception ...", e);
                memo_text = "*";
                tryLegacy = true;
            }

            // 如果新的正确方法无法解码，则应用旧方法
            if (private_key && tryLegacy) {
                try {
                    memo_text = Aes.decrypt_with_checksum(
                        private_key,
                        public_key,
                        memo.nonce,
                        memo.message,
                        true
                    ).toString("utf-8");
                } catch (e) {
                    if(__DEBUG__) console.log("transfer memo exception ...", e);
                    memo_text = "**";
                }
            }
        }
        return {
            text: memo_text,
            isMine
        }
    }
}

export default alt.createStore(PrivateKeyStore, "PrivateKeyStore");