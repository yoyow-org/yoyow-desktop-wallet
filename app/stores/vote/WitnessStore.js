import alt from "../../altInstance";
import BaseStore, {STORAGE_KEY}  from "../BaseStore";
import WitnessActions from "../../actions/vote/WitnessActions"
import ls from "../../../lib/localStorage";
import WalletStore from "../WalletStore";

let ss = new ls(STORAGE_KEY);

class WitnessStore extends BaseStore {
    constructor() {
        super();

        this.state = {
            proxy_uid: "",
            balance: null,
            max_csaf_limit: null,
            prams: null,
            fees: {},
            voter: null,
            statistics: null,
            witness_votes: null,
            committee_votes: null,
            witnessList: null,
            committeeList: null,
            tab: false,
            confirmModal: false,
            confirmData: null,
            password_input: ''

        }
        this.bindActions(WitnessActions);
    }

    onGetBalance(data) {
        this.setState({
            balance: data,
            max_csaf_limit: data.max_csaf_limit
        });
    }

    onGetAccountVoteInfo(data) {
        this.setState({
            proxy_uid: data[0][1].voter ? data[0][1].voter.proxy_uid : "",
            voter: data[0][1].voter,
            statistics: data[0][1].statistics,
            witness_votes: data[0][1].witness_votes,
            committee_votes: data[0][1].committee_member_votes ? data[0][1].committee_member_votes : []
        });
    }

    onGetVotePrams(date) {
        this.setState({
            prams: date,
        });
    }

    onGetFees(res) {
        this.setState({
            fees: res
        })
    }

    onGetWitnessList(date) {
        this.setState({
            witnessList: date,
        });
    }

    onGetCommitteeList(date) {
        this.setState({
            committeeList: date,
        });
    }

    onLoading(flag) {
        this.setState({loading: flag});
    }

    onTabCtr(t) {
        this.setState({
            tab: t
        })
    }

    onOpenConfirm({data, resolve, reject}) {
        this.setState({
            confirmModal: true,
            confirmData: data,
            password_input: ''
        })
    }

    onCloseConfirm() {
        this.setState({
            confirmModal: false,
        })
    }
    onPasswordChange(password) {
        this.setState({password_input: password});
    }

}

export default alt.createStore(WitnessStore, 'WitnessStore');