import alt from "../altInstance";

class PrivateKeyActions {

    addKey(private_key_object, transaction) {
        return (dispatch) => {
            return new Promise(resolve => {
                dispatch({private_key_object, transaction, resolve});
            });
        };
    }

    loadDbData() {
        return (dispatch) => {
            return new Promise(resolve => {
                dispatch(resolve);
            });
        };
    }

    cleanKey() {
        return true;
    }
}

export default alt.createActions(PrivateKeyActions);