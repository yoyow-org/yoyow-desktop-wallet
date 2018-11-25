import alt from "../altInstance";
import BaseStore from "./BaseStore";
import {WalletTcomb} from "../db/TcombStructs";
import {Long} from 'bytebuffer';
import Immutable from "immutable";

import walletDatabase from "../db/WalletDatabase";
import CachedSettingStore from "./CachedSettingStore";
import IdbHelper from "../../lib/IdbHelper";
import PrivateKeyStore from "./PrivateKeyStore";
import {PrivateKey, key, Aes, AccountUtils, TransactionBuilder} from "yoyowjs-lib";
import {Apis} from "yoyowjs-ws";
import {cloneDeep} from "lodash";
import Utils from "../utils/Utils";
import PrivateKeyActions from "../actions/PrivateKeyActions";
import WalletUnlockActions from "../actions/WalletUnlockActions";
import TransactionConfirmActions from "../actions/TransactionConfirmActions";
import WalletActions from "../actions/WalletActions";
import ChainApi from "../api/ChainApi";
import Validation from "../utils/Validation";

var aes_private;        //长密码
var aes_short_private;  //短密码

class WalletStore extends BaseStore {

    constructor() {
        super();
        this.state = this.__getInitState();
        // 控制UI上弹出确认对话框
        this.confirm_transactions = true;
        this.bindListeners({
            setBackupDate: WalletActions.setBackupDate,
            onRestore: WalletActions.restore,
            onResetAccount: WalletActions.resetAccount,
            onChangeAccount: WalletActions.changeAccount,
            onGenerateQRcode: WalletActions.generateQRcode,
            onCheckAccountValid:WalletActions.checkAccountValid
        })
        this._export("getWallet", "loadDbData", "decryptTcomb_PrivateKey", "getPrivateKey", "onLock",
            "isLocked", "onCreateWallet", "validatePassword", "changePassword", "setWalletModified",
            "setBackupDate", "processTransaction", "getAccountList", "onLockall");
    }

    __getInitState() {
        return {wallet: null, accountList: Immutable.List()};
    }

    getWallet() {
        return this.state.wallet
    }

    getAccountList() {
        return this.state.accountList;
    }

    loadDbData() {
        return walletDatabase.instance().walletDB().getSetting("current_wallet", "default").then(wallet_name => {
            return walletDatabase.instance().walletDB().loadData("wallet").then(wallets => {
                //载入账号列表
                let accountList = Immutable.List();
                for (let wallet of wallets) {
                    accountList = accountList.push(wallet.yoyow_id);
                }
                this.setState({accountList});
                //载入钱包对象
                let wallet = wallets.find(w => {
                    return w.public_name === wallet_name;
                });
                if (wallet) {
                    // 将除字符串或数字之外的任何内容转换回其正确类型
                    wallet.created = new Date(wallet.created);
                    wallet.last_modified = new Date(wallet.last_modified);
                    wallet.backup_date = wallet.backup_date ? new Date(wallet.backup_date) : null;
                    try {
                        WalletTcomb(wallet);
                    } catch (e) {
                        if (__DEBUG__) console.log("WalletStore format error", e);
                        return Promise.reject(e);
                    }
                    this.setState({wallet});
                }

            });
        });
    }

    onLock(isShort = true) {
        if (!isShort)
            aes_private = null;
        else
            aes_short_private = null;
    }

    onLockall() {
        aes_private = null;
        aes_short_private = null;
    }

    isLocked(isShort = true) {
        if (!isShort)
            return aes_private ? false : true;
        else
            return aes_short_private ? false : true;
    }

    decryptTcomb_PrivateKey(private_key_tcomb) {
        if (!private_key_tcomb) return null;
        var private_key_hex = null;
        if (private_key_tcomb.label === "active") {
            if (!aes_private) throw new Error("wallet locked balance");
            private_key_hex = aes_private.decryptHex(private_key_tcomb.encrypted_key);
        }
        else if (private_key_tcomb.label === "secondary") {
            if (!aes_short_private) throw new Error("wallet locked prepaid");
            private_key_hex = aes_short_private.decryptHex(private_key_tcomb.encrypted_key);
        }
        else if (private_key_tcomb.label === "memo") {
            if (aes_short_private) {
                private_key_hex = aes_short_private.decryptHex(private_key_tcomb.encrypted_short_key);
            } else if (aes_private) {
                private_key_hex = aes_private.decryptHex(private_key_tcomb.encrypted_key);
            } else {
                throw new Error("wallet locked");
            }
        }
        return PrivateKey.fromBuffer(new Buffer(private_key_hex, 'hex'));
    }

