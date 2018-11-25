
import React from "react";
import BaseComponent from "../BaseComponent";
import {connect} from "alt-react";
import ContactsActions from "../../actions/ContactsActions";
import ContactsStore from "../../stores/ContactsStore";
import ContactsEdit from "./ContactsEdit";
import ConfirmActions from "../../actions/layout/ConfirmActions";
import AccountImage from "../Layout/AccountImage";
import WalletStore from "../../stores/WalletStore";

/*
*
* code定义
* -1 系统故障
* 0 成功
* 1 帐号不存在 api
* 2 帐号已存在 indexDB add操作无法执行
*
* */
class Contacts extends BaseComponent {
    constructor() {
        super();
        this.state = {
            search: ''
        };
        ContactsActions.getContacts(WalletStore.getWallet().yoyow_id);
    }

    /**
     * 删除联系人
     * @param uid
     * @param e
     */
    deleteContact(contact, e) {
        ConfirmActions.show('info_title', (this.translate("contacts.alert_delete_contact") + ' ' + contact.uid + '？') , () => {
            ContactsActions.delContact(contact.inx).then(() => {
                ContactsActions.getContacts(this.state.master);
            }).catch(code => {
                ConfirmActions.error(this.translate("contacts.error_delete_contact"));
            });
        });
    }

    /**
     * 新增/编辑联系人
     */
    editContact(account, e){
        ContactsActions.editContact(account);
    }

    /**
     * 搜索联系人
     * @param e
     */
    searchChangeHandle(e) {
        this.setState({search: e.target.value});
    }

    /**
     * 搜索按钮
     */
    onSearch(){
        let {master, search} = this.state;
        ContactsActions.getContacts(master, search);
    }

    /**
     * 转账操作
     */
    transferContact(account, e){
        this.routerPush('/transfer?uid='+account.uid);
    }

    componentWillReceiveProps(nextProps){
        let {wallet} = nextProps;
        if(wallet && this.state.master != wallet.yoyow_id){
            this.setState({
                master: wallet.yoyow_id,
                search: ''
            });
            ContactsActions.getContacts(wallet.yoyow_id);
        }
    }

    render() {
        let {master} = this.state;
        let {contacts} = this.props;
        let haveContacts = contacts && contacts.length > 0;

        return (
            <div className="layer-settings">
                <h3>{this.translate("contacts.title")}</h3>
                <br/>
                <input type="button" className="button-icon-contact" value={this.translate("contacts.button_add")} onClick={this.editContact.bind(this, {})}/>
                <div className="float-right">
                    <input type="text" className="input-265"  placeholder={this.translate("contacts.placeholder_filter_account")} value={this.state.search} onChange={this.searchChangeHandle.bind(this)}/>
                    <input type="button" className="button-search h-34" onClick={this.onSearch.bind(this)}/>
                </div>
                <br/>
                {
                        <table className="content-table" cellSpacing={0}>
                            <thead>
                            <tr>
                                <th colSpan={2} width={220}>{this.translate("contacts.tab_head_account")}</th>
                                <th width={420}>{this.translate("contacts.tab_head_memo")}</th>
                                <th width={175}>{this.translate("contacts.tab_head_opration")}</th>
                            </tr>
                            </thead>
                            <tbody>
                            {
                                !haveContacts ? (<tr><td colSpan={4} className="td-text-center">{this.translate("contacts.text_empty_contacts")}</td></tr>) :
                                contacts.map((item, inx) => {
                                    return <tr key={'contact' + inx}>
                                        <td width={48} className="no-right-bd"><AccountImage account={item.uid} size={{width: 32, height: 32}} /></td>
                                        <td width={172}>{'#'+item.uid}</td>
                                        <td width={420}>{item.remark}</td>
                                        <td className="controll-cell">
                                            <a href="javascript:(0)" className="font-btn" onClick={this.transferContact.bind(this, item)}>{this.translate("contacts.op_transfer")}</a>&nbsp;&nbsp;
                                            <a href="javascript:(0)" className="font-btn" onClick={this.deleteContact.bind(this, item)}>{this.translate("contacts.op_delete")}</a>&nbsp;&nbsp;
                                            <a href="javascript:(0)" className="font-btn" onClick={this.editContact.bind(this, item)}>{this.translate("contacts.op_edit")}</a>
                                        </td>
                                    </tr>
                                })
                            }
                            </tbody>
                        </table>
                }
                <ContactsEdit master={master} />
            </div>
        );
    }
}

const stores = [ContactsStore, WalletStore];

export default connect(Contacts, {
    listenTo() {
        return stores;
    },
    getProps() {
        let result = {};
        for(let store of stores){
            for(let props in store.getState()){
                result[props] = store.getState()[props];
            }
        }
        return result;
    }
});