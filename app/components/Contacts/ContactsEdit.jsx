import React from "react";
import BaseComponent from "../BaseComponent";
import Modal from "../Layout/Modal";
import {connect} from "alt-react";
import ContactsActions from "../../actions/ContactsActions";
import ContactsStore from "../../stores/ContactsStore";
import AccountImage from "../Layout/AccountImage";
import Validation from "../../utils/Validation";
import ConfirmActions from "../../actions/layout/ConfirmActions";

class ContactsEdit extends BaseComponent{
    constructor(props){
        super(props);
        this.state = {
            uid: '',
            remark: '',
            method: null,
            status: 0,// 初始状态
        }
    }

    componentWillReceiveProps(nextProps){
        let {status} = this.state;
        let {inx, uid, remark, method, visible} = nextProps.editProps;
        if(method && status == 0){
            // 第一次修改（打开后）
            this.setState({
                inx: inx,
                uid: uid,
                remark: remark,
                method: method,
                status: 1,
            });
        }
    }

    close() {
        this.setState({status: 0});
        ContactsActions.editClose();
    }

    handleInputChange(e){
        let obj = {};
        let {name, value} = e.target;
        if(name == 'remark' && value.length > 30)
            value = value.substring(0, 30);
        obj[name] = value;
        this.setState(obj);
    }

    confirm(){
        let {master} = this.props;
        let {inx, uid, remark, method} = this.state;
        if(Validation.isEmpty(uid)){
            ConfirmActions.alert(this.translate("contacts.edit_alert_empty_uid"));
        }else if(Validation.isEmpty(remark)){
            ConfirmActions.alert(this.translate("contacts.edit_alert_empty_memo"));
        }else if(master == uid){
            ConfirmActions.alert(this.translate("contacts.edit_alert_not_self"));
        }else{
            let contact = {
                uid: uid,
                master: master,
                remark: remark,
                head_img: 'null',
                last_modified: Date.now()
            };
            if(method == 'put'){
                contact.inx = inx;
            }

            ContactsActions.setContact(contact, method).then(() => {
                this.close();
                ContactsActions.getContacts(master);
            }).catch(code => {
                ConfirmActions.error(code == 2 ? this.translate("contacts.edit_error_already_added") : this.translate("contacts.edit_error_invalid_uid"));
            });
        }

    }

    render(){
        let {uid, remark, method} = this.state;
        let {title, width, height, visible} = this.props.editProps;
        if(method){
            title = this.translate(["contacts.edit_title", method]);
        }
        return (
            <div className="popup-window">
                <Modal visible={visible} onClose={this.close.bind(this)} height={height} width={width}>
                    <div className="title">{title}</div>
                    <div className="vh-flex">
                        <div className="edit-line" >
                            <label className="edit-text-label" style={{width: '80px'}}>{this.translate("contacts.edit_text_account")}</label>
                            <input type="text" className="input-440" placeholder={this.translate("contacts.edit_placeholder_account")} value={uid} disabled={method == 'put'} name="uid" onChange={this.handleInputChange.bind(this)}/>
                            <AccountImage account={uid} size={{width: 34, height: 34}} />
                        </div>
                        <div className="edit-line" >
                            <label className="edit-text-label" style={{width: '80px'}}>{this.translate("contacts.edit_text_memo")}</label>
                            <input type="text" className="input-488" placeholder={this.translate("contacts.edit_placeholder_memo")} value={remark} name="remark" onChange={this.handleInputChange.bind(this)}/>
                        </div>
                    </div>
                    <div className="buttons">
                        <input onClick={this.confirm.bind(this)} className="button-short" type="button" value={this.translate("button.ok")}/>
                    </div>
                </Modal>
            </div>
        );
    }
}

export default connect(ContactsEdit, {
    listenTo() {
        return [ContactsStore];
    },
    getProps() {
        return ContactsStore.getState();
    }
});