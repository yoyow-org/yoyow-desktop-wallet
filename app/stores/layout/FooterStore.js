
import alt from "../../altInstance";
import BaseStore from "../BaseStore";
import FooterActions from "../../actions/layout/FooterActions";
import ChainApi from "../../api/ChainApi";

class FooterStore extends BaseStore {
    constructor() {
        super();
        this.state = {headBlock: null, connected: false};
        this.bindActions(FooterActions);
    }

    onGetHeadBlock() {
        ChainApi.getHeadBlock().then(res => {
            this.setState({headBlock: res});
        });
    }

    onSetConnStatus(status) {
        //status=open,reconnect,error,closed
        //console.log("onSetConnState:", status);
        let conn = false;
        if (status == "reconnect" || status == "open") {
            conn = true;
        } else {
            conn = false;
        }
        this.setState({connected: conn});
    }
}

export default alt.createStore(FooterStore, "FooterStore");