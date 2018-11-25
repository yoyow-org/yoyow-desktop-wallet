import React from "react";
import BaseComponent from "../BaseComponent";
import WitnessStore from "../../stores/vote/WitnessStore";
import WitnessActions from "../../actions/vote/WitnessActions";
import {connect} from "alt-react";
import WalletStore from "../../stores/WalletStore";
import Validation from "../../utils/Validation";
import ConfirmActions from "../../actions/layout/ConfirmActions";
import TextLoading from "../Layout/TextLoading";
import NotificationActions from "../../actions/NotificationActions";
import Utils from "../../utils/Utils";
import ConfirmForVote from "./ConfirmForVote"

class Proxy extends BaseComponent {
    constructor(props) {
        super(props);
        this.state = this.__init();
    }

    __init() {
        let master = WalletStore.getWallet().yoyow_id;
        return {
            master: master,
            input_proxy_uid: "",
            errorMsg: "",
            balance: {},
            useCsaf: true, // 是否使用积分
            useBalance: true, // 从余额转
            loading: false,
            fees: "",
            noProxy: 175,
            prams: {},
            isProxy: false,
            modalShow:false,
            committee_member_votes: [],
            witness_votes: [],
            tab: false,
            total_witness_pledge:""
        }

    }

    handleLink() {
        this.routerPush("/vote")
    }

    componentWillMount() {
        let master = WalletStore.getWallet().yoyow_id;
        let noProxy = this.state.noProxy;
        return Promise.all([WitnessActions.getAccountVoteInfo(master), WitnessActions.getBalance(master), WitnessActions.getVotePrams()]).then(res => {
            let proxy_uid;
            let voteInfo = res[0][0][1]
            if (voteInfo.voter && voteInfo.voter.proxy_uid != noProxy) {
                proxy_uid = voteInfo.voter.proxy_uid;
                this.__getFees(master, proxy_uid, [], [], "proxy").then(res => {
                    this.setState({fees: res})
                })
            } else {
                let uid = 175;
                proxy_uid = ""
                this.__getFees(master, uid, [], [], "proxy").then(res => {
                    this.setState({fees: res})
                })
            }

            this.setState({
                input_proxy_uid: proxy_uid,
                balance: res[1],
                prams: res[2],
                isProxy: proxy_uid,
                committee_member_votes:voteInfo.committee_member_votes,
                witness_votes:voteInfo.witness_votes,
                total_witness_pledge:voteInfo.statistics.total_witness_pledge
            })
        })
    }

    componentWillReceiveProps(nextProps) {
        let {yoyow_id} = nextProps[1].wallet;
        let {tab} = nextProps[0]
        let noProxy = this.state.noProxy;
        if (yoyow_id && this.state.master != yoyow_id|| this.state.tab != tab) {
            this.setState({master: yoyow_id,tab: this.state.tab?false:true});
            return Promise.all([WitnessActions.getAccountVoteInfo(yoyow_id), WitnessActions.getBalance(yoyow_id)]).then(res => {
                let proxy_uid;
                let voteInfo = res[0][0][1]
                if (voteInfo.voter && voteInfo.voter.proxy_uid != noProxy) {
                    proxy_uid = voteInfo.voter.proxy_uid;
                    this.__getFees(yoyow_id, proxy_uid, [], [], "proxy").then(res => {
                        this.setState({fees: res})
                    })
                } else {
                    proxy_uid = ""
                    this.__getFees(yoyow_id, proxy_uid, [], [], "proxy").then(res => {
                        this.setState({fees: res})
                    })
                }
                this.setState({
                    input_proxy_uid: proxy_uid,
                    balance: res[1],
                    isProxy: proxy_uid,
                    errorMsg: "",
                    committee_member_votes:voteInfo.committee_member_votes,
                    witness_votes:voteInfo.witness_votes,
                    total_witness_pledge:voteInfo.statistics.total_witness_pledge
                })
            })
        }
    }

    handleProxyAccountChange(e) {
        let uid = e.target.value;
        this.setState({input_proxy_uid: uid});
    }

    __getFees() {
        let {input_proxy_uid, master} = this.state;
        return WitnessActions.getFees(master, input_proxy_uid == "" ? master : input_proxy_uid, null, null, "proxy")
    }