    getPrivateKey(public_key) {
        if (!public_key) return null;
        if (public_key.Q) public_key = public_key.toPublicKeyString();
        var private_key_tcomb = PrivateKeyStore.getTcomb_byPubkey(public_key);
        if (!private_key_tcomb) return null;
        return this.decryptTcomb_PrivateKey(private_key_tcomb);
    }

    __getTransaction() {
        var tr = walletDatabase.instance().walletDB().walletHelper.getTransaction("wallet");
        return tr;
    }

    /**
     * 创建钱包，并保存到数据库
     * @param password_plaintext 长密码
     * @param password_short_plaintext 短密码
     * @param yoyow_id
     * @param active_wif
     * @param secondary_wif
     * @param memo_wif
     * @param unlock 是否直接解锁两个密码，默认为false
     */
    onCreateWallet(password_plaintext, password_short_plaintext, yoyow_id, active_wif, secondary_wif, memo_wif, unlock = false) {
        let walletCreateFct = () => {
            return new Promise((resolve, reject) => {
                if (typeof password_plaintext !== 'string')
                    throw new Error("password string is required");

                let password_aes = Aes.fromSeed(password_plaintext);
                let password_short_aes = Aes.fromSeed(password_short_plaintext);

                let encryption_buffer = key.get_random_key().toBuffer();
                //encryption_key是active加密密钥（密码更改时不会更改）
                let encryption_key = password_aes.encryptToHex(encryption_buffer);
                let encryption_short_buffer = key.get_random_key().toBuffer();
                //encryption_short_key是secondary加密密钥（密码更改时不会更改）
                let encryption_short_key = password_short_aes.encryptToHex(encryption_short_buffer);
                //如果解锁，local_aes_private将成为全局的aes_private对象
                let local_aes_private = Aes.fromSeed(encryption_buffer);
                let local_short_aes_private = Aes.fromSeed(encryption_short_buffer);
                let active_key = PrivateKey.fromWif(active_wif);
                let secondary_key = PrivateKey.fromWif(secondary_wif);
                let memo_key = PrivateKey.fromWif(memo_wif);
                let password_private = PrivateKey.fromSeed(password_plaintext);
                let password_pubkey = password_private.toPublicKey().toPublicKeyString();

                let public_name = "yoyow" + yoyow_id;
                let encrypted_active = {
                    label: "active",
                    pubkey: active_key.toPublicKey().toPublicKeyString(),
                    encrypted_key: local_aes_private.encryptToHex(active_key.toBuffer())
                };
                let encrypted_secondary = {
                    label: "secondary",
                    pubkey: secondary_key.toPublicKey().toPublicKeyString(),
                    encrypted_key: local_short_aes_private.encryptToHex(secondary_key.toBuffer())
                };
                let encrypted_memo = {
                    label: "memo",
                    pubkey: memo_key.toPublicKey().toPublicKeyString(),
                    encrypted_key: local_aes_private.encryptToHex(memo_key.toBuffer()),
                    encrypted_short_key: local_short_aes_private.encryptToHex(memo_key.toBuffer())
                };

                let wallet = {
                    public_name,
                    yoyow_id,
                    created: new Date(),
                    last_modified: new Date(),
                    password_pubkey,
                    password_short_pubkey: password_pubkey,
                    encryption_key,
                    encryption_short_key,
                    encrypted_active,
                    encrypted_secondary,
                    encrypted_memo,
                    chain_id: Apis.instance().chain_id
                };
                WalletTcomb(wallet) // 验证钱包对象
                var tr = this.__getTransaction();
                let add = IdbHelper.add(tr.objectStore("wallet"), wallet);
                let end = IdbHelper.onTransactionEnd(tr).then(() => {
                    //this.state.wallet = wallet;
                    let accountList = this.state.accountList;
                    if (accountList.indexOf(yoyow_id) < 0) {
                        accountList = accountList.push(yoyow_id);
                    }
                    this.setState({wallet, accountList});
                    if (unlock) {
                        aes_private = local_aes_private;
                        aes_short_private = local_short_aes_private;
                    }
                });
                resolve(Promise.all([add, end]));
            });
        };
        return walletCreateFct();
    }

