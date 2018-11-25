import React from "react";
import BaseComponent from "../BaseComponent";
import WitnessStore from "../../stores/vote/WitnessStore";
import WitnessActions from "../../actions/vote/WitnessActions";
import { connect } from "alt-react";
import WalletStore from "../../stores/WalletStore";
import Validation from "../../utils/Validation";
import ConfirmActions from "../../actions/layout/ConfirmActions";
import WalletUnlockActions from "../../actions/WalletUnlockActions";
import TextLoading from "../Layout/TextLoading";
import NotificationActions from "../../actions/NotificationActions";
import Utils from "../../utils/Utils";
import ConfirmForVote from "./ConfirmForVote";
import ChainApi from '../../api/ChainApi';

class VoteContainer extends BaseComponent {
    constructor() {
        super();
        this.state = { curInx: 0, boxHeight: document.documentElement.clientHeight - 146 }
    }

    handleChangeTab(inx) {
        let re
        this.setState({ curInx: inx });
        if (inx == 1) {
            re = true
        } else {
            re = false
        }
        WitnessActions.tabCtr(re);

    }

    handleLink() {
        let master = WalletStore.getWallet().yoyow_id;
        return Promise.all([WitnessActions.getAccountVoteInfo(master), WitnessActions.getVotePrams(), WitnessActions.getBalance(master)]).then(res => {
            let msg = ""
            if (res[0][0][1].statistics.can_vote != true) {
                msg = this.translate("Vote.erroMsg_black")

            } else if (res[2].core_balance < res[1].min_governance_voting_balance) {
                msg = this.translate("Vote.erroMsg_balance_proxy", { value: res[1].min_governance_voting_balance })
            } else {
                this.routerPush("/proxy")
            }
            if (!Validation.isEmpty(msg))
                ConfirmActions.alert(msg);
        })

    }

    render() {
        let { children } = this.props;
        let { curInx, boxHeight } = this.state;
        return (
            <div className="box-vote" style={{ height: boxHeight }}>


                <h3>{this.translate("Vote.title_vote")}<span
                    onClick={this.handleLink.bind(this)}>{this.translate("Vote.link_to_proxy")}</span></h3>
                <ul className="nav-changepassword">
                    {
                        children.map((ele, i) => {
                            let title = ele.props['data-title'];
                            return <li className={curInx == i ? 'cur' : ''} key={'tab-' + i}><a
                                onClick={this.handleChangeTab.bind(this, i)}>{title}</a></li>
                        })
                    }
                </ul>
                {
                    children.map((ele, i) => {
                        if (curInx == i) {
                            return ele;
                        }
                    })
                }
                <ConfirmForVote />
            </div>
        );
    }
}
class Vote extends BaseComponent {
    constructor(props) {
        super(props);
        this.state = this.__init();
    }

    __init() {
        let master = WalletStore.getWallet().yoyow_id;
        return {
            loading: false,
            master: master,
            fees: {},
            useCsaf: true,
            useBalance: true,
            proxy_uid: "",
            witness_votes: [],
            committee_member_votes: [],
            witnessList: [],
            committeeList: [],
            parms: {},
            balance: {},
            timeline: true,
            remainingDay: null,
            expireDay: null,
            lastDay: null,
            per: null,
            adds: [],
            removes: [],
            tab: false,
            proxy_last_vote_block: "",
            noProxy: 175,
            tableHeight: document.documentElement.clientHeight - 510,
            thead: false,
            total_witness_pledge: "",
            total_committee_member_pledge: ""
        }
    }

    componentWillMount() {
        let master = this.state.master;
        return Promise.all([
            WitnessActions.getFees(master, null, [], [], "vote_witness"),
            WitnessActions.getWitnessList(),
            WitnessActions.getCommitteeList(),
            WitnessActions.getAccountVoteInfo(master),
            WitnessActions.getVotePrams(),
            WitnessActions.getBalance(master)
        ]).then(res => {

            this.setState({
                balance: res[5],
            })
            this.__handleRecursive(res);

        })
    }

