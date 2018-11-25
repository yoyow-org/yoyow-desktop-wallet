"use strict";

import {Apis} from "yoyowjs-ws";
import {
    Aes,
    ChainStore,
    ChainTypes,
    ChainValidation,
    AccountUtils,
    PrivateKey,
    PublicKey,
    TransactionBuilder,
    TransactionHelper
} from 'yoyowjs-lib';
import {Long} from "bytebuffer";
import SettingsStore from "../stores/SettingsStore";
import WalletStore from "../stores/WalletStore";
import globalParams from "../utils/GlobalParams";
import Utils from "../utils/Utils";
import Validation from "../utils/Validation";
import counterpart from "counterpart";
import _ from 'lodash';

let global_prams_type = `2.${parseInt(ChainTypes.impl_object_type.global_property, 10)}.0`;
let dynamic_global_prams_type = `2.${parseInt(ChainTypes.impl_object_type.dynamic_global_property, 10)}.0`;

export default {

    createAccount(account) {
        return new Promise((resolve, reject) => {
            Apis.instance(SettingsStore.getSetting("apiServer"), true)
                .init_promise.then(res => {
                ChainStore.init().then(() => {
                    let keys = AccountUtils.generateKeys(account.username, account.password);
                    let data = JSON.stringify({
                        name: account.username,
                        nickname: account.nickname,
                        owner_key: keys.pubKeys.owner,
                        active_key: keys.pubKeys.active,
                        secondary_key: keys.pubKeys.secondary,
                        memo_key: keys.pubKeys.memo
                    });
                    resolve(data);
                }).catch((err => {
                    reject(err);
                }));
            }).catch(err => {
                reject(err);
            });
        });
    },

    getAccountByUid(uid){
        return new Promise((resolve, reject) => {
            if (ChainValidation.is_account_uid(uid)) {
                return Apis.instance().db_api().exec("get_accounts_by_uid", [[uid]]).then(res => {
                    if (res && res.length > 0 && res[0] != null) {
                        resolve(res);
                    } else {
                        reject(1);
                    }
                }).catch(err => {
                    reject(-1);
                });
            } else {
                reject(1);
            }
        });
    },

    /**
     * 获取用户历史记录
     * @param uid
     * @param op_type
     * @param start
     * @param stop
     * @param limit
     * @returns {Promise<U>|Promise.<T>|*|Promise}
     */
    getHistoryByUid(uid, op_type = null, start = 0, stop = 0, limit = global.walletConfig.history_page_size) {
        if (start != 0) {
            start -= 1;
        }
        return ChainStore.fetchRelativeAccountHistory(uid, op_type, stop, limit, start).then(res => {
            let history = [];
            for (let o of res) {
                let op = o[1]['op'][1];
                let op_type = o[1]['op'][0];
                // 目前仅转账 积分领取在历史查看范围
                if (op_type == 0 || op_type == 6 || op_type == 25) {
                    op.type = op_type;
                    op.time = Utils.transferApiDate(o[1]['block_timestamp']).dateStr;
                    op.inx = o[0];
                    history.push(op);
                }
            }
            return {history, start: res[res.length - 1][0]};
        }).catch(err => {
            return Promise.reject(err);
        });

    },

    /**
     * 获取资产
     * @param 用户uid
     * @returns {Promise}
     */
    getBalanceByUid(uid) {
        let statisticsPromise = new Promise((resolve, reject) => {
            if (!ChainValidation.is_account_uid(uid)) {
                reject(new Error('invalid account uid'));
            } else {
                Apis.instance().db_api().exec("get_full_accounts_by_uid", [[uid], {fetch_statistics: true}])
                    .then(res => {
                        if (res.length == 0) {
                            reject({code: 1});
                        } else {
                            resolve(res[0][1].statistics);
                        }
                    }).catch(err => {
                    reject(err);
                });
            }
        });
        return Promise.all([statisticsPromise, this.getParameters()])
            .then(res => {
                let statistics = res[0];
                let {params, dynamicParams} = res[1];
                // 币天/积分积累
                // 余额（加上借入的，减去借出的）
                let effective_balance = Long.fromValue(statistics.core_balance).add(Long.fromValue(statistics.core_leased_in)).sub(Long.fromValue(statistics.core_leased_out));
                // * 一天秒数 / 币龄抵扣手续费比率（csaf_rate）
                let csaf_accumulate = effective_balance * 86400 / params.csaf_rate * global.walletConfig.csaf_param;
                // 币天/积分 可领取
                let csaf_collect = Math.floor(Utils.calcCoinSecondsEarned(statistics, params.csaf_accumulate_window, dynamicParams.time).new_coin_seconds_earned / params.csaf_rate * global.walletConfig.csaf_param);
                let assets = {
                    orign_core_balance: this.realCount(statistics.core_balance),// 原始余额
                    core_balance: this.realCount(Long.fromValue(statistics.core_balance)
                        .sub(statistics.total_witness_pledge)
                        .sub(statistics.total_committee_member_pledge)
                        .sub(statistics.total_platform_pledge)
                        .toNumber()), // 实际余额 - 见证人抵押 - 理事会抵押 - 平台抵押
                    prepaid_balance: this.realCount(statistics.prepaid), // 零钱
                    csaf_balance: this.realCount(statistics.csaf), // 币天/积分
                    max_csaf_limit: this.realCount(params.max_csaf_per_account), // 币天/积分上限
                    csaf_accumulate: Utils.formatAmount(this.realCount(csaf_accumulate), 4), // 币天/积分积累
                    csaf_collect: Utils.formatAmount(this.realCount(csaf_collect), 4), // 可领取币天/积分
                    total_witness_pledge: this.realCount(statistics.total_witness_pledge),// 见证人抵押总额
                    releasing_witness_pledge: this.realCount(statistics.releasing_witness_pledge), // 见证人抵押待退
                    total_committee_member_pledge: this.realCount(statistics.total_committee_member_pledge),// 理事会抵押总额
                    releasing_committee_member_pledge: this.realCount(statistics.releasing_committee_member_pledge), // 理事会抵押待退
                    is_pledge: statistics.total_witness_pledge > 0 || statistics.total_committee_member_pledge > 0, // 以是否有抵押判断时候见证人或理事会成员
                    is_witness: statistics.total_witness_pledge > 0, // 是否有见证人抵押
                    is_committee: statistics.total_committee_member_pledge > 0 // 是否有理事会抵押
                };
                return assets;

            }).catch(err => {
                if (__DEBUG__) {
                    console.log('获取资产异常');
                    console.log(err);
                }
                return Promise.reject(err);
            });
    },

    /**
     * 计算操作所需费用
     * @param op_type 操作类型
     * @param op_data 操作数据
     * @returns {Promise}
     */
    getOperationsFees(op_type, op_data, pay_uid) {
        let tr = new TransactionBuilder();
        tr.add_type_operation(op_type, op_data);
        return tr.get_fees_by_ops(pay_uid).then(fees => {
            let csaf_can = fees.min_fees.sub(fees.min_real_fees); // 可用积分抵扣部分
            let csaf_balance = Long.fromValue(fees.statistics.csaf); // 积分余额
            let use_csaf = Long.ZERO; // 本次交易可用积分
            // 积分足够，交易可用为最大可用抵扣 | 积分不足，交易可用为全部积分余额
            use_csaf = csaf_balance.gte(csaf_can) ? csaf_can : csaf_balance;
            let with_csaf_fees = fees.min_fees.sub(use_csaf); //用积分抵扣后剩余费用
            let result = {
                min_fees: this.realCount(fees.min_fees),
                min_real_fees: this.realCount(fees.min_real_fees),
                use_csaf: this.realCount(use_csaf),
                with_csaf_fees: this.realCount(with_csaf_fees)
            };

            return result;
        }).catch(err => {
            if (__DEBUG__) {
                console.log('计算操作所需费用异常');
                console.log(err);
            }
            return Promise.reject(err);
        });

    },

    /**
     * 构建转账op对象
     * 默认为当前操作帐号信息
     * 根据type判断转账方式，为空的情况为异帐号转账，其他为零转余或余转零
     * @param to_account
     * @param amount
     * @param memo
     * @param type 内部转账类型 对外转账不传
     * @returns {*|Promise|Promise<U>|Promise.<T>}
     */
    buildTransferData(to_account, amount, memo, type, asset_id = 0) {
        let curWallet = WalletStore.getWallet();
        let from_account = curWallet.yoyow_id;
        let fetchMemoToKey;
        if (from_account != to_account) {
            fetchMemoToKey = new Promise((resolve, reject) => {
                Apis.instance().db_api().exec("get_accounts_by_uid", [[to_account]]).then(uObj => {
                    if (uObj && uObj[0]) {
                        resolve(uObj[0].memo_key);
                    } else {
                        resolve(PrivateKey.fromSeed("1").toPublicKey());
                    }
                });
            });
        } else {
            fetchMemoToKey = curWallet.encrypted_memo.pubkey;
        }

        return Promise.all([fetchMemoToKey]).then(res => {
            let memoFromKey = PublicKey.fromPublicKeyString(curWallet.encrypted_memo.pubkey);
            let memoToKey = PublicKey.fromPublicKeyString(res[0]);
            // let asset = {amount: Math.round(amount * global.walletConfig.retain_count), asset_id: 0};
            let asset = {amount: amount, asset_id};
            let extensions_data = {};
            if (type == 'toPrepaid') {
                extensions_data = {
                    from_balance: asset,
                    to_prepaid: asset
                }
            } else if (type == 'toBalance') {
                extensions_data = {
                    to_balance: asset,
                    from_prepaid: asset
                }
            } else if (type == 'fromBalance') {
                extensions_data = {
                    from_balance: asset,
                    to_balance: asset
                }
            } else if (type == 'fromPrepaid') {
                extensions_data = {
                    from_prepaid: asset,
                    to_balance: asset
                }
            }

            let op_data = {
                from: curWallet.yoyow_id,
                to: to_account,
                amount: asset
            };

            if(asset_id == 0){
                op_data.extensions = extensions_data;
            }
            // 转账备注不为空
            if (memo && memo.trim() != '') {
                let memoKey = (WalletStore.isLocked(true) && WalletStore.isLocked(false)) ? PrivateKey.fromSeed("1") : WalletStore.decryptTcomb_PrivateKey(curWallet.encrypted_memo);
                let nonce = TransactionHelper.unique_nonce_uint64();
                let message = Aes.encrypt_with_checksum(
                    memoKey,
                    memoToKey,
                    nonce,
                    new Buffer(memo, 'utf-8')
                );
                let memo_data = {
                    from: memoFromKey,
                    to: memoToKey,
                    nonce,
                    message: message
                };
                op_data.memo = memo_data;
            }

            return {op_data, memoFromKey, from_account};
        }).catch(err => {
            if (__DEBUG__) {
                console.log('构建转账对象异常');
                console.log(err);
            }
            return Promise.reject(err);
        });
    },

    /**
     * 构建获取积分op对象
     * @param to_account
     * @param amount
     * @param use_csaf
     */
    buildCsafCollectData(to_account, amount) {
        return this.getParameters().then(res => {
            let {dynamicParams} = res;
            let time_point_sec = Utils.transferApiDateString(dynamicParams.time);
            let curWallet = WalletStore.getWallet();
            let op_data = {
                from: curWallet.yoyow_id,
                to: to_account,
                amount: {amount: parseInt(amount * global.walletConfig.retain_count), asset_id: 0},
                time: time_point_sec
            };
            return op_data;
        }).catch(err => {
            console.log('build csaf collect error');
            return Promise.reject(err);
        });
    },

    /**
     * 构建获取
     */
    buildPledgeData(amount = 0){
        return new Promise((resolve, reject) => {
            let curWallet = WalletStore.getWallet();
            let op_data = {
                account: curWallet.yoyow_id,
                new_pledge: {amount: Math.round(amount * global.walletConfig.retain_count), asset_id: 0}
            };
            resolve(op_data);
        });
    },

    /**
     * 获取转账/零转余/余转零 操作费用
     * @param to_account 目标帐号
     * @param amount 金额
     * @param memo 备注
     * @param type 转账类型 参考构建处
     * @returns {*|Promise|Promise<U>|Promise.<T>}
     */
    getTransferFees(to_account, amount, memo, type) {
        return this.buildTransferData(to_account, amount, memo, type)
            .then(res => {
                let {op_data} = res;
                return this.getOperationsFees('transfer', op_data, WalletStore.getWallet().yoyow_id);
            }).catch(err => {
                if (__DEBUG__) {
                    console.log('获取转账/零转余/余转零 操作费用 异常');
                    console.log(err);
                }
                return Promise.reject(err);
            });
    },

    /**
     * 获取抵押手续费
     */
    getPledgeFees(pledge_type){
        return this.buildPledgeData().then(op_data => {
            return this.getOperationsFees(pledge_type, op_data, op_data.account);
        });
    },

    /**
     * 处理抵押操作
     * @param amount 新的抵押金额
     * @param pledge_type 抵押操作类型 见证人/理事会
     */
    processUpdatePledge(amount, pledge_type, use_csaf){
        return new Promise((resolve, reject) => {
            let curWallet = WalletStore.getWallet();
            
            this.buildPledgeData(amount).then(op_data => {
                let key = WalletStore.decryptTcomb_PrivateKey(curWallet.encrypted_active);
                this.__processTransaction(pledge_type, op_data, op_data.account, true, use_csaf, key, true).then(() => {
                    resolve();
                }).catch(err => reject(err));
            });
        });
    },

    /**
     * 获取领取积分 操作费用
     * @param to_account
     * @param amount
     * @returns {*|Promise}
     */
    getCsafCollectFees(to_account, amount) {
        return this.buildCsafCollectData(to_account, amount).then(op_data => {
            return this.getOperationsFees('csaf_collect', op_data, op_data.from);
        });
    },

    /**
     * 处理转账
     * @param to_account
     * @param amount
     * @param memo
     * @param type
     * @param use_csaf 是否使用积分
     * @returns {*|Promise|Promise<U>|Promise.<T>}
     */
    processTransfer(to_account, amount, memo, type, use_csaf, asset_id) {
        return this.buildTransferData(to_account, amount, memo, type, asset_id)
            .then(res => {
                let {op_data, memoFromKey, from_account} = res;
                let curWallet = WalletStore.getWallet();
                let pKey;
                if (type == 'toBalance' || type == 'fromPrepaid') {
                    pKey = WalletStore.decryptTcomb_PrivateKey(curWallet.encrypted_secondary);
                } else {
                    pKey = WalletStore.decryptTcomb_PrivateKey(curWallet.encrypted_active);
                }
                let tr = new TransactionBuilder();
                let useBalance = false;
                if ((type == 'toPrepaid') || (type == 'fromBalance')) {
                    useBalance = true;
                }
                tr.add_type_operation('transfer', op_data);
                if (__DEBUG__) {
                    // console.log('转账op对象');
                    // console.log(op_data);
                }
                return tr.set_required_fees(from_account, useBalance, use_csaf).then(() => {
                    if (__DEBUG__) {
                        // console.log('交易对象序列化');
                        // console.log(op_data);
                        // console.log(tr.serialize());
                        // console.log(JSON.stringify(tr.toObject()));
                    }

                    tr.add_signer(pKey);
                    return new Promise((resolve, reject) => {
                        tr.broadcast(() => {
                            resolve({op_data});
                        }).then(() => {
                            resolve({op_data});
                        }).catch((err) => {
                            if (__DEBUG__) {
                                console.log('transfer error ',err);
                            }
                            reject(err);
                        });
                    })
                    
                    // console.log(bd);
                    // console.log('=========');
                    // return bd.then((b_res) => {
                    //     // 操作成功
                    //     if (__DEBUG__) console.log('转账成功 ');
                    //     return {op_data};
                    // }).catch((err) => {
                    //     if (__DEBUG__) {
                    //         console.log('广播转账异常');
                    //         console.log(err);
                    //     }
                    //     return Promise.reject(err);
                    // });
                }).catch(err => {
                    if (__DEBUG__) {
                        console.log('设置操作费率异常');
                        console.log(err);
                    }
                    return Promise.reject(err);
                });

            }).catch(err => {
                if (__DEBUG__) {
                    console.log('构建op_data异常');
                    console.log(err);
                }
                return Promise.reject(err);
            });
    },

    /**
     * 处理领取积分
     * @param to_account
     * @param amount
     * @param use_csaf
     * @returns {Promise<U>|*|Thenable<U>|Promise.<TResult>}
     */
    processCsafCollect(to_account, amount, use_csaf) {
        return this.buildCsafCollectData(to_account, amount).then(op_data => {
            let curWallet = WalletStore.getWallet();
            let isSelf = op_data.from == to_account; // 领给自己用零钱，领取给别人用余额
            let pKey;
            if (isSelf) {
                pKey = WalletStore.decryptTcomb_PrivateKey(curWallet.encrypted_secondary);
            } else {
                pKey = WalletStore.decryptTcomb_PrivateKey(curWallet.encrypted_active);
            }
            let tr = new TransactionBuilder();
            tr.add_type_operation('csaf_collect', op_data);
            return tr.set_required_fees(op_data.from, !isSelf, use_csaf).then(() => {
                tr.add_signer(pKey);
                if (__DEBUG__) {
                    console.log('transfer serialize');
                    console.log(tr.serialize());
                }
                return new Promise((resolve, reject) => {
                    tr.broadcast(() => {
                        resolve();
                    }).then(() => {
                        resolve();
                    }).catch((err) => {
                        if (__DEBUG__) {
                            console.log('csaf collect error');
                            console.log(err);
                        }
                        reject(err);
                    });
                })
                // return tr.broadcast().then((b_res) => {
                //     // 操作成功
                //     return b_res;
                // }).catch((err) => {
                //     if (__DEBUG__) {
                //         console.log('csaf collect error');
                //         console.log(err);
                //     }
                //     return Promise.reject(err);
                // });
            }).catch(err => {
                if (__DEBUG__) {
                    console.log('set fees error');
                    console.log(err);
                }
                return Promise.reject(err);
            });
        }).catch(err => {
            if (__DEBUG__) {
                console.log('build csaf collect op_data error');
                console.log(err);
            }
            return Promise.reject(err);
        });
    },

    /**
     * 系统通用参数
     * @returns {Promise<U>|*|Thenable<U>|Promise.<TResult>}
     */
    getParameters() {
        return Apis.instance().db_api().exec("get_objects", [[global_prams_type, dynamic_global_prams_type]]).then(res => {
            let params = res[0]['parameters'];
            let dynamicParams = res[1];
            return {params, dynamicParams};
        }).catch(err => {
            console.log('get parameters error');
            return Promise.reject(err);
        });
    },
    /**
     * 获取头块信息
     */
    getHeadBlock() {
        return Apis.instance().db_api().exec("get_objects", [["2.1.0"]]).then(res => {
            return res[0];
        }).catch(err => {
            return null;
        });
    },
    /**
     * 获取块号信息
     * @param block: 快号
     */
    getBlockInfo(block){
        return Apis.instance().db_api().exec("get_block",[block]).then(res=>{
            return res
        })
    },
    realCount(count, retain) {
        if (retain) {
            let real = Math.round(count * retain) / retain;
            return real;
        } else {
            let rc = global.walletConfig.retain_count;
            let real = Math.round(count / rc * rc) / rc;
            return real;
        }

    },

    /**
     * 获取见证人/理事会列表
     * @param startUid: 查询开始的uid
     * @param limit: 查询条数 上限100
     * @param type： 0 uid排序， 1 得票排序， 2 抵押排序
     * @param method: 0 查询见证人， 1 查询理事会
     */
    __lookupVoteCorrelation(startUid, limit, type, method) {
        return new Promise((resolve, reject) => {
            let exec = '';
            if (method == 0) {
                exec = 'lookup_witnesses';
            } else if (method == 1) {
                exec = 'lookup_committee_members';
            } else {
                reject(new Error('invalid method'));
            }
            Apis.instance().db_api().exec(exec, [startUid, limit, type]).then(res => {
                resolve(res);
            }).catch(err => {
                reject(err);
            });
        });
    },

    getWitness(startUid = 0, limit = 100, type = 1){
        return this.__lookupVoteCorrelation(startUid, limit, type, 0);
    },

    getAllWitness(start = 0, arr = [], limit = 100, type = 1){
        return this.__lookupVoteCorrelation(start, limit, type, 0).then(res => {
            if(start == 0) arr = arr.concat(res);
            else arr = arr.concat(_.isArray(res) ? _.tail(res) : []);
            if(res.length == limit){
                return this.getAllWitness(res[res.length - 1].account, arr);
            }else{
                return arr;
            }
        }); 
    },

    getCommittee(startUid = 0, limit = 100, type = 1){
        return this.__lookupVoteCorrelation(startUid, limit, type, 1);
    },

    /**
     * 构建见证人投票对象
     */
    buildWitnessVoteData(adds,removes){
        return new Promise((resolve, reject) => {
            let curWallet = WalletStore.getWallet();
            let op_data = {
                voter: curWallet.yoyow_id,
                witnesses_to_add: adds,
                witnesses_to_remove:removes
            };
            resolve(op_data)
        })
    },
    witnessVote(adds,removes,useCsaf,useBalance){

        return this.buildWitnessVoteData(adds,removes).then(op_data => {
            let curWallet = WalletStore.getWallet();
            let pKey = WalletStore.decryptTcomb_PrivateKey(curWallet.encrypted_active);
            let tr = new TransactionBuilder();
            tr.add_type_operation('witness_vote_update', op_data);
            return tr.set_required_fees(op_data.voter,useBalance,useCsaf).then(() => {
                tr.add_signer(pKey);
                if (__DEBUG__) {
                    console.log('transfer serialize');
                    console.log(tr.serialize());
                }
                return new Promise((resolve, reject) => {
                   tr.broadcast(() => {
                       resolve();
                   }).then(() => {
                        resolve();
                   }).catch(err => reject(err));
                });
                // return tr.broadcast().then((b_res) => {
                //     // 操作成功
                //     return b_res;
                // }).catch((err) => {
                //     console.log(err);
                //     return Promise.reject(err);
                // });
            })
        });

    },
    /**
     * 构建理事会投票对象
     */
    buildCommitteeVoteData(cadds,cremoves){
        return new Promise((resolve, reject) => {
            let curWallet = WalletStore.getWallet();
            let op_data = {
                voter: curWallet.yoyow_id,
                committee_members_to_add: cadds,
                committee_members_to_remove:cremoves
            };
            resolve(op_data)
        })
    },
    committeeVote(cadds,cremoves,useCsaf,useBalance){
        return this.buildCommitteeVoteData(cadds,cremoves).then(op_data => {
            let curWallet = WalletStore.getWallet();
            let pKey = WalletStore.decryptTcomb_PrivateKey(curWallet.encrypted_active);
            let tr = new TransactionBuilder();
            tr.add_type_operation('committee_member_vote_update', op_data);
            return tr.set_required_fees(op_data.voter,useBalance,useCsaf).then(() => {
                tr.add_signer(pKey);
                if (__DEBUG__) {
                    console.log('transfer serialize');
                    console.log(tr.serialize());
                }
                return new Promise((resolve, reject) => {
                    tr.broadcast(() => {
                        resolve();
                    }).then(() => {
                         resolve();
                    }).catch(err => reject(err));
                 });
                // return tr.broadcast().then((b_res) => {
                //     // 操作成功
                //     console.log("操作成功")
                //     return b_res;
                // }).catch((err) => {
                //     if (__DEBUG__) {
                //         console.log('csaf collect error');
                //         console.log(err);
                //     }
                //     return Promise.reject(err);
                // });
            })
        });

    },
    /**
     * 构建代理对象
     * @param proxy: 代理人账号
     */
    buildProxyData(proxy){
        return new Promise((resolve, reject) => {
            let curWallet = WalletStore.getWallet();
            let op_data = {
                voter: curWallet.yoyow_id,
                proxy: proxy
            };
            resolve(op_data)
        })
    },
    /**
     * 处理设置代理人
     * @param proxy: 代理人账号
     */
    processProxy(proxy, usbalance, useCsaf){
        return this.buildProxyData(proxy).then((op_data) => {
            let curWallet = WalletStore.getWallet();
            let pKey = WalletStore.decryptTcomb_PrivateKey(curWallet.encrypted_active);
            let tr = new TransactionBuilder();
            tr.add_type_operation('account_update_proxy', op_data);
            return tr.set_required_fees(op_data.voter, usbalance, useCsaf).then(() => {
                tr.add_signer(pKey);
                if (__DEBUG__) {
                    console.log('transfer serialize');
                    console.log(tr.serialize());
                }
                return tr.broadcast()
            })
        })
    },

    /**
     * 获取代理全局参数
     */
    getVotePrams(){
        return this.getParameters().then((res) => {
            //console.log(res);
            let Param = {
                max_governance_voting_proxy_level: res.params.max_governance_voting_proxy_level,  //最大代理层数
                min_governance_voting_balance: this.realCount(Long.fromValue(res.params.min_governance_voting_balance).toNumber()), //投票资格最低的实际金额
                governance_voting_expiration_blocks: res.params.governance_voting_expiration_blocks ,//
                max_witnesses_voted_per_account:res.params.max_witnesses_voted_per_account
            };
            return Param
        })
    },


    /**
     * 获取代理投票 操作费用
     * @param uid 帐号
     * @param adds 增加的人选
     * @param removes 去掉的人选
     * @param op_type op类型
     */
    getFees(uid,uid_target,adds,removes,op_type){
        if(op_type == "proxy"){
            return this.buildProxyData(uid_target).then(op_data=>{
                return this.getOperationsFees('account_update_proxy', op_data, uid).catch(error=>{
                    console.log(error)
                })
            })
        }else if(op_type == "vote_witness"){
            return this.buildWitnessVoteData(adds,removes).then(op_data=>{
                return this.getOperationsFees('witness_vote_update', op_data, uid).catch(error=>{
                    console.log(error)
                })
            })
        }else if(op_type == "vote_committee"){
            return this.buildCommitteeVoteData(adds,removes).then(op_data=>{
                return this.getOperationsFees('committee_member_vote_update', op_data, uid).catch(error=>{
                    console.log(error)
                })
            })
        }
    },


    /**
     * 获取投票信息
     * @param uid: 查询id
     */
    getVoteInfo(uid){
        if (!ChainValidation.is_account_uid(uid)) {
            return Promise.reject(new Error('invalid account uid'));
        } else {
            return Apis.instance().db_api().exec("get_full_accounts_by_uid", [[uid], {
                fetch_voter_object: true,
                fetch_committee_member_votes: true,
                fetch_witness_votes: true,
                fetch_committee_member_object:true,
                fetch_witness_object: true,
                fetch_statistics:true
            }])
        }
    },

    /**
     * 授权零钱权限
     */
    updateAuthority(uid, pid, priKey){
        return new Promise((resolve, reject) => {
            Apis.instance().db_api().exec("get_accounts_by_uid", [[uid], {
            }]).then(uObj => {
                if(uObj.length >= 1 && uObj[0] != null){
                    let secondary = uObj[0].secondary;

                    let curWallet = WalletStore.getWallet();
                    let pKey = WalletStore.decryptTcomb_PrivateKey(curWallet.encrypted_active);
                    let hasAuth = false;
                    for(let auth of secondary.account_uid_auths){
                        if(auth[0].uid == pid) hasAuth = true;
                    }
                    //一个UID只能存在一次 else 已经授权过的情况跳过授权操作
                    if(!hasAuth){
                        let op_data = {
                            uid: uid,
                            platform: pid
                        }
            
                        let tr = new TransactionBuilder();
                        tr.add_type_operation("account_auth_platform", op_data);
                        tr.set_required_fees(uid, true, true).then(() => {
                            tr.add_signer(priKey); // 资金密钥
                                tr.broadcast(() => {
                                    resolve();
                                }).then(() => {
                                    resolve();
                                }).catch(err => {
                                    if(err.message.indexOf('less than required') >= 0) err = {message: counterpart.translate("authorize_service.insufficient")}
                                    reject(err);
                                });
                        }).catch(e => {
                            reject(e);
                        });
                    }else{
                        resolve();
                    }
                }else{
                    reject({message: counterpart.translate("authorize_service.invalid_account")});
                }
            });
        });
    },

    /**
     * 处理op操作
     * @param {String} op_type - op 类型
     * @param {Object} op_data - op 操作数据
     * @param {Number|String} pay_uid - 操作者 yoyow id
     * @param {Boolean} useBalance - 是否使用余额 true , 零钱 false
     * @param {Boolean} useCsaf - 是否使用积分
     * @param {String} priKey - 私钥
     * @param {Boolean} broadcast - 是否广播 , 为false
     * @returns {Promise<U>|*|Thenable<U>|Promise.<TResult>} 不广播的情况 resolve 操作费率, 否则resolve {block_num, txid};
     */
    // __processTransaction(op_type, op_data, pay_uid, useBalance, useCsaf, priKey, broadcast = true){
    //     let tr = new TransactionBuilder();
    //     tr.add_type_operation(op_type, op_data);
    //     if(broadcast){
    //         return tr.set_required_fees(pay_uid, useBalance, useCsaf).then(() => {
    //             tr.add_signer(priKey);
    //             return new Promise((resolve, reject) => {
    //                 tr.broadcast(res => {
    //                     resolve();
    //                 }).then(() => {
    //                     resolve();
    //                 }).catch(err => {
    //                     reject(Utils.formatError(err));
    //                 });
    //             });
    //         }).catch(err => {
    //             return Promise.reject(Utils.formatError(err));
    //         });
    //     }else{
    //         return tr.get_fees_by_ops(pay_uid).then(fees => {
    //             let csaf_can = fees.min_fees.sub(fees.min_real_fees); // 可用积分抵扣部分
    //             let csaf_balance = Long.fromValue(fees.statistics.csaf); // 积分余额
    //             let use_csaf = Long.ZERO; // 本次交易可用积分
    //             // 积分足够，交易可用为最大可用抵扣 | 积分不足，交易可用为全部积分余额
    //             use_csaf = csaf_balance.gte(csaf_can) ? csaf_can : csaf_balance;
    //             let with_csaf_fees = fees.min_fees.sub(use_csaf); //用积分抵扣后剩余费用
    //             let result = {
    //                 min_fees: Utils.realCount(fees.min_fees),
    //                 min_real_fees: Utils.realCount(fees.min_real_fees),
    //                 use_csaf: Utils.realCount(use_csaf),
    //                 with_csaf_fees: Utils.realCount(with_csaf_fees),
    //                 useCsaf: useCsaf // 是否使用积分
    //             };
    //             return result;
    //         }).catch(err => {
    //             return Promise.reject(Utils.formatError(err));
    //         });
    //     }
    // }

    __processTransaction(op_type, op_data, pay_uid, useBalance, useCsaf, priKey, broadcast = false){
        return new Promise((resolve, reject) => {
            TransactionHelper.process_transaction(op_type, op_data, pay_uid, useBalance, useCsaf, priKey, broadcast).then(res => {
                if(!broadcast){
                    res.min_fees = Utils.realCount(res.min_fees.toNumber());
                    res.min_real_fees = Utils.realCount(res.min_real_fees.toNumber()),
                    res.use_csaf = Utils.realCount(res.use_csaf.toNumber()),
                    res.with_csaf_fees = Utils.realCount(res.with_csaf_fees.toNumber()),
                    res.useCsaf = useCsaf // 是否使用积分
                }
                resolve(res);
            }).catch(err => reject(err));    
        })
    },

    /**
     * 创建资产
     * @param {String | Number} issuer - 资产拥有者uid
     * @param {String} symbol - 资产符号 必须为大写字母
     * @param {Number} precision - 资产精度
     * @param {Number} max_supply - 最大供应量
     * @param {String} description - 资产描述 基于中文出现的问题，暂要求资产备注大于28个字符，中文占2字符
     * @param {PrivateKey} priKey - 签名私钥
     * @param {Boolean} broadcast - 是否广播
     */
    createAsset(issuer, symbol, precision, max_supply, description, priKey, broadcast){
        let realVal = Long.fromValue(max_supply).mul(Utils.precisionToNum(precision)).toString();
        let op_data = {
            issuer: issuer,
            symbol: symbol,
            precision: precision,
            common_options: {
                max_supply: realVal,
                market_fee_percent: 0,
                max_market_fee: 0,
                issuer_permissions: 0,
                flags: 0,
                description: description
            },
            extensions: {
                initial_supply: realVal
            }
        };

        if(broadcast){
            let curWallet = WalletStore.getWallet();
            priKey = WalletStore.decryptTcomb_PrivateKey(curWallet.encrypted_active);
        }

        return this.__processTransaction('asset_create', op_data, issuer, true, false, priKey, broadcast);
    },

};