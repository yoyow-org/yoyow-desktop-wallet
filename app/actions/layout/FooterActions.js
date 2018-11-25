import alt from "../../altInstance";

class FooterActions {

    getHeadBlock() {
        return true;
    }

    setConnStatus(status) {
        return status;
    }
}

export default alt.createActions(FooterActions);