    componentWillReceiveProps(nextProps) {

        let { tab } = nextProps[0]
        let { yoyow_id } = nextProps[1].wallet;
        if (yoyow_id && this.state.master != yoyow_id || this.state.tab != tab) {
            let op_type = "vote_witness";
            if (this.state.tab != tab) {
                op_type = "vote_committee"
            }
            this.setState({ master: yoyow_id, tab: this.state.tab ? false : true });
            return Promise.all([
                WitnessActions.getFees(yoyow_id, null, this.state.adds, this.state.removes, op_type),
                WitnessActions.getWitnessList(),
                WitnessActions.getCommitteeList(),
                WitnessActions.getAccountVoteInfo(yoyow_id),
                WitnessActions.getVotePrams(),
                WitnessActions.getBalance(yoyow_id)
            ]).then(res => {
                let voterInfo = res[3][0][1].statistics;
                this.setState({
                    adds: [],
                    removes: [],
                    balance: res[5]
                })
                this.__handleRecursive(res)
            }).catch(rej => {
                console.log(rej)
            })
        }
    }
    __handleWitnessListSort() {
        let { witnessList } = this.state
        let newWitnessList = [];
        let nl = []
        if (witnessList.length != 0) {
            witnessList.map((i, l) => {

                if (i.account.toString().length > 5) {
                    newWitnessList.push(i)
                } else {
                    nl.push(i)
                }
            })
        }
        this.setState({
            witnessList: newWitnessList.concat(nl)
        })
    }
    __handleRecursive(res) {
        let noProxy = this.state.noProxy;
        let voterInfo = res[3][0][1]
        this.setState({
            witness_votes: voterInfo.witness_votes,
            committee_member_votes: voterInfo.committee_member_votes,
            fees: res[0],
            parms: res[4],
            balance: res[5]
        })

        //如果该账号有代理，则取当前账号的代理人及底层代理人的投票信息
        if (voterInfo.voter && voterInfo.voter.proxy_uid != noProxy) {
            //取当前账号的代理人
            this.setState({ proxy_uid: voterInfo.voter.proxy_uid })
            let getPorxyInfoFun = (proxy_uid) => {
                WitnessActions.getAccountVoteInfo(proxy_uid).then(data => {
                    //取底层代理人的投票信息
                    this.setState({
                        witness_votes: data[0][1].witness_votes,
                        committee_member_votes: data[0][1].committee_member_votes,
                        proxy_last_vote_block: data[0][1].voter.proxy_last_vote_block[0]
                    });
                    if (data[0][1].voter && data[0][1].voter.proxy_uid != noProxy) {
                        getPorxyInfoFun(data[0][1].voter.proxy_uid);
                    }
                    this.__handleSelect(res[1], this.state.witness_votes, res[2], this.state.committee_member_votes);
                    this.__handleRemainingDays();
                }).catch(error => {
                    console.log(error)
                })
            }
            getPorxyInfoFun(voterInfo.voter.proxy_uid)
        } else {
            if (voterInfo.voter) {
                this.setState({ proxy_uid: "", proxy_last_vote_block: voterInfo.voter.proxy_last_vote_block[0] })
                this.__handleSelect(res[1], this.state.witness_votes, res[2], this.state.committee_member_votes);
                this.__handleRemainingDays();
            } else {
                this.setState({ proxy_uid: "", timeline: false })
                this.__handleSelect(res[1], this.state.witness_votes, res[2], this.state.committee_member_votes);
            }

        }

    }

    __handleRemainingDays() {
        if (this.props[0].voter) {
            let lastVoteBlock = this.state.proxy_last_vote_block
            WitnessActions.getLastVoteTime(lastVoteBlock).then(res => {
                let votes_last_time = Utils.transferApiDate(res.timestamp).dateStr;
                let timeLimit = this.props[0].prams.governance_voting_expiration_blocks * 3 * 1000
                let day_cur = new Date()
                let remainingDays = Date.parse(new Date(votes_last_time)) + timeLimit;
                let d = new Date();
                d.setTime(remainingDays);
                this.setState({
                    timeline: true,
                    lastDay: votes_last_time.slice(0, 10),
                    expireDay: Math.floor((remainingDays - day_cur.getTime()) / 1000 / 60 / 60 / 24),
                    remainingDay: Utils.formatDate(d).slice(0, 10),
                    per: (Math.floor((remainingDays - day_cur.getTime()) / 1000 / 60 / 60 / 24)) / (timeLimit / 1000 / 60 / 60 / 24)
                })
            })

        } else {
            this.setState({
                timeline: false
            })
        }

    }

