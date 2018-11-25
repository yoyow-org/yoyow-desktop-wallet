import alt from "../altInstance";
import BaseStore from "./BaseStore";
import ContactsActions from "../actions/ContactsActions";
import Validation from "../utils/Validation";

class ContactsStore extends BaseStore{

    constructor(){
        super();
        this.state = {
            editProps: this.__initEditProps()
        };
        this.bindActions(ContactsActions);
    }

    __initEditProps(){
        return {
            visible: false,
            title: '',
            height: 240,
            width: 630,
            onOK: null,
            onCancel: null,
            uid: '',
            remark: '',
        };
    }

    onGetContacts(data){
        this.setState({contacts: data});
    }

    onSetContact(resolve){
        if(resolve){
            resolve();
        }
    }

    onDelContact(resolve){
        if(resolve){
            resolve();
        }
    }

    onEditContact(account){
        let editProps = this.state.editProps;
        editProps.visible = true;

        if(Validation.isEmpty(account)){
            editProps.title = '新增联系人';
            editProps.method = 'add';
        }else{
            editProps.title = '修改备注';
            editProps.method = 'put';
            editProps.inx = account.inx;
            editProps.uid = account.uid;
            editProps.remark = account.remark;
        }

        this.setState({
            editProps: editProps
        });
    }

    onEditClose(){
        this.setState({
            editProps: this.__initEditProps()
        });
    }

}

export default alt.createStore(ContactsStore, 'ContactsStore');