    /**
     * 验证密码
     * @param password
     * @param isShort 是否是验证的短密码，默认为true
     * @param unlock 是否验证成功后直接解锁，默认为false
     * @returns {boolean}
     */
    validatePassword(password, isShort = true, unlock = false) {
        var wallet = this.state.wallet;
        try {
            var password_private = PrivateKey.fromSeed(password);
            var password_pubkey = password_private.toPublicKey().toPublicKeyString();
            if (!isShort) {
                if (wallet.password_pubkey !== password_pubkey) return false;
            }
            else {
                if (wallet.password_short_pubkey !== password_pubkey) return false;
            }
            if (unlock) {
                var password_aes = Aes.fromSeed(password);
                var encryption_plainbuffer = null;
                if (!isShort) {
                    encryption_plainbuffer = password_aes.decryptHexToBuffer(wallet.encryption_key);
                    aes_private = Aes.fromSeed(encryption_plainbuffer);
                } else {
                    encryption_plainbuffer = password_aes.decryptHexToBuffer(wallet.encryption_short_key);
                    aes_short_private = Aes.fromSeed(encryption_plainbuffer);
                }
            }
            return true;
        } catch (e) {
            console.error(e);
            return false;
        }
    }

    /**
     * 修改密码
     * @param old_password
     * @param new_password
     * @param is_short 是否修改是短密码，默认为true
     * @param unlock 是否修改后保持解锁状态，默认为false
     * @returns {Promise}
     */
    changePassword(old_password, new_password, is_short = true, unlock = false) {
        return new Promise(resolve => {
            var wallet = this.state.wallet;
            //console.log(this.validatePassword(old_password, is_short, unlock))
            if (!this.validatePassword(old_password, is_short, unlock))
                throw new Error("wrong password");

            var old_password_aes = Aes.fromSeed(old_password);
            var new_password_aes = Aes.fromSeed(new_password);

            var encryption_plainbuffer = null;
            var new_password_private = null;
            if (!is_short) {
                if (!wallet.encryption_key)
                    throw new Error("此钱包不支持更改密码功能。");
                encryption_plainbuffer = old_password_aes.decryptHexToBuffer(wallet.encryption_key);
                wallet.encryption_key = new_password_aes.encryptToHex(encryption_plainbuffer);
                new_password_private = PrivateKey.fromSeed(new_password);
                wallet.password_pubkey = new_password_private.toPublicKey().toPublicKeyString();
                if (unlock) {
                    aes_private = Aes.fromSeed(encryption_plainbuffer);
                } else {
                    aes_private = null;
                }
            } else {
                if (!wallet.encryption_short_key)
                    throw new Error("此钱包不支持更改密码功能。");
                encryption_plainbuffer = old_password_aes.decryptHexToBuffer(wallet.encryption_short_key);
                wallet.encryption_short_key = new_password_aes.encryptToHex(encryption_plainbuffer);
                new_password_private = PrivateKey.fromSeed(new_password);
                wallet.password_short_pubkey = new_password_private.toPublicKey().toPublicKeyString();
                if (unlock) {
                    aes_short_private = Aes.fromSeed(encryption_plainbuffer);
                } else {
                    aes_short_private = null;
                }
            }
            resolve(this.setWalletModified());
        })
    }

    __updateWallet(transaction = this.__getTransaction()) {
        var wallet = this.state.wallet;
        if (!wallet) {
            reject("missing wallet");
            return;
        }
        var wallet_clone = cloneDeep(wallet);
        wallet_clone.last_modified = new Date();

        WalletTcomb(wallet_clone); // 验证

        var wallet_store = transaction.objectStore("wallet");
        var req = IdbHelper.onRequested(wallet_store.put(wallet_clone));
        var end = IdbHelper.onTransactionEnd(transaction).then(() => {
            //this.state.wallet = wallet_clone;
            this.setState({wallet: wallet_clone});
        })
        return Promise.all([req, end]);
    }

    setWalletModified(transaction) {
        return this.__updateWallet(transaction);
    }

    setBackupDate() {
        var wallet = this.state.wallet;
        wallet.backup_date = new Date();
        return this.__updateWallet();
    }