    __handleSelect(wlist, wse, clist, cse) {
        wlist.map((n, m) => {
            wlist[m].checked = false;
            wlist[m].isSelect = false;
            wlist[m].total_votes = Utils.realCount(wlist[m].total_votes);
            wse.map((i, l) => {
                if (wlist[m].account == wse[l]) {
                    wlist[m].checked = true;
                    wlist[m].isSelect = true;
                }
            })
        })
        clist.map((n, m) => {
            clist[m].checked = false;
            clist[m].isSelect = false;
            clist[m].total_votes = Utils.realCount(clist[m].total_votes);
            cse.map((i, l) => {
                if (clist[m].account == cse[l]) {
                    clist[m].checked = true;
                    clist[m].isSelect = true;
                }
            })
        })

        this.setState({
            witnessList: wlist,
            committeeList: clist
        })
        this.__handleWitnessListSort();
    }

    checkChangeHandle(e) {
        this.setState({ useCsaf: e.target.checked });
    }

    selectItem(l, e) {

        let list
        let { adds, removes, master, committee_member_votes } = this.state
        if (e.target.name == "more") {
            list = this.state.witnessList;
            if (list[l].isSelect == false) {
                if (list[l].checked) {
                    adds.splice(adds.indexOf(list[l].account), 1)
                } else {
                    adds.push(list[l].account)

                }
            } else {
                if (list[l].checked) {
                    removes.push(list[l].account)
                } else {
                    removes.splice(adds.indexOf([l].account), 1)
                }
            }
            list[l].checked = e.target.checked;
            if (list[l].checked) {
                this.refs.tbody.childNodes[l].style.background = "#e4ecf6";
            } else {
                this.refs.tbody.childNodes[l].style.background = "#FFF";
            }
            this.setState({ witnessList: list, adds: adds, removes: removes });
            WitnessActions.getFees(master, null, adds, removes, "vote_witness").then(res => {
                this.setState({ fees: res })
            })

        } else {
            this.setState({ adds: [], removes: [] })
            let adds = this.state.adds, removes = this.state.removes, list = this.state.committeeList;

            list.map((i, l) => {
                i.checked = false;
                this.refs.ctbody.childNodes[l].style.background = "#FFF";
            })
            list[l].checked = e.target.checked;
            //console.log(list[l])
            if (list[l].isSelect) {
                if (!list[l].checked) {
                    adds = [];
                    removes = committee_member_votes;
                } else {
                    removes = [];
                    adds = []
                    this.refs.ctbody.childNodes[l].style.background = "#e4ecf6";
                }
            } else {
                if (list[l].checked) {
                    adds = [list[l].account];
                    removes = committee_member_votes;
                    this.refs.ctbody.childNodes[l].style.background = "#e4ecf6";
                } else {
                    removes = committee_member_votes;
                    adds = []
                }
            }
            this.setState({ committeeList: list, adds: adds, removes: removes })
            WitnessActions.getFees(master, null, adds, removes, "vote_committee").then(res => {
                this.setState({ fees: res })
            })
        }

    }

    handleBugTips() {
        let { adds, removes } = this.state;
        let isPass = false
        //.log(adds[0] == undefined)

        if (adds[0] == undefined && removes[0] == undefined) {
            isPass = isPass
        } else if (adds[0] != undefined) {
            let al = adds[0].toString().length;
            adds.map(i => {
                let l = i.toString().length;
                if (al != l) {
                    isPass = true
                } else {
                    isPass = false
                }
            })

        } else if (removes[0] != undefined) {

            let rl = removes[0].toString().length;
            removes.map(i => {
                let l = i.toString().length;

                if (rl != l) {

                    isPass = true
                } else {
                    isPass = false
                }
            })
        }
        return isPass
    }

