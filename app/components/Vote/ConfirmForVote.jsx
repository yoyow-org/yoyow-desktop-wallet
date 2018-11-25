import BaseComponent from '../BaseComponent';
import React from "react";
import Utils from "../../utils/Utils";
import WitnessStore from "../../stores/vote/WitnessStore";
import WalletStore from "../../stores/WalletStore";
import NotificationActions from "../../actions/NotificationActions";
import WalletUnlockActions from "../../actions/WalletUnlockActions";
import WitnessActions from "../../actions/vote/WitnessActions";
import {connect} from "alt-react";
import {Apis} from "yoyowjs-ws";
import Modal from "../Layout/Modal";
import InputPwd from "../form/InputPwd";
import WalletUnlockStore from "../../stores/WalletUnlockStore";
import Validation from "../../utils/Validation";
import ConfirmActions from "../../actions/layout/ConfirmActions";
import TextLoading from "../Layout/TextLoading";
import moment from "moment";

class ConfirmForVote extends BaseComponent {
    constructor(props) {
        super(props);
        this.state = this.getInitialState();
        //.onPasswordEnter = this.onPasswordEnter.bind(this);

    }

    getInitialState() {
        return {
            master: WalletStore.getWallet().yoyow_id,
            visible: false,
            password_error: null,
            password_input_reset: Date.now(),
            confirmData: null,
            msg: "",
            locked: true,
            re: false,
            ref: true
        }
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps[0].confirmModal) {
            this.show();
            this.setState({
                confirmData: nextProps[0].confirmData
            })
            this.handleMessage();
            this.setState({
                locked: WalletStore.isLocked(false)
            })
        }

    }

    handleMessage() {
        let {confirmData} = this.state;
        if (confirmData) {
            let msg = ""
            if (confirmData.type == "votew") {
                if (confirmData.removes.length != 0 && confirmData.removes.length == confirmData.witness_votes.length) {
                    msg = this.translate("Vote.vote_ctr.confirmCancelAll");
                }else {
                    msg = this.translate("Vote.vote_ctr.confirmVoteForNumber", {value: confirmData.adds.length+confirmData.witness_votes.length-confirmData.removes.length})
                }
            } else if (confirmData.type == "votec") {
                if (confirmData.adds.length != 0) {
                    msg = this.translate("Vote.vote_ctr.confirmVote", {value: confirmData.adds})
                } else if (confirmData.adds.length != 0 && confirmData.removes.length != 0) {
                    msg = this.translate("Vote.vote_ctr.confirmVote", {value: confirmData.adds})
                } else if (confirmData.removes.length != 0) {
                    msg = this.translate("Vote.vote_ctr.confirmCancel", {value: confirmData.removes})
                }
            } else if (confirmData.type == "live") {
                msg = this.translate("Vote.active_vote")
            } else if (confirmData.type == "refw") {
                msg = confirmData.witness_votes.length==0?this.translate("Vote.ref_proxy"):this.translate("Vote.ref_vote")
            } else if (confirmData.type == "refc") {
                msg = confirmData.committee_member_votes.length==0?this.translate("Vote.ref_proxy"):this.translate("Vote.ref_vote")
            } else if (confirmData.type != confirmData.noProxy) {
                if (confirmData.committee_member_votes.length != 0 || confirmData.witness_votes.length != 0) {
                    msg = this.translate("Vote.proxy_ctr.confirm_proxy")
                } else if(confirmData.type != 'ref') {
                    msg = this.translate("Vote.to_proxy", {value: confirmData.type})
                }
            } else if (confirmData.type == confirmData.noProxy) {
                msg = this.translate("Vote.proxy_ctr.confirm_remove_proxy", {value: confirmData.input_proxy_uid})
            }
            this.setState({
                msg: msg
            })
        }
    }

    show() {
        let wallet = WalletStore.getWallet();
        if (!wallet) {
            return;
        }
        if (Apis.instance().chain_id !== wallet.chain_id) {
            NotificationActions.error("This wallet was intended for a different block-chain; expecting " +
                wallet.chain_id.substring(0, 4).toUpperCase() + ", but got " +
                Apis.instance().chain_id.substring(0, 4).toUpperCase());
            return;
        }
        this.setState({visible: true});
    }

    hide(ok) {
        if (!ok) {
            WitnessActions.closeConfirm();
            if (this.refs.password_input) {
                this.refs.password_input.value = "";
            }
        }
        this.setState({visible: false, password_error: null});
    }

    cancelClick(e) {
        e.preventDefault();
        this.hide(false);
    }

    handlePwdChange(e) {
        WitnessActions.passwordChange(e.target.value);
    }

    onPasswordEnter(e) {
        e.preventDefault();
        let actionIsShort = this.props[0].confirmData.isShort;
        let {password_input} = this.props[0];
        let confirmData = this.state.confirmData
        //this.setState({password_error: null});
        WalletStore.validatePassword(password_input || "", actionIsShort, true);
        if (WalletStore.isLocked(actionIsShort)) {
            this.setState({password_error: this.translate(["unlockWallet.error_text", actionIsShort ? "second" : "active"])});
            return false;
        }
        else {
            this.setState({password_input_reset: Date.now(), password_input: '', password_error: null});
            let t = setTimeout(() => {
                WalletUnlockActions.change();
                WalletUnlockStore.__setLockTimeout(actionIsShort)
                clearTimeout(t);
            }, 300);
            if (confirmData.type != "votec" && confirmData.type != "votew" && confirmData.type != "live" && confirmData.type != "ref") {
                this.confirmProxy(confirmData.type);
            } else if (confirmData.type == "votew") {
                this.__confirmWitnessVote(confirmData.adds, confirmData.removes)
            } else if (confirmData.type == "votec") {
                this.__confirmCommitteeVote(confirmData.adds, confirmData.removes)
            } else if (confirmData.type == "live" || confirmData.type == "ref") {
                this.__confirmWitnessVote(confirmData.adds, confirmData.removes, confirmData.type)
            }

        }
        return false;
    }

    __confirmWitnessVote(adds, removes, type) {
        console.log('刷新投票');
        this.setState({loading: true});
        let {useCsaf, useBalance, timeLimit} = this.state.confirmData;
        
        WitnessActions.confirmWitnessVote(adds, removes, useCsaf, useBalance).then(res => {
            let _remainingDay = moment().add(timeLimit, 'days').format('YYYY-MM-DD');
            if (type == "live") {
                NotificationActions.success(this.translate("Vote.vote_ctr.live_success", {
                    value: timeLimit,
                    day: _remainingDay
                }));
            } else if (type == "ref") {
                NotificationActions.success(this.translate("Vote.vote_ctr.ref_success", {
                    value: timeLimit,
                    day: _remainingDay
                }));
            } else {
                NotificationActions.success(this.translate("Vote.vote_ctr.vote_success"));
            }

            let {master, adds, removes} = this.state;
            return Promise.all([
                WitnessActions.getFees(master, null, adds, removes, "vote_witness"),
                WitnessActions.getWitnessList(),
                WitnessActions.getCommitteeList(),
                WitnessActions.getAccountVoteInfo(master),
                WitnessActions.getVotePrams(),
                WitnessActions.getBalance(master)
            ]).then(res => {
                let re = this.state.re ? false : true;
                WitnessActions.closeConfirm();
                this.setState({re: re, loading: false, visible: false});
                WitnessActions.tabCtr(re);
            }).catch(rej => {
                let re = this.state.re ? false : true;
                WitnessActions.closeConfirm();
                this.setState({re: re, loading: false, visible: false});
                WitnessActions.tabCtr(re);
                NotificationActions.error(this.translate("Vote.vote_ctr.vote_error"));

            })
        })
    }

    __confirmCommitteeVote(adds, removes) {
        this.setState({loading: true})
        let {useCsaf, useBalance} = this.state.confirmData;
        WitnessActions.confirmCommitteeVote(adds, removes, useCsaf, useBalance).then(res => {
            NotificationActions.success(this.translate("Vote.vote_ctr.vote_success"));

            let {master, adds, removes} = this.state
            let re = this.state.re ? false : true;
            this.setState({re: re})
            WitnessActions.tabCtr(re);
            return Promise.all([
                WitnessActions.getFees(master, null, adds, removes, "vote_committee"),
                WitnessActions.getWitnessList(),
                WitnessActions.getCommitteeList(),
                WitnessActions.getAccountVoteInfo(master),
                WitnessActions.getVotePrams(),
                WitnessActions.getBalance(master)
            ]).then(res => {


                let ref = this.state.ref ? false : true;
                WitnessActions.closeConfirm();
                this.setState({re: ref, loading: false, visible: false});

                WitnessActions.tabCtr(ref);
            })
        }).catch(rej => {
            let ref = this.state.ref ? false : true;
            WitnessActions.closeConfirm();
            this.setState({re: ref, loading: false, visible: false});

            WitnessActions.tabCtr(ref);
            NotificationActions.error(this.translate("Vote.vote_ctr.vote_error"));

        })
    }

    confirmProxy(uid) {
        this.setState({loading: true})
        let master = this.state.master
        let {useCsaf, useBalance, noProxy, input_proxy_uid} = this.state.confirmData;

        WitnessActions.confirmProxy(uid, useCsaf, useBalance).then(res => {
            let re = this.state.re ? false : true;
            WitnessActions.tabCtr(re);
            this.setState({re: re, loading: false, visible: false});
            WitnessActions.closeConfirm();
            if (uid == noProxy) {
                NotificationActions.success(this.translate("Vote.proxy_ctr.proxy_success_remove"));
            } else {
                NotificationActions.success(this.translate("Vote.proxy_ctr.proxy_success_add", {value: input_proxy_uid}));
            }
        }).catch(rej => {
            this.setState({loading: false, visible: false})
            WitnessActions.closeConfirm();
            if (!Validation.isEmpty(this.state.errorMsg))
                ConfirmActions.alert(msg);
        })
    }

    render() {
        let {password_input} = this.props[0];
        let {msg, locked, confirmData} = this.state;
        let isShort = confirmData ? confirmData.isShort : ""
        let auth = isShort ? "second" : "active";
        return (
            <div className="popup-window">
                <Modal visible={this.state.visible} onClose={this.hide.bind(this, false)} height={260} width={560}>
                    <div className="title">{confirmData ? confirmData.title : ""}</div>
                    <div className="message-box">{msg == "" ? "" : msg}</div>
                    {locked ?
                        <div className="password-box">
                            <span className="name">{this.translate(["unlockWallet.text", auth])}</span>
                            <InputPwd ref="password_input"
                                      className="input-icon-pwd-400"
                                      type="password"
                                      value={password_input}
                                      onChange={this.handlePwdChange.bind(this)}/>
                        </div>
                        : ""
                    }
                    {this.state.password_error ?
                        <div
                            className="error-box">{this.state.password_error ? this.translate("Vote.error_passord") : ""}</div> : ""}
                    <div className="fee">
                        <span className="name">{this.translate("Vote.vote_ctr.fee_label")}：</span>
                        <span
                            className="money-font">{confirmData ? (confirmData.useCsaf ? confirmData.fees.with_csaf_fees : confirmData.fees.min_fees) : ""}<em>{global.walletConfig.coin_unit}</em></span>
                        <span>{confirmData ? (confirmData.useCsaf ? Utils.formatAmount(confirmData.fees.use_csaf * global.walletConfig.csaf_param, 4) : 0) : ""}{this.translate("Vote.integral")}</span>
                    </div>
                    <div className="box-button">
                        {this.state.loading ? <TextLoading style={{marginLeft: '395px'}}/> :
                            <button onClick={this.onPasswordEnter.bind(this)}
                                    className="button">{this.translate("Vote.button_val_confirm")}</button>}
                        {this.state.loading ? "" : <button onClick={this.cancelClick.bind(this)}
                                                           className="button-cancel">{this.translate("Vote.button_val_cancel")}</button>}
                    </div>
                </Modal>
            </div>
        )

    }
}

export default connect(ConfirmForVote, {
    listenTo() {
        return [WitnessStore, WalletUnlockStore];
    },
    getProps() {
        return [WitnessStore.getState(), WalletUnlockStore.getState()];
    }
});