import React from "react"
import BaseComponent from "../BaseComponent"
import WalletDb from "../../stores/WalletStore"
import NotificationActions from "../../actions/NotificationActions";
import Input from "../form/InputPwd"
class ChangeWalletPassWord extends BaseComponent{
    constructor(props){
        super(props);
        this.state = this.initState()
    }
    initState(){
        return {error_message:null,oldPwd:'',newPwd:''}
    }
    onOldPwdChange(e){
        this.setState({oldPwd:e.target.value})
    }

    onNewPwdChange(e){

        // if(this.refs.newPwd.state.value.length <12){
        //     this.setState({error_message:"密码长度不能小于12个字符",newPwd:null})
        // }else if(this.refs.newPwd.state.value !== this.refs.cPwd.state.value){
        //     this.setState({error_message:"2次密码不一致",newPwd:null})
        // }else if(this.refs.newPwd.state.value.length >=12 && this.refs.newPwd.state.value === this.refs.cPwd.state.value){
        //
        //     this.setState({error_message:null,newPwd:this.refs.newPwd.state.value});
        // }
        let pwd = e.target.value;
        if (pwd.length < 12) {
            this.setState({error_message: this.translate("change_pass_word.tips.error_message_new"), newPwd: null});
        } else {
            this.setState({error_message: null, newPwd: pwd});
        }
        if (this.state.confirmPwd != null && pwd != this.state.confirmPwd) {
            this.setState({error_message: this.translate("change_pass_word.tips.error_message_bool"), newPwd: null});
        }

    }
    onConfirmPwdChange(e){
        let cpwd = e.target.value;
        if (cpwd != this.state.newPwd) {
            this.setState({error_message: this.translate("change_pass_word.tips.error_message_bool")});
        } else {
            this.setState({error_message: null});
        }
    }
    onAccept(e){
        let {oldPwd,newPwd} = this.state
        if(WalletDb.validatePassword(oldPwd,true,true)){
            WalletDb.changePassword(oldPwd,newPwd,true,true)
                .then(()=>{
                    this.setState(this.initState());
                    NotificationActions.success(this.translate("change_pass_word.tips.success"))
                    // setTimeout(()=>{
                    //     window.location.reload();
                    // },250)
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
        let flag = this.state.modalIsShow;
        this.setState({modalIsShow:!flag})
    }
    onResetAccount(e){
         this.context.router.push("/settings/restore-wallet-pwd")
        //this.context.router.push("/restore-account")
    }
    render(){
        return(
            <div className="layer-change">

                <h4>{this.translate("change_pass_word.container.wallet_pwd.title")}</h4>
                <div className="layer-input"><label>{this.translate("change_pass_word.container.wallet_pwd.current_wallet_pwd.name")}</label><Input className="input-icon-pwd-450" value={this.state.oldPwd} onChange={this.onOldPwdChange.bind(this)} type="password" placeholder={this.translate("change_pass_word.container.wallet_pwd.current_wallet_pwd.placeholder_value")}  /></div>
                <div className="layer-input"><label>{this.translate("change_pass_word.container.new_pwd.name")}</label><Input className="input-icon-pwd-450" onChange={this.onNewPwdChange.bind(this)} type="password" placeholder={this.translate("change_pass_word.container.new_pwd.pwd_placeholder")} ref="newPwd" /></div>
                <div className="layer-input"><label>{this.translate("change_pass_word.container.check_pwd.name")}</label><Input className="input-icon-pwd-450" onChange={this.onConfirmPwdChange.bind(this)} type="password" placeholder={this.translate("change_pass_word.container.check_pwd.check_pwd_placeholder")} ref="cPwd" /></div>
                {this.state.error_message ===null? null:
                    <div className="tips-pwd">{this.state.error_message}</div>
                }
                <div className="layer-input">
                    <input className="button-normal" onClick={this.onAccept.bind(this)} type="button" value={this.translate("button.ok")}/>
                    <input className="button-normal" onClick={this.onCancel.bind(this)} type="button" value={this.translate("button.cancel")}/>
                    {/*<span onClick={this.onResetAccount.bind(this)}>忘记密码？</span>*/}
                </div>
            </div>

        )
    }
}
export default ChangeWalletPassWord