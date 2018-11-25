import alt from "../altInstance";

class TokenActions {

    getAssets() {
        return true;
    }

    createToken(issuer, symbol, precision, max_supply, description, broadcast) {
        return dispatch => {
            return new Promise((resolve, reject) => {
                dispatch({ issuer, symbol, precision, max_supply, description, broadcast, resolve, reject });
            })
        }
    }

    toggleDialog(visible) {
        return visible;
    }

}

export default alt.createActions(TokenActions);