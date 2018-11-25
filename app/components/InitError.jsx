
import React from "react";
import SettingsStore from '../stores/SettingsStore';
import {connect} from "alt-react";
import Modal from "../components/Layout/Modal";
import BaseComponent from "../components/BaseComponent";
import SettingsActions from "../actions/SettingsActions";
import TextLoading from "./Layout/TextLoading"

class InitError extends BaseComponent {
    constructor(props) {
        super(props);
        this.state = {
            modalIsShow: false,
            apiVal: "",
            connectState: false,
            errorText:false,
            loading:false
        }
    }

    modelToggle() {
        this.state.modalIsShow ? this.setState({modalIsShow: false}) : this.setState({modalIsShow: true});
    }

    addAPIVal() {
        let apiVal = this.refs.apiVal.value;
        if (apiVal && (apiVal.startsWith("ws://") || apiVal.startsWith("wss://"))) {
            this.setState({errorText:false});
            SettingsActions.addWS(apiVal);
        } else {
            this.setState({errorText: true})
        }
    }

    onApiChange(i,item) {
        let val = item.value;
        SettingsActions.changeSetting({setting: "apiServer", value: val});
        this.setState({apiVal: val,loading:true});
        this.onTestApi(val);
        //this.modelToggle();
    }
    onTestApi(val){

        let socket = new WebSocket(val);
        this.setState({connectState:false})
        socket.onopen =()=>{
            this.setState({connectState:true,loading:false,modalIsShow:false});
        };
        socket.onerror = (err)=>{
            this.setState({connectState:false,loading:false,modalIsShow:false});
        }
    }
    delApi(index, item) {
        SettingsActions.removeWS(index);
        if (item.value === this.props.settings.get('apiServer')) {
            let api = this.props.defaults.apiServers[0];
            this.onApiChange(index,api)
        }

    }

    goToIndex() {
        this.routerPush("/");
        window.location.reload()
    }
    componentWillMount(){
        let {defaults, settings} = this.props;
        let curApi = settings.get("apiServer");
        this.onTestApi(curApi)
    }
    render() {
        let {defaults, settings} = this.props;
        let curApi = settings.get("apiServer");
        let valList = defaults.apiServers;
        let stateClass = "";
        return (
            <div className="cover-full page">
                <Modal width={550} height={300} visible={this.state.modalIsShow} onClose={this.modelToggle.bind(this)}>
                    {this.state.loading?<div className="loading-layer">
                        <div className="loading-mask"></div>
                        <TextLoading/>
                    </div>:""}

                    <div className="layer-modal-intl-error">
                        <div className="encrypt">
                            <h4>{this.translate("Apisettings.Api_setting_title")}</h4>
                            <ul>
                                {valList.map((item, i) => {
                                    return (

                                        <li key={i}>
                                            <span onClick={this.onApiChange.bind(this,i,item)}
                                                  value={item.value}>{item.text}</span>
                                            <em onClick={this.delApi.bind(this, i, item)}>{this.translate("Apisettings.button_val_del")}</em>
                                        </li>
                                    )
                                })}
                            </ul>
                            <div className="layer-list">
                                <input ref="apiVal" type="text"/>
                                <button onClick={this.addAPIVal.bind(this)} type="button">{this.translate("Apisettings.button_val_add")}</button>
                            </div>
                            {this.state.errorText?<div className="layer-list"><span className="error-text">{this.translate("Apisettings.errorMsg")}</span></div>:null}


                        </div>
                    </div>
                </Modal>
                <div className="box-center">
                    <h1>{this.translate("init_error.title")}</h1>
                    <p>{this.translate("init_error.tips_time")}</p>
                    <span className="clock"></span>
                    <p>{this.translate("init_error.tips_API")}</p>
                    <p style={{marginTop: "35px"}}>{this.translate("init_error.API_setting.title")}</p>
                    <div className="apiCtr">
                        <span>{this.translate("init_error.API_setting.label_API")}:</span>
                        <span>{curApi}</span>
                        <button onClick={this.modelToggle.bind(this)} type="button">{this.translate("init_error.API_setting.button_change_API")}</button>
                        <button ref="back" onClick={this.goToIndex.bind(this)} disabled={this.state.connectState?false:true}  type="button">{this.translate("init_error.API_setting.button_back_home")}</button>

                    </div>
                    {/*<p style={{marginTop:"25px"}}>{curApi}</p>*/}
                    {/*<button onClick={this.modelToggle. bind(this)} type="button">添加API服务器</button>*/}
                    {/*<button type="button">返回主页</button>*/}
                    <div className="state">
                        <span>Connection Status</span>
                        <em className={this.state.connectState?"":"disconnect"} ref="connectState">{this.state.connectState ? this.translate("init_error.API_state.connecting") : this.translate("init_error.API_state.disconnected")}</em>
                    </div>
                </div>
            </div>
        )
    }
}

export default  connect(InitError, {
    listenTo() {
        return [SettingsStore];
    },
    getProps() {
        return SettingsStore.getState();
    }
});