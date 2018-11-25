import React from "react";
import {Route, IndexRoute} from "react-router";
import App from "./App";
import enterTransition from "./EnterTransition";

if (__ELECTRON__) {
    require("./electron_imports");
}

function loadRoute(cb, moduleName = "default") {
    return (module) => cb(null, module[moduleName]);
}

function errorLoading(err) {
    console.error("动态加载组件失败：", err);
}

const routes = (
    <Route path="/" component={App} onEnter={enterTransition}>
        <IndexRoute getComponent={(location, cb) => {
            System.import("components/Balances/BalanceContainer").then(loadRoute(cb)).catch(errorLoading);
        }}/>
        <Route path="/ERC20Gateway" getComponent={(location, cb) => {
            System.import("components/Balances/ERC20Gateway").then(loadRoute(cb)).catch(errorLoading);
        }}/>
        <Route path="/import-file" getComponent={(location, cb) => {
            System.import("components/Settings/ImportFile").then(loadRoute(cb)).catch(errorLoading);
        }}/>
        <Route path="/balance" getComponent={(location, cb) => {
            System.import("components/Balances/BalanceContainer").then(loadRoute(cb)).catch(errorLoading);
        }}/>
        <Route path="/create-account" getComponent={(location, cb) => {
            System.import("components/CreateAccount").then(loadRoute(cb)).catch(errorLoading);
        }}/>
        <Route path="/restore-account" getComponent={(location, cb) => {
            System.import("components/RestoreAccount").then(loadRoute(cb)).catch(errorLoading);
        }}/>
        <Route path="/init-error" getComponent={(location, cb) => {
            System.import("components/InitError").then(loadRoute(cb)).catch(errorLoading);
        }}/>
        <Route path="/certification" getComponent={(location, cb) => {
            System.import("components/platform/Certification").then(loadRoute(cb)).catch(errorLoading);
        }}/>
        <Route path="/contacts" getComponent={(location, cb) => {
            System.import("components/Contacts/Contacts").then(loadRoute(cb)).catch(errorLoading);
        }}/>
        <Route path="/transfer" getComponent={(location, cb) => {
            System.import("components/Transfer").then(loadRoute(cb)).catch(errorLoading);
        }}/>
        <Route path="/history" getComponent={(location, cb) => {
            System.import("components/History").then(loadRoute(cb)).catch(errorLoading);
        }}/>
        <Route path="/backup-account" getComponent={(location, cb) => {
            System.import("components/BackupAccount").then(loadRoute(cb)).catch(errorLoading);
        }}/>
        <Route path="/authorize-service" getComponent={(location, cb) => {
            System.import("components/AuthorizeService").then(loadRoute(cb)).catch(errorLoading);
        }}/>
        <Route path="/token" getComponent={(location, cb) => {
            System.import("components/Token/TokenContainer").then(loadRoute(cb)).catch(errorLoading);
        }}/>
        <Route path="/import-account" getComponent={(location, cb) => {
            System.import("components/ImportAccount").then(loadRoute(cb)).catch(errorLoading);
        }}/>
        <Route path="/vote" getComponent={(location, cb) => {
            System.import("components/Vote/Vote").then(loadRoute(cb)).catch(errorLoading);
        }}/>
        <Route path="/Proxy" getComponent={(location, cb) => {
            System.import("components/Vote/Proxy").then(loadRoute(cb)).catch(errorLoading);
        }}/>
        <Route path="/help" getComponent={(location, cb) => {
            System.import("components/Help").then(loadRoute(cb)).catch(errorLoading);
        }}>
            <Route path=":path1" getComponent={(location, cb) => {
                System.import("components/Help").then(loadRoute(cb)).catch(errorLoading);
            }}>
                <Route path=":path2" getComponent={(location, cb) => {
                    System.import("components/Help").then(loadRoute(cb)).catch(errorLoading);
                }}/>
            </Route>
        </Route>
        <Route path="/settings" getComponent={(location, cb) => {
            System.import("components/Settings/SettingsContainer").then(loadRoute(cb)).catch(errorLoading);
        }}>
            <IndexRoute getComponent={(location, cb) => {
                System.import("components/Settings/Account").then(loadRoute(cb)).catch(errorLoading);
            }}/>
            <Route path="/settings/account" getComponent={(location, cb) => {
                System.import("components/Settings/Account").then(loadRoute(cb)).catch(errorLoading);
            }}/>
            <Route path="/settings/viewpurview" getComponent={(location, cb) => {
                System.import("components/Settings/ViewPurview").then(loadRoute(cb)).catch(errorLoading);
            }}/>
            <Route path="/settings/onapichange" getComponent={(location, cb) => {
                System.import("components/Settings/OnAPIChange").then(loadRoute(cb)).catch(errorLoading);
            }}/>
            <Route path="/settings/backup-account" getComponent={(location, cb) => {
                System.import("components/BackupAccount").then(loadRoute(cb)).catch(errorLoading);
            }}/>
            <Route path="/settings/import-account" getComponent={(location, cb) => {
                System.import("components/ImportAccount").then(loadRoute(cb)).catch(errorLoading);
            }}/>
            <Route path="/settings/changepassword" getComponent={(location, cb) => {
                System.import("components/Settings/ChangePassWord").then(loadRoute(cb)).catch(errorLoading);
            }}>
                <IndexRoute getComponent={(location, cb) => {
                    System.import("components/Settings/ChangeAccountPassWord").then(loadRoute(cb)).catch(errorLoading);
                }}/>
                <Route path="/settings/changeaccountpassword" getComponent={(location, cb) => {
                    System.import("components/Settings/ChangeAccountPassWord").then(loadRoute(cb)).catch(errorLoading);
                }}/>
                <Route path="/settings/changewalletpassword" getComponent={(location, cb) => {
                    System.import("components/Settings/ChangeWalletPassWord").then(loadRoute(cb)).catch(errorLoading);
                }}/>
            </Route>
        </Route>
    </Route>
);

export default routes;