    handleVote(c) {

        this.checkAccountValid(() => {
            ChainApi.getParameters().then(({dynamicParams, params}) => {
                    let timeLimit = params.governance_voting_expiration_blocks * 3 / 60 / 60 / 24 ;
                    let { useCsaf, fees, adds, remainingDay, removes, total_witness_pledge, total_committee_member_pledge, balance, parms, committee_member_votes, witness_votes, useBalance, master } = this.state;
                    let msg = "";
                    if (this.props[0].statistics.can_vote != true) {
                        msg = this.translate("Vote.erroMsg_black")
                    } else if (c == "live_w") {
                        if (balance.core_balance + balance.total_witness_pledge < parms.min_governance_voting_balance) {
                            msg = this.translate("Vote.erroMsg_balance_vote", { value: parms.min_governance_voting_balance })
                        } else if (balance.core_balance + balance.total_witness_pledge < parms.min_governance_voting_balance + (useCsaf ? fees.with_csaf_fees : fees.min_fees)) {
                            msg = this.translate("Vote.erroMsg_notEnoughBalance", { value: parms.min_governance_voting_balance })
                        } else {
                            return WitnessActions.getAccountVoteInfo(master).then(() => {
                                let data = {
                                    useBalance: useBalance,
                                    useCsaf: useCsaf,
                                    fees: fees,
                                    type: "live",
                                    adds: [],
                                    removes: [],
                                    committee_member_votes: this.state.committee_member_votes,
                                    witness_votes: this.state.witness_votes,
                                    isShort: false,
                                    remainingDay: this.state.remainingDay,
                                    timeLimit,
                                    title: this.translate("Vote.title_active")
                                }
                                WitnessActions.openConfirm(data)
                            })
                        }
                    } else if (c == "live_c") {
                        if (balance.core_balance + balance.total_committee_member_pledge < parms.min_governance_voting_balance) {
                            msg = this.translate("Vote.erroMsg_balance_vote", { value: parms.min_governance_voting_balance })
                        } else if (balance.core_balance + balance.total_committee_member_pledge < parms.min_governance_voting_balance + (useCsaf ? fees.with_csaf_fees : fees.min_fees)) {
                            msg = this.translate("Vote.erroMsg_notEnoughBalance", { value: parms.min_governance_voting_balance })
                        } else {
                            return WitnessActions.getAccountVoteInfo(master).then(() => {
                                let data = {
                                    useBalance: useBalance,
                                    useCsaf: useCsaf,
                                    fees: fees,
                                    type: "live",
                                    adds: [],
                                    removes: [],
                                    committee_member_votes: this.state.committee_member_votes,
                                    witness_votes: this.state.witness_votes,
                                    isShort: false,
                                    remainingDay: this.state.remainingDay,
                                    timeLimit,
                                    title: this.translate("Vote.title_active")
                                }
                                WitnessActions.openConfirm(data)
                            })
                        }
                    } else if (c == "refw") {
                        if (balance.core_balance + balance.total_witness_pledge < parms.min_governance_voting_balance) {
                            msg = this.translate("Vote.erroMsg_balance_vote", { value: parms.min_governance_voting_balance })
                        } else if (balance.core_balance + balance.total_witness_pledge < parms.min_governance_voting_balance + (useCsaf ? fees.with_csaf_fees : fees.min_fees)) {
                            msg = this.translate("Vote.erroMsg_notEnoughBalance", { value: parms.min_governance_voting_balance })
                        } else {
                            return WitnessActions.getAccountVoteInfo(master).then(() => {
                                let data = {
                                    useBalance: useBalance,
                                    useCsaf: useCsaf,
                                    fees: fees,
                                    type: "ref",
                                    adds: [],
                                    removes: [],
                                    remainingDay: remainingDay,
                                    timeLimit,
                                    committee_member_votes: committee_member_votes,
                                    witness_votes: witness_votes,
                                    isShort: false,
                                    title: this.translate("Vote.title_ref")
                                }
                                WitnessActions.openConfirm(data)
                            })
                        }

                    } else if (c == "refc") {
                        if (balance.core_balance + balance.total_committee_member_pledge < parms.min_governance_voting_balance) {
                            msg = this.translate("Vote.erroMsg_balance_vote", { value: parms.min_governance_voting_balance })
                        } else if (balance.core_balance + balance.total_committee_member_pledge < parms.min_governance_voting_balance + (useCsaf ? fees.with_csaf_fees : fees.min_fees)) {
                            msg = this.translate("Vote.erroMsg_notEnoughBalance", { value: parms.min_governance_voting_balance })
                        } else {
                            return WitnessActions.getAccountVoteInfo(master).then(() => {
                                let data = {
                                    useBalance: useBalance,
                                    useCsaf: useCsaf,
                                    fees: fees,
                                    type: "ref",
                                    adds: [],
                                    removes: [],
                                    remainingDay: remainingDay,
                                    timeLimit,
                                    committee_member_votes: committee_member_votes,
                                    witness_votes: witness_votes,
                                    isShort: false,
                                    title: this.translate("Vote.title_ref")
                                }
                                WitnessActions.openConfirm(data)
                            })
                        }

                    } else if (adds.length == 0 && removes.length == 0) {
                        msg = this.translate("Vote.vote_ctr.confirmSelectMinVote")
                    } else if (witness_votes.length + adds.length > parms.max_witnesses_voted_per_account) {
                        msg = this.translate("Vote.erroMsg_balance_maxvVote", { value: parms.min_governance_voting_balance })
                    } else if (c == "vote_c") {
                        if (balance.core_balance + balance.total_committee_member_pledge < parms.min_governance_voting_balance) {
                            msg = this.translate("Vote.erroMsg_balance_vote", { value: parms.min_governance_voting_balance })
                        } else if (balance.core_balance + balance.total_committee_member_pledge < parms.min_governance_voting_balance + (useCsaf ? fees.with_csaf_fees : fees.min_fees)) {
                            msg = this.translate("Vote.erroMsg_notEnoughBalance", { value: parms.min_governance_voting_balance })
                        } else {
                            return WitnessActions.getAccountVoteInfo(master).then(() => {
                                let data = {
                                    useBalance: useBalance,
                                    useCsaf: useCsaf,
                                    fees: fees,
                                    type: "votec",
                                    adds: adds,
                                    removes: removes,
                                    committee_member_votes: committee_member_votes,
                                    witness_votes: witness_votes,
                                    isShort: false,
                                    title: committee_member_votes.length == 0 ? this.translate("Vote.title_confirmVote") : this.translate("Vote.title_EditVote")
                                }
                                WitnessActions.openConfirm(data)
                            })
                        }


                    } else if (c == "vote_w") {
                        if (balance.core_balance + balance.total_witness_pledge < parms.min_governance_voting_balance) {
                            msg = this.translate("Vote.erroMsg_balance_vote", { value: parms.min_governance_voting_balance })
                        } else if (balance.core_balance + balance.total_witness_pledge < parms.min_governance_voting_balance + (useCsaf ? fees.with_csaf_fees : fees.min_fees)) {
                            msg = this.translate("Vote.erroMsg_notEnoughBalance", { value: parms.min_governance_voting_balance })
                        } else {
                            return WitnessActions.getAccountVoteInfo(master).then(() => {
                                let data = {
                                    useBalance: useBalance,
                                    useCsaf: useCsaf,
                                    fees: fees,
                                    type: "votew",
                                    adds: adds,
                                    removes: removes,
                                    committee_member_votes: committee_member_votes,
                                    witness_votes: witness_votes,
                                    isShort: false,
                                    title: witness_votes.length == 0 ? this.translate("Vote.title_confirmVote") : this.translate("Vote.title_EditVote")
                                }
                                WitnessActions.openConfirm(data)
                            })
                        }


                    } else {
                        return WitnessActions.getAccountVoteInfo(master).then(() => {
                            let data = {
                                useBalance: useBalance,
                                fees: fees,
                                useCsaf: useCsaf,
                                type: "votew",
                                adds: adds,
                                removes: removes,
                                committee_member_votes: committee_member_votes,
                                witness_votes: witness_votes,
                                isShort: false,
                                title: witness_votes.length == 0 ? this.translate("Vote.title_confirmVote") : this.translate("Vote.title_EditVote")
                            }
                            WitnessActions.openConfirm(data)
                        })

                    }
                    if (!Validation.isEmpty(msg))
                        ConfirmActions.alert(msg);
                });
            })
        // })

    }

