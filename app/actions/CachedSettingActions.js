import alt from "../altInstance";

class CachedSettingActions {
    set(name, value) {
        return { name, value };
    }

    get(name) {
        return { name };
    }

    reset() {
        return null;
    }
}

export default alt.createActions(CachedSettingActions);