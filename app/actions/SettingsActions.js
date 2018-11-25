import alt from "../altInstance";

class SettingsActions {

    //修改设置
    changeSetting(value) {
        return value;
    }

    //添加api服务器
    addWS(ws) {
        return ws;
    }

    //移除api服务器
    removeWS(index) {
        return index;
    }

    //清除设置
    clearSettings() {
        return null;
    }
}
export default alt.createActions(SettingsActions);