    tableFilter(c, e) {

        if (c == true) {

            let val = e.target.value.toString();
            this.state.committeeList.map((i, l) => {
                this.refs.ctbody.childNodes[l].style.display = "none";
                let str = this.state.committeeList[l].account.toString();
                if (str.indexOf(val) >= 0) {
                    this.refs.ctbody.childNodes[l].style.display = ""
                }
            })

        } else {

            let val = e.target.value.toString();
            this.state.witnessList.map((i, l) => {
                this.refs.tbody.childNodes[l].style.display = "none";
                let str = this.state.witnessList[l].account.toString();

                if (str.indexOf(val) >= 0) {
                    this.refs.tbody.childNodes[l].style.display = ""
                }
            })
        }

    }

    fixThead(w, e) {
        this.setState({
            thead: true
        })
        if (w == "w") {
            this.refs.witnessThead.firstChild.childNodes.forEach((i, l) => {
                let width = this.refs.witnessThead.firstChild.childNodes[l].offsetWidth;
                this.refs.witnessTrForScroll.childNodes[l].width = width;
            })
            this.refs.witnessTrForScroll.parentNode.parentNode.style.top = e.target.scrollTop + "px";
        } else {
            this.refs.cThead.firstChild.childNodes.forEach((i, l) => {
                let width = this.refs.cThead.firstChild.childNodes[l].offsetWidth;
                this.refs.cTrForScroll.childNodes[l].width = width;
            })
            this.refs.cTrForScroll.parentNode.parentNode.style.top = w.target.scrollTop + "px"
        }


    }