    /**
     * 处理交易
     * @param tr 交易对象
     * @param signer_pubkeys 签名会用的公钥
     * @param broadcast 是否直接广播
     * @param payer 手续费支付人id
     * @param isPrepaid 是否只用零钱支付手续费,默认为true
     * @returns {Promise.<*>|Promise<any>}
     */
    processTransaction(tr, signer_pubkeys, broadcast, payer, isPrepaid = true) {
        if (Apis.instance().chain_id !== this.state.wallet.chain_id)
            return Promise.reject("Mismatched chain_id; expecting " +
                this.state.wallet.chain_id + ", but got " +
                Apis.instance().chain_id);

        return WalletUnlockActions.unlock(isPrepaid).then(() => {
            return tr.set_required_fees(payer, !isPrepaid).then(() => {
                var signer_pubkeys_added = {};
                var pubkeys = [];
                if (signer_pubkeys) {
                    pubkeys = PrivateKeyStore.getPubkeys_having_PrivateKey(signer_pubkeys);
                    if (!pubkeys.length)
                        throw new Error("Missing signing key");

                    for (let pubkey_string of pubkeys) {
                        var private_key = this.getPrivateKey(pubkey_string);
                        tr.add_signer(private_key, pubkey_string);
                        signer_pubkeys_added[pubkey_string] = true;
                    }
                }

                return tr.get_required_signatures(pubkeys).then(required_pubkeys => {
                    for (let pubkey_string of required_pubkeys) {
                        if (signer_pubkeys_added[pubkey_string]) continue;
                        var private_key = this.getPrivateKey(pubkey_string);
                        if (!private_key)
                            throw new Error("Missing signing key for " + pubkey_string);
                        tr.add_signer(private_key, pubkey_string);
                    }
                }).then(() => {
                    if (broadcast) {
                        if (this.confirm_transactions) {
                            TransactionConfirmActions.confirm(tr);
                            return Promise.resolve();
                        }
                        else
                            return tr.broadcast()

                    } else
                        return tr.serialize()
                })
            })
        })
    }

    /**
     * 恢复钱包
     * @param wallet_name 钱包名
     * @param wallet_object 钱包对象
     */
    onRestore({wallet_name, wallet_object, resolve}) {
        wallet_object.created = new Date(wallet_object.created);
        wallet_object.last_modified = new Date(wallet_object.last_modified);
        wallet_object.backup_date = wallet_object.backup_date ? new Date(wallet_object.backup_date) : null;
        let pro = new Promise(resolve => {
            try {
                WalletTcomb(wallet_object);
            } catch (e) {
                console.error("WalletStore format error", e);
                return Promise.reject(e);
            }
            resolve(walletDatabase.instance().walletDB().restore(wallet_name, wallet_object).then(() => {
                return PrivateKeyActions.loadDbData().then(() => {
                    let accountList = this.state.accountList;
                    if (accountList.indexOf(wallet_object.yoyow_id) < 0) {
                        accountList = accountList.push(wallet_object.yoyow_id);
                    }
                    this.setState({wallet: wallet_object, accountList});
                    return Promise.resolve(wallet_object);
                });
            }).catch(error => {
                console.error(error);
                return Promise.reject(error);
            }));
        });
        if (resolve) resolve(pro);
    }

    onChangeAccount({uid, resolve, reject}) {
        let walletName = "yoyow" + uid;
        let pro = walletDatabase.instance().walletDB().getStore("wallet", walletName).then(wallet => {
            if (wallet == undefined) reject({message: "指定账号未在钱包中"});
            PrivateKeyActions.cleanKey();
            wallet.created = new Date(wallet.created);
            wallet.last_modified = new Date(wallet.last_modified);
            wallet.backup_date = wallet.backup_date ? new Date(wallet.backup_date) : null;
            walletDatabase.instance().walletDB().setSetting("current_wallet", walletName);
            this.setState({wallet});
            WalletUnlockActions.lockall();
            if (__DEBUG__) console.log('切换账号：', uid);
            return PrivateKeyActions.loadDbData();
        });
        if (resolve) resolve(pro);
    }

