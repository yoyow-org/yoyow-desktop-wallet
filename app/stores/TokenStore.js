import alt from "../altInstance";
import BaseStore from "./BaseStore";
import TokenActions from "../actions/TokenActions";
import {ChainStore} from "yoyowjs-lib";
import ChainApi from '../api/ChainApi';
import WalletStore from './WalletStore';
import {remove} from 'lodash';

class TokenStore extends BaseStore {

    constructor(){
        super();
        this.bindActions(TokenActions);
        this.state = {
            tokens: [],
            balance: {},
            fees: {},
            loading: false,
            visible: false,
            title: '',
            height: 240,
            width: 630,
            loading: false
        }
    }

    onGetAssets(){
        let uid = WalletStore.getWallet().yoyow_id;
        Promise.all([
            ChainStore.fetchAssets(),
            ChainApi.getBalanceByUid(uid),
        ]).then(res => {
            let tokens = res[0];
            let balance = res[1];
            tokens.sort((t1, t2) => {
                return t2.asset_id - t1.asset_id;
            })
            remove(tokens, t => {
                return t.issuer != uid;
            });
            this.setState({tokens, balance});
        }).catch(err => {
            if(__DEBUG__) console.log(err);
        });
    }

    onCreateToken({issuer, symbol, precision, max_supply, description, broadcast, resolve, reject}){
        this._toggleLoading(true);
        ChainApi.createAsset(issuer, symbol, precision, max_supply, description, null, broadcast).then(res => {
            this._toggleLoading(false);
            if(!broadcast){
                this.setState({fees: res});
            }else{
                resolve(res);
            }
        }).catch(err => {
            this._toggleLoading(false);
            if(__DEBUG__) console.log('error ', err);
            reject(err);
        })
    }

    onToggleDialog(visible){
        this.setState({visible});
    }

    _toggleLoading(loading){
        this.setState({loading});
    }
}

export default alt.createStore(TokenStore, 'TokenStore');