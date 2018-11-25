"use strict";

import ChainApi from './ChainApi';
import FetchApi from './FetchApi';

export default {

    createAccount(account) {
        return new Promise((resolve, reject) => {
            ChainApi.createAccount(account).then(data => {
                FetchApi.post('api/v1/createAccount', data)
                    .then(res => {
                        resolve(res);
                    })
                    .catch(err => {
                        reject(err)
                    });
            }).catch(err => {
                reject(err);
            });
        });
    },

    /**
     * 通过uid 获取账户信息（目前信息为链上信息）
     * @param uid
     * @returns {*}
     */
    getAccountByUid(uid){
        return FetchApi.get('api/v1/getAccount', {uid: uid});
    },

    /**
     * 获取邀请码
     * @param uid
     * @returns {*}
     */
    getInvitationCode(uid){
        return FetchApi.get('api/v1/getCode', {uid: uid});
    },

    /**
     * 获取操作历史
     * @param uid
     * @returns {*}
     */
    getHistoryByUid(uid){
        return FetchApi.get('api/v1/getHistoryByUid', {uid: uid});
    },

    /**
     * 获取余额
     * @param uid
     * @returns {*}
     */
    getBalanceByUid(uid){
        return FetchApi.get('api/v1/getBalanceByUid', {uid: uid});
    }

};