    /**
     * 重置钱包
     * @param uid 账号
     * @param owner_key 账号所有权私钥
     * @param account_pwd 账号密码
     * @param short_pwd 短密码
     * @param resolve
     * @param reject
     */
    onResetAccount({uid, owner_key, account_pwd, short_pwd, isAuth,resolve, reject}) {
        let uidStr = uid.toString();
        let checkPromise = walletDatabase.instance().walletDB().getStore("wallet", "yoyow" + uidStr).then(data => {
            if (data != undefined) {
                return walletDatabase.instance().walletDB().removeStore("wallet", "yoyow" + uidStr);
            }
        }).catch(err => {
            reject({message: err});
        });
        let generatePromise = Promise.all([checkPromise]).then(() => {
            let privateKey = owner_key;
            let active_private = key.get_random_key();
            let secondary_private = key.get_random_key();
            let memo_private = key.get_random_key();
            let op_data = {
                uid: uid,
                active: {
                    weight_threshold: 1,
                    key_auths: [[active_private.toPublicKey().toPublicKeyString(), 1]],
                    account_uid_auths: []
                },
                secondary: {
                    weight_threshold: 1,
                    key_auths: [[secondary_private.toPublicKey().toPublicKeyString(), 1]],
                    account_uid_auths: []
                },
                memo_key: memo_private.toPublicKey().toPublicKeyString(),
            };
            let tr = new TransactionBuilder();
            tr.add_type_operation("account_update_auth", op_data);
            return {tr, privateKey, active_private, secondary_private, memo_private};
        });

        let trPromise = new Promise((resolve, reject) => {
            resolve(generatePromise.then(({tr, privateKey, active_private, secondary_private, memo_private}) => {
                return tr.get_fees_by_ops(uidStr).then(({min_fees, min_real_fees, statistics}) => {
                    let core_balance = Long.fromValue(statistics.core_balance);
                    let csaf_balance = Long.fromValue(statistics.csaf);
                    if (min_fees.gt(core_balance.add(csaf_balance))) {
                        let mf = min_fees.toNumber() / 100000.0;
                        return Promise.reject({
                            message: `账号[${uidStr}]中余额不足,请先向此账号转入${mf}币`
                        });
                    }
                    return tr.set_required_fees(uidStr, true, true).then(() => {
                        tr.add_signer(privateKey, privateKey.toPublicKey().toPublicKeyString());

                        return new Promise((resolve, reject) => {
                            tr.broadcast(() => {
                                resolve({active_private, secondary_private, memo_private});
                            }).catch(err => reject(err));
                        })
                    });
                });
            }));
        });

        let ws = this;
        let walletPromise = new Promise((resolve) => {
            PrivateKeyStore.onCleanKey();
            resolve(trPromise.then(({active_private, secondary_private, memo_private}) => {
                return ws.onCreateWallet(account_pwd, short_pwd, uidStr,
                    active_private.toWif(), secondary_private.toWif(), memo_private.toWif(),isAuth).then(() => {
                    return new Promise(res => {
                        walletDatabase.instance().walletDB().setSetting("current_wallet", `yoyow${uidStr}`);
                        PrivateKeyStore.onLoadDbData(res)
                    });
                });
            }));
        });
        if (resolve) resolve(walletPromise);
    }

    /**
     * 生成账号导出二维码字符串
     */
    onGenerateQRcode({resolve, reject}){
        let {wallet} = this.state;
        ChainApi.getAccountByUid(wallet.yoyow_id).then(w => {
            if(w[0].memo_key !== wallet.encrypted_memo.pubkey){
                reject('QRCode.error_invalid');
            }else if(wallet.password_pubkey != wallet.password_short_pubkey){
                reject('QRCode.error_two_pwd');
            }else{
                let {wallet} = this.state;
                let keysStr = '';
                if(!Validation.isEmpty(wallet)){
                    keysStr = wallet.password_pubkey
                                +wallet.password_short_pubkey 
                                +Utils.hexToBase64(wallet.encryption_key)
                                +Utils.hexToBase64(wallet.encryption_short_key)
                                +Utils.hexToBase64(wallet.encrypted_active.encrypted_key)
                                +Utils.hexToBase64(wallet.encrypted_secondary.encrypted_key)
                                +Utils.hexToBase64(wallet.encrypted_memo.encrypted_key)
                                +Utils.hexToBase64(wallet.encrypted_memo.encrypted_short_key)
                                +Date.now()
                                +wallet.yoyow_id;
                }
                resolve(keysStr);
            }
            
        }).catch(err => {
            reject(err);
        });
        
    }
    onCheckAccountValid({uid, memo_key, resolve, reject}){
        ChainApi.getAccountByUid(uid).then( account => {
            resolve(memo_key == account[0].memo_key);
        }).catch(err => {
            reject(err);
        })
    }
}

export default alt.createStore(WalletStore, "WalletStore");

function reject(error) {
    console.error("WalletStore reject error :", error);
    throw new Error(error);
}