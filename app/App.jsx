import React from "react";
import IntlStore from "stores/IntlStore";
import IntlActions from "actions/IntlActions";
import alt from "altInstance";
import {connect, supplyFluxContext} from "alt-react";
import {IntlProvider} from "react-intl";
import NotificationSystem from "react-notification-system";
import {ChainStore} from "yoyowjs-lib/es"
import {Apis} from "yoyowjs-ws";
import NotificationStore from "stores/NotificationStore";
import intlData from "components/Utility/intlData";

import Header from "components/Layout/Header";
import Footer from "components/Layout/Footer";
import LeftMenu from "components/Layout/LeftMenu"
import Confirm from "components/Layout/Confirm";
import UnlockWallet from "components/UnlockWallet";
import TextLoading from "components/Layout/TextLoading";
import InitError from "components/InitError";
import BroInfo from "components/Layout/BroInfo"

import PrivateKeyStore from "stores/PrivateKeyStore";//不要删除，加载接收数据用

class App extends React.Component {
    constructor() {
        super();
        let syncFail = ChainStore.subError && (ChainStore.subError.message === "ChainStore sync error, please check your system clock") ? true : false;
        this.state = {
            loading: true,
            synced: ChainStore.subscribed,
            syncFail,
            modalIsShow:false,
            broType:this.isChorme()
        };

    }

    _onNotificationChange() {
        let notification = NotificationStore.getState().notification;
        if (notification.autoDismiss === void 0) {
            notification.autoDismiss = 10;
        }
        if (this.refs.notificationSystem) this.refs.notificationSystem.addNotification(notification);
    }

    componentWillUnmount() {
        NotificationStore.unlisten(this._onNotificationChange);

    }

    componentDidMount() {

        try {
            NotificationStore.listen(this._onNotificationChange.bind(this));
            ChainStore.init().then(() => {
                this.setState({synced: true, loading: false});
            }).catch(error => {
                if (__DEBUG__) console.log("----- ChainStore.init error ----->", error);
                let syncFail = ChainStore.subError && (ChainStore.subError.message === "ChainStore sync error, please check your system clock") ? true : false;

                this.setState({loading: false, synced: false, syncFail});
            });
        } catch (e) {
            console.error("e:", e);
        }
    }
    isChorme(){
        let broType = ""
        let browserInfo = window.navigator.userAgent;
        if(browserInfo.indexOf("BIDUBrowser")> -1){
            broType = "baidu"
        }else if(browserInfo.indexOf("OPR")> -1){
            broType = "opear"
        }else if(browserInfo.indexOf("Trident")> -1){

            broType = "IE"
        }else if(browserInfo.indexOf("Firefox")>-1){
            broType = "Firefox"
        }else if(browserInfo.indexOf("Edge")> -1){
            broType = "Edge"
        }else if(browserInfo.indexOf("Chrome") && window.chrome){
            if(window.navigator.mimeTypes.length > 20){
                broType = "360"
            }else{
                broType = "Chrome"
            }

        }else if(browserInfo.indexOf("Safari")>-1||browserInfo.indexOf('WebKit')>>-1){
            if(browserInfo.indexOf("YOYOW-wallet")>-1){
                broType = "elec"
            }else{
                broType = "Safari"
            }

        }
        return broType

    }
    render() {
        let def = (<div className="layer-content-flex-v"
                        style={{
                            textAlign: "center",
                            fontSize: "80px",
                            WebkitBoxPack: "center",
                            MozBoxPack: "center"
                        }}>
            <TextLoading/>
        </div>);
        let content = def;
        if (this.state.loading) {
            content = def;
        } else if (this.state.syncFail) {
            content = (
                <InitError/>
            );
        } else if (this.props.location.pathname === "/init-error") {
            content = this.props.children;
        } else if (this.props.location.pathname === "/create-account"
            || this.props.location.pathname === "/import-file"
            || this.props.location.pathname === "/restore-account"
            || this.props.location.pathname === "/authorize-service") {
            content = (
                <div className="layer-content-flex-v">
                    <Header/>
                    <div className="content">
                        {this.props.children}
                    </div>
                    <Footer synced={this.state.synced}/>
                </div>
            );
        } else if (this.props.location.pathname.startsWith('/help')) {
            content = (
                <div className="layer-content-flex-v">
                    <Header/>
                    <div className="content">
                        {this.props.children}
                    </div>
                    <Footer synced={this.state.synced}/>
                </div>
            );
        }
        else {
            content = (
                <div className="layer-content-flex-v">
                    <Header/>
                    <div className="content">
                        <div>
                            <LeftMenu/>
                            <div className="content-layer">
                                {this.props.children}
                            </div>

                        </div>
                    </div>
                    <Footer synced={this.state.synced}/>
                </div>
            );
        }
        return (
            <div className="cover-full">
                {content}
                <NotificationSystem
                    ref="notificationSystem" allowHTML={true}
                    style={{
                        Containers: {
                            DefaultStyle: {
                                width: "425px"
                            }
                        }
                    }}
                />
                {this.state.broType == "Chrome"||this.state.broType=="elec"?"":<BroInfo/>}
                <UnlockWallet/>
                <Confirm/>
            </div>
        );
    }
}

class RootIntl extends React.Component {
    componentWillMount() {
        IntlActions.switchLocale(this.props.locale);
    }

    render() {
        return (
            <IntlProvider
                locale={this.props.locale}
                formats={intlData.formats}
                initialNow={Date.now()}
            >
                <App {...this.props}/>
            </IntlProvider>
        );
    }
}

RootIntl = connect(RootIntl, {
    listenTo() {
        return [IntlStore];
    },
    getProps() {
        return {
            locale: IntlStore.getState().currentLocale
        };
    }
});

class Root extends React.Component {
    static childContextTypes = {
        router: React.PropTypes.object,
        location: React.PropTypes.object
    }

    getChildContext() {
        return {
            router: this.props.router,
            location: this.props.location
        };
    }

    render() {
        return <RootIntl {...this.props} />;
    }
}

export default supplyFluxContext(alt)(Root);