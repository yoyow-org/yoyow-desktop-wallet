import React from "react";
import BaseComponent from "../BaseComponent";
import {connect} from "alt-react";
import WalletStore from '../../stores/WalletStore';
import TokenActions from '../../actions/TokenActions';
import TokenStore from '../../stores/TokenStore';
import Utils from '../../utils/Utils';
import TokenCreate from './TokenCreate';

class TokenContainer extends BaseComponent {
    constructor(){
        super();
        this.state = {};
    }

    componentWillMount(){
        TokenActions.getAssets();
    }

    componentWillUpdate(){

    }

    handleIssueToken(){
        TokenActions.toggleDialog(true);
    }

    render(){
        let {tokens, loading} = this.props;

        return (
            <div className="layer-settings">
                <h3>{this.translate("Token.title")}</h3>
                <input type="button" className="button float-right" value={this.translate("Token.issue_button")} onClick={this.handleIssueToken.bind(this)} />
                <br/><br/>
                {
                    <table className="content-table" cellSpacing={0}>
                        <thead>
                        <tr>
                            <th width={220}>{this.translate("Token.tab_head_symbol")}</th>
                            <th width={220}>{this.translate("Token.tab_head_max")}</th>
                            <th width={150}>{this.translate("Token.tab_head_precision")}</th>
                            <th width={420}>{this.translate("Token.tab_head_desc")}</th>
                        </tr>
                        </thead>
                        <tbody>
                        {
                            tokens.length == 0 ? null : 
                            tokens.map((t, inx) => {
                                let desc = t.options.description;
                                return (
                                    <tr key={'token-c-'+inx}>
                                        <td>{t.symbol}</td>
                                        <td >{Utils.formatToken(t.options.max_supply, t.precision).toString()}</td>
                                        <td >{t.precision}</td>
                                        <td title={desc}>{`${desc.substring(0,15)}${desc.length > 15 ? '......' : ''}`}</td>
                                    </tr>
                                )
                            })
                        }
                        </tbody>
                    </table>
                }
                <TokenCreate />
            </div>
        );
    }
}

const stores = [WalletStore, TokenStore];

export default connect(TokenContainer, {
    listenTo(){
        return stores;
    },
    getProps(){
        let result = {};
        for (let store of stores) {
            for (let props in store.getState()) {
                result[props] = store.getState()[props];
            }
        }
        return result;
    }
});