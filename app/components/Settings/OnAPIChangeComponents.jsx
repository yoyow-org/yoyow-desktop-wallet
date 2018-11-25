import React from "react"
import BaseComponent from "../BaseComponent"
import SettingsActions from "../../actions/SettingsActions"
import DownSelect from "../form/DownSelect";
import Modal from "../../components/Layout/Modal";
import SttingsStore from "../../stores/SettingsStore"

class OnAPIChangeComponents extends BaseComponent {
    constructor(props) {
        super(props);
        this.state = {
            ModalVisible: false,
            errorText:false
        }
    }
    delApi(index, item) {
        SettingsActions.removeWS(index);
        if (item.value === this.props.settings.get('apiServer')) {
            let api = this.props.defaults.apiServers[0];
            this.onApiChange(index,api)
        }

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
    onAPIChange(d,i) {
        SettingsActions.changeSetting({setting: "apiServer", value: d.value})
        setTimeout(()=>{
            window.location.reload();
        },250)
    }
    autoSelect(){
        SttingsStore.setFastestAddr();
        setTimeout(()=>{
            window.location.reload();
        },250)
    }
    modelToggle() {
        this.state.modalIsShow ? this.setState({modalIsShow: false}) : this.setState({modalIsShow: true});
    }
    render() {

        let apiVal = this.props.settings.get("apiServer");
        let apiServerArr = this.props.defaults.apiServers;
        let apiObj = "";
        for(let i in apiServerArr){
            if(apiVal == apiServerArr[i].value){

                apiObj = apiServerArr[i]
            }
        }
        return (

            <div className="layer-settings">
                <Modal width={550} height={300} visible={this.state.modalIsShow} onClose={this.modelToggle.bind(this)}>
                    <div className="layer-modal-intl-error">

                        <div className="encrypt">
                            <h4>{this.translate("Apisettings.Api_setting_title")}</h4>
                            <ul>
                                {apiServerArr.map((item, i) => {
                                    return (

                                        <li key={i}>
                                            <span onClick={this.onAPIChange.bind(this,item)}
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
                <h3>{this.translate("on_api_change_components.title")}</h3>
                <div className="intru">{this.translate("on_api_change_components.title_info")}</div>
                <div className="layer-select">
                    <label>{this.translate("on_api_change_components.label_name")}</label>
                    <DownSelect width="350px" className="selecter" defaultObj={apiObj} data={this.props.defaults.apiServers} onChange={this.onAPIChange.bind(this)}/>
                    <button className="button" style={{marginLeft:20,height:35}} onClick={this.modelToggle.bind(this)}>{this.translate("Apisettings.button_val_edit")}</button>
                    <button className="button" style={{marginLeft:20,height:35}} onClick={this.autoSelect.bind(this)}>{this.translate("Apisettings.button_auto")}</button>
                </div>

                {/*<select onChange={this.onAPIChange.bind(this)} ref="apiChange">*/}
                    {/*{this.props.defaults.apiServers.map((item, i) => {*/}
                        {/*return <option key={i} value={item.value}>{item.text}</option>*/}
                    {/*})}*/}
                {/*</select>*/}
            </div>
        )
    }
}
export default OnAPIChangeComponents