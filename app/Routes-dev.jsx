import React from "react";
import {Route, IndexRoute} from "react-router";
import App from "./App";

import BalanceContainer from "./components/Balances/BalanceContainer";
import CreateAccount from "./components/CreateAccount";
import RestoreAccount from "./components/RestoreAccount";
import enterTransition from "./EnterTransition";
import InitError from "components/InitError";
import Certification from "components/platform/Certification";
import YoyowAccount from "components/platform/YoyowAccount";
import Contacts from "./components/Contacts/Contacts";
import Transfer from "./components/Transfer";
import History from "./components/History";
import SettingsContainer from "./components/Settings/SettingsContainer"
import Account from "./components/Settings/Account"
import ChangePassWord from "./components/Settings/ChangePassWord"
import ChangeAccountPassWord from "./components/Settings/ChangeAccountPassWord"
import ChangeWalletPassWord from "./components/Settings/ChangeWalletPassWord"
import OnAPIChange from "./components/Settings/OnAPIChange"
import ExampleForForm from "./components/Layout/ExampleForForm"
import BackupAccount from "./components/BackupAccount";
import ImportAccount from "./components/ImportAccount";
import ViewPurview from "./components/Settings/ViewPurview";
import RestoreWalletPwd from "./components/Settings/RestoreWalletPwd";
import ImportFile from "./components/Settings/ImportFile"
import ERC20Gateway from "./components/Balances/ERC20Gateway";
import Help from "./components/Help";
import AuthorizeService from "./components/AuthorizeService";
import Vote from "./components/Vote/Vote";
import Proxy from "./components/Vote/Proxy";
import TokenContainer from './components/Token/TokenContainer';

const routes = (
    <Route path="/" component={App} onEnter={enterTransition}>
        <IndexRoute component={BalanceContainer}/>
        <Route path="create-account" component={CreateAccount}/>
        <Route path="restore-account" component={RestoreAccount}/>
        <Route path="balance" component={BalanceContainer}/>
        <Route path="init-error" components={InitError}/>
        <Route path="certification" components={Certification}/>
        <Route path="yoyowAccount" components={YoyowAccount}/>
        <Route path="contacts" components={Contacts}/>
        <Route path="transfer" components={Transfer}/>
        <Route path="history" components={History}/>
        <Route path='settings' component={SettingsContainer}>
            <IndexRoute component={Account}/>
            <Route path="/settings/account" component={Account}/>
            <Route path="/settings/viewpurview" component={ViewPurview}/>
            <Route path="/settings/changepassword" component={ChangePassWord}>
                <IndexRoute component={ChangeAccountPassWord}/>
                <Route path="/settings/changeaccountpassword" component={ChangeAccountPassWord}/>
                <Route path="/settings/changewalletpassword" component={ChangeWalletPassWord}/>
            </Route>
            <Route path="/settings/backup-account" components={BackupAccount}/>
            <Route path="/settings/import-account" components={ImportAccount}/>
            <Route path="/settings/onapichange" component={OnAPIChange}/>
            <Route path="/settings/restore-wallet-pwd" component={RestoreWalletPwd}/>

        </Route>
        <Route path="backup-account" components={BackupAccount}/>
        <Route path="import-account" components={ImportAccount}/>
        <Route path="example" components={ExampleForForm}/>
        <Route path="import-file" component={ImportFile}/>
        <Route path="ERC20Gateway" component={ERC20Gateway}/>
        <Route path="vote" component={Vote}/>
        <Route path="Proxy" component={Proxy}/>
        <Route path="help" component={Help}>
            <Route path=":path1" component={Help}>
                <Route path=":path2" component={Help}/>
            </Route>
        </Route>
        <Route path="authorize-service" component={AuthorizeService}/>
        <Route path="token" component={TokenContainer}/>
    </Route>);

export default routes;