    verificationLoop(uid_target) {
        let errMsg = "";
        let {maxLevel,noProxy,master,fees,useCsaf,useBalance} = this.state;
        let getPorxyInfoFun = (uid_target, maxLevel) => {
            if (maxLevel == 0) {
                errMsg = this.translate("Vote.proxy_ctr.proxy_error_repeat")
                this.setState({
                    errorMsg: errMsg
                })
                //return maxLevel;
            } else {
                WitnessActions.getAccountVoteInfo(uid_target).then(res => {
                    if (res[0][1].voter.proxy_uid == noProxy) {
                        //this.__confirmProxy(uid)
                        errorMsg: ""
                        let data = {
                            useBalance:useBalance,
                            noProxy:noProxy,
                            useCsaf:useCsaf,
                            fees:fees,
                            type:uid_target,
                            input_proxy_uid:this.state.input_proxy_uid,
                            committee_member_votes:this.state.committee_member_votes,
                            witness_votes:this.state.witness_votes,
                            isShort:false,
                            title:this.translate("Vote.proxy_ctr.value_button_set")
                        }
                        WitnessActions.openConfirm(data)
                        // if (WalletStore.isLocked(false)) {
                        //     WitnessActions.unlock(false)
                        // } else {
                        //     this.__confirmProxy(uid_target);
                        // }
                    } else if (res[0][1].voter.proxy_uid == master) {
                        errMsg =this.translate("Vote.proxy_ctr.erroMsg_proxy_is_trustee")
                    } else {
                        getPorxyInfoFun(res[0][1].voter.proxy_uid, maxLevel - 1)
                    }
                    this.setState({
                        errorMsg: errMsg
                    })
                })

            }
        }
        getPorxyInfoFun(uid_target, maxLevel)
    }

    checkTargetCanVote(uid_target) {
        let {useCsaf, useBalance,fees, balance, prams, master,noProxy} = this.state;
        let errMsg = ""

        if (balance.core_balance+balance.total_witness_pledge < (useCsaf ? fees.with_csaf_fees : fees.min_fees)) {
            errMsg = this.translate("Vote.proxy_ctr.erromsg_notEnough_fees", {value: useCsaf ? fees.with_csaf_fees : fees.min_fees})
        } else if (balance.core_balance+balance.total_witness_pledge < prams.min_governance_voting_balance + (useCsaf ? fees.with_csaf_fees : fees.min_fees)) {
            errMsg = this.translate("Vote.erroMsg_notEnoughBalance", {value: prams.min_governance_voting_balance})
        } else if (this.props[0].statistics.can_vote != true) {
            errMsg = this.translate("Vote.erroMsg_black")
        } else if (uid_target == "") {
            errMsg = this.translate("Vote.erroMsg_target_uid_null")
        } else if(uid_target == noProxy){
            return WitnessActions.getAccountVoteInfo(uid_target).then(()=>{
                let data = {
                    useBalance:useBalance,
                    noProxy:noProxy,
                    useCsaf:useCsaf,
                    fees:fees,
                    type:uid_target,
                    input_proxy_uid:this.state.input_proxy_uid,
                    committee_member_votes:this.state.committee_member_votes,
                    witness_votes:this.state.witness_votes,
                    isShort:false,
                    title:this.translate("Vote.proxy_ctr.value_button_remove")
                }
                WitnessActions.openConfirm(data)
            })

        } else {
            return Promise.all([WitnessActions.getAccountVoteInfo(uid_target),
                WitnessActions.getBalance(uid_target),
                WitnessActions.checkAccount(uid_target)]).then(res => {
                if (res[2] == 1) {
                    errMsg = this.translate("Vote.erroMsg_target_uid")
                } else if (
                    res[0][0][1].voter == undefined ||
                    res[0][0][1].statistics.can_vote != true ||
                    res[1].core_balance+balance.total_witness_pledge < prams.min_governance_voting_balance + (useCsaf ? fees.with_csaf_fees : fees.min_fees)) {
                    errMsg = this.translate("Vote.erroMsg_target_uid_qualifications")
                } else if (uid_target == master) {
                    errMsg =  this.translate("Vote.proxy_ctr.erroMsg_target_uid_self")
                } else {
                    this.verificationLoop(uid_target)
                }
                this.setState({
                    errorMsg: errMsg
                })
            })
        }

        this.setState({
            errorMsg: errMsg
        })
        // return Promise.all([WitnessActions.getAccountVoteInfo(uid), WitnessActions.getBalance(uid), WitnessActions.checkAccount(uid)]).then(res => {
        //     return res;
        // }).catch(err => {
        //     return err
        // })
    }

    checkChangeHandle(e) {
        this.setState({useCsaf: e.target.checked});
    }

