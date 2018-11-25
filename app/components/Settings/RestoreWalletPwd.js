import React from "react"
import BaseComponent from "../BaseComponent"
import WalletDb from "../../stores/WalletStore"
import Modal from "../Layout/Modal";
class RestoreWalletPwd extends BaseComponent{
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
        // if(e.error){
        //     this.setState({error_message:e.error,newPwd:null})
        // }else{
        //     this.setState({error_message:null,newPwd:e.value})
        // }
        // console.log(this.refs.newPwd.value)
        // console.log(this.refs.cPwd.value)
        if(this.refs.newPwd.value.length <12){

            this.setState({error_message:"密码长度不能小于12个字符",newPwd:null})
        }else if(this.refs.newPwd.value !== this.refs.cPwd.value){

            this.setState({error_message:"2次密码不一致",newPwd:null})
        }else if(this.refs.newPwd.value.length >=12 && this.refs.newPwd.value === this.refs.cPwd.value){
            this.setState({error_message:null,newPwd:this.refs.newPwd.value});

        }

    }
    onAccept(e){
        let {oldPwd,newPwd} = this.state
        if(WalletDb.validatePassword(oldPwd,true,true)){
            WalletDb.changePassword(oldPwd,newPwd,false,true)
                .then(()=>{
                    this.setState(this.initState());

                    // setTimeout(()=>{
                    //     window.location.reload();
                    // },250)
                })
                .catch(error =>{
                    console.error(error);

                })
        }else{
            this.setState({error_message:"密码错误,请重新输入",oldPwd:""})
        }

    }
    onCancel(){
        this.setState({error_message:null,oldPwd:""});
        this.refs.newPwd.value = "";
        this.refs.cPwd.value=""
    }
    onModal(){
        let flag = this.state.modalIsShow;
        this.setState({modalIsShow:!flag})
    }
    onResetAccount(){
        this.context.router.push("/restore-account")
    }
    render(){
        return(
        <div className="layer-settings">
            <h3>重置零钱密码</h3>
            <div className="layer-change">
                <h4>重置零钱密码，该操作需要当前账号密码</h4>
                <div className="layer-input"><label>当前账号密码:</label><input className="input-icon-pwd-450" value={this.state.oldPwd} onChange={this.onOldPwdChange.bind(this)} type="password" placeholder="请输入你当前账号的密码"  /></div>
                <div className="layer-input"><label>新零钱密码:</label><input className="input-icon-pwd-450" onChange={this.onNewPwdChange.bind(this)} type="password" placeholder="请输入新密码" ref="newPwd" /></div>
                <div className="layer-input"><label>重复新密码:</label><input className="input-icon-pwd-450" onChange={this.onNewPwdChange.bind(this)} type="password" placeholder="确认新密码" ref="cPwd" /></div>
                {this.state.error_message ===null? null:
                    <div className="tips-pwd">{this.state.error_message}</div>
                }
                <div className="layer-input">
                    <input className="button-normal" onClick={this.onAccept.bind(this)} type="button" value="确认"/>
                    <input className="button-normal" onClick={this.onCancel.bind(this)} type="button" value="取消"/>
                </div>
            </div>
        </div>

        )
    }
}
export default RestoreWalletPwd