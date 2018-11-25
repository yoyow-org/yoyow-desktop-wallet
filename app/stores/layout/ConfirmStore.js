import alt from "../../altInstance";
import  ConfirmActions from "../../actions/layout/ConfirmActions";

class ConfirmStore {
    constructor() {
        this.bindActions(ConfirmActions);
        this.state = this.__initState();
    }

    __initState(show = false, title = '', msg = '', onok, oncancel, height, nocancel) {
        if(this.state && this.state.height > 0)
            height = this.state.height;
        return {
            show: show,
            title: title,
            msg: msg,
            height: height ? height : 200,
            showCancelButton: nocancel ? false : true,
            onOK: onok ? onok : null,
            onCancel: oncancel ? oncancel : null
        };
    }

    onReset() {
        // 解决弹窗关闭动画的时候，内容发生变动
        // 先关闭弹窗
        this.setState({show: false});
        // 再弹窗动画执行完毕后清空其他状态
        setTimeout(() => {
            this.setState(this.__initState());
        },300);

    }

    onShow({title, msg, onok, oncancel, height, nocancel}) {
        this.setState(this.__initState(true, title, msg, onok, oncancel, height, nocancel));
    }

    onAlert({msg, title, height}){
        this.setState(this.__initState(true, title, msg, null, null, height, true));
    }

    onError({msg, title, height}){
        this.setState(this.__initState(true, title, msg, null, null, height, true));
    }
}
export default alt.createStore(ConfirmStore, 'ConfirmStore');