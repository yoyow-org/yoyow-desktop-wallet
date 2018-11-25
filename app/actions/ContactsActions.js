import walletDatabase from "../db/WalletDatabase";
import alt from "../altInstance";
import validation from "../utils/Validation";
import ChainApi from "../api/ChainApi";

class ContactsActions{

    /**
     * 获取联系人列表
     * @param master 关联人
     * @param keywords 关键字
     * @returns {function(*)}
     */
    getContacts(master, keywords){
        return dispatch => {
            walletDatabase.instance().walletDB().loadData('contacts', {
                master: master
            })
            .then(res => {
                if(validation.isEmpty(keywords)){
                    dispatch(res);
                }else{
                    //暂时以此遍历方式实现模糊查询
                    let data = [];
                    for(let obj of res){
                        if(obj.uid.toString().indexOf(keywords) >= 0 || obj.remark.indexOf(keywords) >= 0){
                            data.push(obj);
                        }
                    }
                    dispatch(data);
                }
            }).catch(err => {
                dispatch(err.message);
            });
        };
    }

    /**
     * 新增/修改 联系人
     * @param contact
     * @param method
     * @returns {function(*=)}
     */
    setContact(contact, method = 'add'){
        let code = 0;
        return dispatch => {
            let checkPromise = [];
            //验证uid有效性
            checkPromise.push(new Promise((resolve, reject) => {
                ChainApi.getAccountByUid(contact.uid).then(uObj => {
                    if(uObj && uObj.length > 0){
                        resolve(0);
                    }else{
                        reject(1);
                    }
                }).catch(err => {
                    if(__DEBUG__){
                        console.error('ContactsActions setContact checkApi error');
                        console.error(err);
                    }
                    reject(err);
                });
            }));

            // 新增时检查是否存在
            if(method == 'add'){
                checkPromise.push(new Promise((resolve, reject) => {
                    walletDatabase.instance().walletDB().loadData('contacts', {
                        uid: contact.uid,
                        master: contact.master
                    }).then(res => {
                        if(res.length > 0){
                            reject(2);
                        }else{
                            resolve(0);
                        }
                    }).catch(err => {
                        if(__DEBUG__){
                            console.error('ContactsActions setContact checkDB error');
                            console.error(err);
                        }
                        reject(-1);
                    });
                }));
            }

            return new Promise((resolve, reject) => {
                Promise.all(checkPromise).then(() => {
                    walletDatabase.instance().walletDB().addStore('contacts', contact, method)
                        .then(() => {
                            dispatch(resolve);
                        }).catch(err => {
                            if(__DEBUG__){
                                console.error('ContactsActions setContact insert to DB error');
                                console.error(err);
                            }
                            reject(-1);
                        });

                }).catch(code => {
                    reject(code)
                });
            });
        };
    }

    /**
     * 删除联系人
     * @param uid
     * @returns {function(*)}
     */
    delContact(inx){
        return dispatch => {
            return new Promise((resolve, reject) => {
                walletDatabase.instance().walletDB().removeStore('contacts', inx)
                    .then(res => {
                        dispatch(resolve);
                    }).catch(err => {
                        if(__DEBUG__){
                            console.error('ContactsActions delContact delete from DB error');
                            console.error(err);
                        }
                        reject(1);
                    });
            });

        }
    }

    /**
     * 打开联系人编辑弹窗(该弹窗用于新增/编辑联系人)
     * @returns {string}
     */
    editContact(account){
        return account;
    }

    /**
     * 关闭弹窗
     */
    editClose(){
        return true;
    }

}

export default alt.createActions(ContactsActions);