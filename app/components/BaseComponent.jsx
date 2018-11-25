
import React from "react";
import {intlShape} from 'react-intl';
import counterpart from "counterpart";
import WalletActions from "../actions/WalletActions"
import WalletStore from "../stores/WalletStore";
import ConfirmActions from "../actions/layout/ConfirmActions"

class BaseComponent extends React.Component {
    static contextTypes = {
        intl: intlShape.isRequired,
        router: React.PropTypes.object
    };

    constructor(props) {
        super(props);
        this.routerPush = this.routerPush.bind(this);
    }

    /**
     * 跳转到指定url
     * @param url
     */
    routerPush(url) {
        this.context.router.push(url);
    }

    translate(locale_keypath,options) {
        if (null != locale_keypath && "" != locale_keypath) {
            return counterpart.translate(locale_keypath,options);
        }
        return "不存在的语言项";
    }
    checkAccountValid(callback){
        let wallet = WalletStore.getWallet();
        WalletActions.checkAccountValid(wallet.yoyow_id, wallet.encrypted_memo.pubkey).then((isV) => {
            if(isV){
                callback()
            }else{
                ConfirmActions.alert(this.translate("error.error_account"))
            }

        }).catch(err => {
            console.log(err)
        });
    }
}

export default BaseComponent;
 