    setProxy(proxy) {
        this.checkAccountValid(() => {
            let noProxy = this.state.noProxy;
            let uid_target
            if (proxy == noProxy) {
                uid_target = noProxy;
            } else {
                uid_target = this.state.input_proxy_uid;
            }
            this.checkTargetCanVote(uid_target)
        })
    }

    __confirmProxy(uid) {
        this.setState({loading: true})
        let {useCsaf, useBalance, noProxy, master} = this.state;
        WitnessActions.confirmProxy(uid, useCsaf, useBalance).then(res => {
            this.setState({loading: false})
            if (uid == noProxy) {
                NotificationActions.success(this.translate("Vote.proxy_ctr.proxy_success_remove"));
            } else {
                NotificationActions.success(this.translate("Vote.proxy_ctr.proxy_success_add", {value: uid}));
            }
            return Promise.all([WitnessActions.getAccountVoteInfo(master), WitnessActions.getBalance(master)]).then(res => {
                let proxy_uid;
                if (res[0][0][1].voter && res[0][0][1].voter.proxy_uid != noProxy) {
                    proxy_uid = res[0][0][1].voter.proxy_uid;
                    this.__getFees(master, proxy_uid, [], [], "proxy").then(res => {
                        this.setState({fees: res})
                    })
                } else {
                    proxy_uid = ""
                    this.__getFees(master, proxy_uid, [], [], "proxy").then(res => {
                        this.setState({fees: res})
                    })
                }
                this.setState({input_proxy_uid: proxy_uid, balance: res[1], isProxy: proxy_uid, errorMsg: ""})
            })
        }).catch(rej => {
            this.setState({loading: false})
            let msg = ""
            if (rej.message.indexOf("Should change something") >= 0) {
                msg = (this.translate("Vote.proxy_ctr.proxy_error_set"))
            } else if (rej.message.indexOf("Proxy loop detected") >= 0) {
                msg = (this.translate("Vote.proxy_ctr.proxy_error_repeat"))
            }
            this.setState({errorMsg: msg});
            if (!Validation.isEmpty(this.state.errorMsg))
                ConfirmActions.alert(msg);
        })
    }

    render() {
        let {input_proxy_uid, useCsaf, fees, noProxy, errorMsg, isProxy} = this.state;
        return (
            <div className="layer-settings">
                <ConfirmForVote/>
                <h3>{this.translate("Vote.proxy_ctr.title_proxy")}<span
                    onClick={this.handleLink.bind(this)}>{this.translate("Vote.proxy_ctr.link_top_vote")}</span></h3>
                <div className="proxy-box">
                    <div className="tips">您可以选择一位YOYOW用户作为您的投票代理人，代您行使投票权利</div>
                    <div className="proxy">
                        <input className="input-440"
                               value={input_proxy_uid}
                               type="text"
                               onChange={this.handleProxyAccountChange.bind(this)}/>
                        {errorMsg == "" ? "" : <div className="error-text">{errorMsg}</div>}
                        <div className="box-button">
                            {fees != "" ? <div className="fee">
                                <span>{this.translate("Vote.proxy_ctr.fee_label_proxy")}:</span>
                                <span>{useCsaf ? fees.with_csaf_fees : fees.min_fees}<em>{global.walletConfig.coin_unit}</em></span>
                                <label className="m-l-30" hidden={fees.use_csaf == 0}>
                                    <input checked={useCsaf}
                                           type="checkbox"
                                           onChange={this.checkChangeHandle.bind(this)}/>
                                    <span>{this.translate("Vote.proxy_ctr.fee_proxy", {value: Utils.formatAmount(fees.use_csaf * global.walletConfig.csaf_param, 4)})}</span>
                                </label>
                            </div> : ""}

                            {this.state.loading ? <TextLoading style={{marginLeft: '90px'}}/> :
                                <button className="button"
                                        onClick={this.setProxy.bind(this)}>{isProxy != "" ? this.translate("Vote.proxy_ctr.value_button_change") : this.translate("Vote.proxy_ctr.value_button_set")}</button>}
                            {isProxy != "" ? this.state.loading ? "" : <button className="button"
                                                                               onClick={this.setProxy.bind(this, noProxy)}>{this.translate("Vote.proxy_ctr.value_button_remove")}</button> : ""}
                        </div>

                    </div>


                </div>

            </div>


        );
    }
}
export default connect(Proxy, {
    listenTo() {
        return [WitnessStore, WalletStore];
    },
    getProps() {
        return [WitnessStore.getState(), WalletStore.getState()];
    }
});