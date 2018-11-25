
import React from "react";
import {connect} from "alt-react";
import WalletStore from "../../stores/WalletStore";
import WalletActions from "../../actions/WalletActions";
import WalletUnlockActions from "../../actions/WalletUnlockActions";
import AccountSelect from "../form/AccountSelect";
import WalletUnlockStore from "../../stores/WalletUnlockStore";
import SettingsStore from "../../stores/SettingsStore";
import IntlActions from "../../actions/IntlActions";
import ActionSheet from "../form/ActionSheet";
import BaseComponent from "../BaseComponent";
import IntlStore from "../../stores/IntlStore";

import logo from "../../assets/img/logo.png";

const FlagImage = ({flag, width = 20, height = 20}) => {
    return <img height={height} width={width} src={"language/" + flag.toUpperCase() + ".png"}/>;
};

class Header extends BaseComponent {
    constructor() {
        super();

    }

    onSelectAccount(e) {
        WalletActions.changeAccount(e);
    }

    lockAll(e) {
        e.preventDefault();
        WalletUnlockActions.lockall();
    }

    render() {
        let {accountList, wallet, shortLocked, locked, currentLocale} = this.props;
        let lockCSS = (shortLocked && locked) ? null : "unlock";
        let viewButton = (
            <span style={{width: "40px", background: "none", cursor: "pointer"}}>
                <FlagImage flag={currentLocale} width="30" height="30"/>
            </span>);
        return (
            <div className="header">
                <div>
                    <div className="logo"><img src={logo}/></div>
                    <div style={{flex: 1}}></div>
                    <div className="account_ctr">
                        <div style={{display: "flex"}}>
                            {accountList.size < 1 ? null :
                                <AccountSelect onChange={this.onSelectAccount.bind(this)}
                                               accountList={accountList.toArray()}
                                               currentUid={wallet.yoyow_id}
                                />
                            }
                            {accountList.size < 1 ? null :
                                <input className={lockCSS} type="button" value="" onClick={this.lockAll.bind(this)}/>
                            }
                            <ActionSheet viewButton={viewButton}
                                         style={{width: "40px", lineHeight: 5.5}} className="select-input">
                                <ul>
                                    {this.props.locales.map((locale) => {
                                        return (
                                            <li key={locale} style={{height: "42px", lineHeight: "42px"}}>
                                            <span onClick={(e) => {
                                                e.preventDefault();
                                                IntlActions.switchLocale(locale);
                                            }} style={{textAlign: "left", paddingLeft: "10px"}}>
                                                <FlagImage flag={locale}/> {this.translate(`languages.${locale}`)}
                                            </span>
                                            </li>);
                                    })}
                                </ul>
                            </ActionSheet>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default connect(Header, {
    listenTo() {
        return [WalletStore, WalletUnlockStore];
    },
    getProps() {
        return {
            accountList: WalletStore.getState().accountList,
            wallet: WalletStore.getState().wallet,
            locked: WalletUnlockStore.getState().locked,
            shortLocked: WalletUnlockStore.getState().shortLocked,
            currentLocale: IntlStore.getState().currentLocale,
            locales: SettingsStore.getState().defaults.locale
        };
    }
});