    render() {
        let { proxy_uid, useCsaf, fees, timeline, lastDay, witness_votes, committee_member_votes, witnessList, committeeList, noProxy, remainingDay, expireDay } = this.state;
        let voter = this.props[0].voter;
        let num_votes = witness_votes ? witness_votes.length : 0;
        return (
            <VoteContainer>
                <div className="box-vote-flex" data-title={this.translate("Vote.vote_ctr.title_vote_witness")}>
                    {timeline ? <div className="time-box">
                        <table>
                            <thead>
                                <tr>
                                    <th>{num_votes == 0 ? this.translate("Vote.vote_ctr.active_time") : this.translate("Vote.vote_ctr.vote_day")}</th>
                                    <th>{this.translate("Vote.expire_day")}</th>
                                    <th>{this.translate("Vote.vote_ctr.validity")}</th>
                                    {num_votes == 0 ? null :
                                        <th>{this.translate("Vote.vote_ctr.vote_number")}</th>}
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>{lastDay}</td>
                                    <td>{remainingDay}</td>
                                    <td style={{ color: expireDay < 10 ? "#d91a27" : "" }}>{expireDay}{this.translate("Vote.vote_ctr.day")}</td>
                                    {num_votes == 0 ? null : <td>{num_votes}{this.translate("Vote.vote_ctr.numbers")}</td>}
                                </tr>
                            </tbody>
                        </table>
                        <div>
                            {proxy_uid == "" || proxy_uid == noProxy ? "" : this.translate("Vote.to_proxy", { value: proxy_uid })}
                            {proxy_uid == "" || proxy_uid == noProxy ? this.translate("Vote.vote_ctr.vote_tips") : ""}
                        </div>
                    </div> : ""}
                    <div className="table-box">
                        <div className="ctr">
                            <input className="input-265"
                                placeholder={this.translate("Vote.vote_ctr.input_placeholder_list_witness")}
                                type="text"
                                onChange={this.tableFilter.bind(this, false)} />
                            {proxy_uid == "" || proxy_uid == noProxy ?
                                <div className="buttons">
                                    {voter ? "" : <button className="button"
                                        onClick={this.handleVote.bind(this, "live_w")}>{this.translate("Vote.button_val_active")}</button>}
                                    {voter ? <button className="button"
                                        onClick={this.handleVote.bind(this, "refw")}>{this.translate("Vote.button_val_ref")}</button> : ""}
                                </div> : ""
                            }


                        </div>
                        <div className="table" onScroll={this.fixThead.bind(this, "w")}>

                            <table className="content-table vote forScroll"
                                style={{ display: this.state.thead ? "table" : "none" }}>
                                <thead>
                                    <tr ref="witnessTrForScroll">
                                        <th>{this.translate("Vote.vote_ctr.ranking")}</th>
                                        <th>{this.translate("Vote.vote_ctr.uid_yoyow")}</th>
                                        <th>{this.translate("Vote.vote_ctr.votes")}</th>
                                        <th>{this.translate("Vote.vote_ctr.ctr")}</th>
                                    </tr>
                                </thead>
                            </table>

                            <table className="content-table vote">
                                <thead ref="witnessThead">
                                    <tr>
                                        <th>{this.translate("Vote.vote_ctr.ranking")}</th>
                                        <th>{this.translate("Vote.vote_ctr.uid_yoyow")}</th>
                                        <th>{this.translate("Vote.vote_ctr.votes")}</th>
                                        <th>{this.translate("Vote.vote_ctr.ctr")}</th>
                                    </tr>
                                </thead>
                                <tbody ref="tbody">
                                    {witnessList.map((i, l) => {
                                        return (
                                            <tr key={l}
                                                style={{ background: this.state.witnessList[l].isSelect ? "#e4ecf6" : "" }}>
                                                <td>{l + 1}</td>
                                                <td>{i.account}</td>
                                                <td>{i.total_votes}</td>
                                                <td>
                                                    {
                                                        proxy_uid == "" || proxy_uid == noProxy ?
                                                            <input checked={this.state.witnessList[l].checked}
                                                                onChange={this.selectItem.bind(this, l)}
                                                                name="more"
                                                                type="checkbox" /> :
                                                            this.state.witnessList[l].isSelect ? "√" : ""
                                                    }

                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                        {proxy_uid == "" || proxy_uid == noProxy ?
                            <div className="ctr">
                                <div>
                                    <span>{this.translate("Vote.vote_ctr.fee_label")}:</span>
                                    <span><em>{useCsaf ? fees.with_csaf_fees : fees.min_fees}</em>{global.walletConfig.coin_unit}</span>
                                    <label className="m-l-30" hidden={fees.use_csaf == 0}>
                                        <input checked={useCsaf}
                                            type="checkbox"
                                            onChange={this.checkChangeHandle.bind(this)} />
                                        <span>{this.translate("Vote.vote_ctr.fee", { value: Utils.formatAmount(fees.use_csaf * global.walletConfig.csaf_param, 4) })}</span>
                                    </label>
                                </div>
                                {this.state.loading ? <TextLoading style={{ marginLeft: '625px' }} /> :

                                    <button className="button"
                                        onClick={this.handleVote.bind(this, "vote_w")}>{witness_votes == 0 ? this.translate("Vote.vote_ctr.value_button") : this.translate("Vote.title_EditVote")}</button>}
                            </div> : ""}

                    </div>
                </div>
                <div className="box-vote-flex" data-title={this.translate("Vote.vote_ctr.title_vote_committee")}>
                    {timeline ? <div className="time-box">
                        <table>
                            <thead>
                                <tr>
                                    <th>{committee_member_votes.length == 0 ? this.translate("Vote.vote_ctr.active_time") : this.translate("Vote.vote_ctr.vote_day")}</th>
                                    <th>{this.translate("Vote.expire_day")}</th>
                                    <th>{this.translate("Vote.vote_ctr.validity")}</th>
                                    {committee_member_votes.length == 0 ? null :
                                        <th>{this.translate("Vote.vote_ctr.last_vote")}</th>}
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>{lastDay}</td>
                                    <td>{remainingDay}</td>
                                    <td style={{ color: expireDay < 10 ? "#d91a27" : "" }}>{expireDay}天</td>
                                    {committee_member_votes.length == 0 ? null : <td>{committee_member_votes}</td>}
                                </tr>
                            </tbody>
                        </table>
                        <div>
                            {proxy_uid == "" || proxy_uid == noProxy ? "" : this.translate("Vote.to_proxy", { value: proxy_uid })}
                            {proxy_uid == "" || proxy_uid == noProxy ? this.translate("Vote.vote_ctr.vote_tips") : ""}
                        </div>
                    </div> : ""}
                    <div className="table-box">
                        <div className="ctr">
                            <input className="input-265"
                                placeholder={this.translate("Vote.vote_ctr.input_placeholder_list_committee")}
                                type="text" onChange={this.tableFilter.bind(this, true)} />
                            {proxy_uid == "" || proxy_uid == noProxy ?
                                <div className="buttons">
                                    {voter ? "" : <button className="button"
                                        onClick={this.handleVote.bind(this, "live_c")}>{this.translate("Vote.button_val_active")}</button>}
                                    {voter ? <button className="button"
                                        onClick={this.handleVote.bind(this, "refc")}>{this.translate("Vote.button_val_ref")}</button> : ""}
                                </div> : ""
                            }
                        </div>
                        <div className="table"
                            onScroll={this.fixThead.bind(this)}>
                            <table className="content-table vote forScroll"
                                style={{ display: this.state.thead ? "table" : "none" }} cellPadding={0}
                                cellSpacing={0}>
                                <thead>
                                    <tr ref="cTrForScroll">
                                        <th>{this.translate("Vote.vote_ctr.ranking")}</th>
                                        <th>{this.translate("Vote.vote_ctr.uid_yoyow")}</th>
                                        <th>{this.translate("Vote.vote_ctr.votes")}</th>
                                        <th>{this.translate("Vote.vote_ctr.ctr")}</th>
                                    </tr>
                                </thead>
                            </table>
                            <table className="content-table vote">
                                <thead ref="cThead">
                                    <tr>
                                        <th>{this.translate("Vote.vote_ctr.ranking")}</th>
                                        <th>{this.translate("Vote.vote_ctr.uid_yoyow")}</th>
                                        <th>{this.translate("Vote.vote_ctr.votes")}</th>
                                        <th>{this.translate("Vote.vote_ctr.ctr")}</th>
                                    </tr>
                                </thead>
                                <tbody ref="ctbody">
                                    {committeeList.map((i, l) => {
                                        return (
                                            <tr key={l}
                                                style={{ background: this.state.committeeList[l].isSelect ? "#e4ecf6" : "" }}>
                                                <td>{l + 1}</td>
                                                <td>{i.account}</td>
                                                <td>{i.total_votes}</td>
                                                <td>
                                                    {
                                                        proxy_uid == "" || proxy_uid == noProxy ?
                                                            <input checked={this.state.committeeList[l].checked}
                                                                onChange={this.selectItem.bind(this, l)}
                                                                name="single"
                                                                type="checkbox" /> :
                                                            this.state.committeeList[l].isSelect ? "√" : ""
                                                    }

                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                        {proxy_uid == "" || proxy_uid == noProxy ?
                            <div className="ctr">
                                <div>
                                    <span>{this.translate("Vote.vote_ctr.fee_label")}:</span>
                                    <span><em>{useCsaf ? fees.with_csaf_fees : fees.min_fees}</em>{global.walletConfig.coin_unit}</span>
                                    <label className="m-l-30" hidden={fees.use_csaf == 0}>
                                        <input checked={useCsaf}
                                            type="checkbox"
                                            onChange={this.checkChangeHandle.bind(this)} />
                                        <span>{this.translate("Vote.vote_ctr.fee", { value: Utils.formatAmount(fees.use_csaf * global.walletConfig.csaf_param, 4) })}</span>
                                    </label>
                                </div>
                                {this.state.loading ? <TextLoading style={{ marginLeft: '625px' }} /> :
                                    <button className="button"
                                        onClick={this.handleVote.bind(this, "vote_c")}>{committee_member_votes == 0 ? this.translate("Vote.vote_ctr.value_button") : this.translate("Vote.title_EditVote")}</button>}
                            </div> : ""}

                    </div>
                </div>
            </VoteContainer>
        );
    }
}
export default connect(Vote, {
    listenTo() {
        return [WitnessStore, WalletStore];
    },
    getProps() {
        return [WitnessStore.getState(), WalletStore.getState()];
    }
});