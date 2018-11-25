import React from "react"
import BaseComponent from "../BaseComponent";
import WalletDb from "../../stores/WalletStore";
import Modal from "../Layout/Modal";
import NotificationActions from "../../actions/NotificationActions";
import Input from "../form/InputPwd"
import ConfirmAction from "../../actions/layout/ConfirmActions";
class ChangeAccountPassWord extends BaseComponent{
    constructor(props){
        super(props);
        this.state = this.initState();
    }
    initState(){
        return {error_message:null,oldPwd:'',newPwd:'',modalIsShow:false,modalWith:"400",modalHeight:"300"}
    }
    onOldPwdChange(e){
        this.setState({oldPwd:e.target.value})
    }

    onNewPwdChange(e){
        let pwd = e.target.value;
        if (pwd.length < 12) {
            this.setState({error_message: this.translate("change_pass_word.tips.error_message_new"), newPwd: null});
        } else {
            this.setState({error_message: null, newPwd: pwd});
        }
        if (this.state.confirmPwd != null && pwd != this.state.confirmPwd) {
            this.setState({error_message:  this.translate("change_pass_word.tips.error_message_bool"), newPwd: null});
        }

    }
    onConfirmPwdChange(e){
        let cpwd = e.target.value;
        if (cpwd != this.state.newPwd) {
            this.setState({error_message:  this.translate("change_pass_word.tips.error_message_bool")});
        } else {
            this.setState({error_message: null});
        }
    }
    onAccept(e){
        let {oldPwd,newPwd} = this.state
        if(WalletDb.validatePassword(oldPwd,false)){
            WalletDb.changePassword(oldPwd,newPwd,false)
                .then(()=>{
                    this.setState(this.initState());
                    NotificationActions.success( this.translate("change_pass_word.tips.success"))
                })
                .catch(error =>{
                    console.error(error);

                })
        }else{
            this.setState({error_message: this.translate("change_pass_word.tips.error_message_wrong"),oldPwd:""})
        }
    }
    onCancel(){
        this.setState({error_message:null,oldPwd:""});
        this.refs.newPwd.refs.pwd.value = "";
        this.refs.cPwd.refs.pwd.value=""
    }
    onModal(){
        ConfirmAction.alert(this.translate("change_pass_word.tips.content"));
    }
    onResetAccount(){
        this.context.router.push("/restore-account")
    }
    render(){
        return(
            <div className="layer-change">
                <Modal visible={this.state.modalIsShow} onClose={this.onModal.bind(this)}>
                    <div className="tips-account">
                        {this.translate("change_pass_word.tips.content")}。</div>
                    <div className="layer-button">
                        <input className="button-normal" onClick={this.onResetAccount.bind(this)} type="button" value="确认"/>
                        <input className="button-normal" onClick={this.onModal.bind(this)} type="button" value="取消"/>
                    </div>
                </Modal>
                <h4>{this.translate("change_pass_word.container.account_pwd.title")}</h4>
                <div className="layer-input"><label>{this.translate("change_pass_word.container.account_pwd.current_account_pwd.name")}</label><Input className="input-icon-pwd-450" value={this.state.oldPwd} onChange={this.onOldPwdChange.bind(this)} type="password" placeholder={this.translate("change_pass_word.container.account_pwd.current_account_pwd.placeholder_value")}  /></div>
                <div className="layer-input"><label>{this.translate("change_pass_word.container.new_pwd.name")}</label><Input className="input-icon-pwd-450" onChange={this.onNewPwdChange.bind(this)} type="password" placeholder={this.translate("change_pass_word.container.new_pwd.pwd_placeholder")} ref="newPwd" /></div>
                <div className="layer-input"><label>{this.translate("change_pass_word.container.check_pwd.name")}</label><Input className="input-icon-pwd-450" onChange={this.onConfirmPwdChange.bind(this)} type="password" placeholder={this.translate("change_pass_word.container.check_pwd.check_pwd_placeholder")} ref="cPwd" /></div>
                {this.state.error_message ===null? null:
                    <div className="tips-pwd">{this.state.error_message}</div>
                }
                <div className="layer-input">
                    <input className="button-normal" onClick={this.onAccept.bind(this)} type="button" value={this.translate("button.ok")}/>
                    <input className="button-normal" onClick={this.onCancel.bind(this)} type="button" value={this.translate("button.cancel")}/>
                    <span onClick={this.onModal.bind(this)}>{this.translate("change_pass_word.forget")}？</span>
                </div>
            </div>

        )
    }
}
export default ChangeAccountPassWord