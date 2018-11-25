import React from "react"
import BaseComponent from "../BaseComponent"
import WalletStore from "../../stores/WalletStore"
import Modal from "../Layout/Modal"
import {connect} from "alt-react";
import WalletUnlockActions from "../../actions/WalletUnlockActions";
import {PrivateKey, Aes} from "yoyowjs-lib";
import ChainApi from "../../api/ChainApi";
import Input from "../form/InputPwd";
import QRCode from "qrcode.react";

class ViewPurview extends BaseComponent {
    constructor(props) {
        super(props);
        this.state = {
            encrypted_active: false,
            encrypted_secondary: false,
            encrypted_memo: false,
            modalIsShow: false,
            modalIsImg: true,
            modalImgVal: "",
            modalWith: 350,
            modalHeight: 400,
            modalTitle: "",
            pwdTips: false,
            modalVal: "",
            QRtitle: "",
            accountPubKey: "",
            flag: false
        }
    }

    componentWillMount() {
        ChainApi.getAccountByUid(this.props.wallet.yoyow_id).then(o => {
            let accountPubkey = o[0].owner.key_auths[0][0];
            this.refs.accountPubKey.innerHTML = accountPubkey;
            this.setState({accountPubKey: accountPubkey});
        });

    }

    modelToggle(contentType, e) {
        if (contentType == "img") {
            let imgVal;
            let imgTitle;
            if (e) {
                imgVal = e.target.parentNode.getAttribute("value");
                imgTitle = e.target.parentNode.parentNode.previousSibling.firstChild.innerHTML;

            }

            this.setState({
                modalIsImg: true,
                modalWith: 435,
                modalHeight: 260,
                modalImgVal: imgVal,
                modalTitle: imgTitle
            })
        } else if (contentType == "pwd") {
            let labelVal = e.target.getAttribute("value");
            let qrTit = e.target.parentNode.parentNode.previousSibling.firstChild.innerHTML;
            this.setState({
                modalIsImg: false,
                modalWith: 600,
                modalHeight: 220,
                modalTitle: this.translate("view_purview.generate_QR_title"),
                modalVal: labelVal,
                QRtitle: qrTit
            })
        }else if(contentType == "private"){
            let priVal = this.state.modalVal;
            let pwd_text_aes = Aes.fromSeed(this.refs.pwd.refs.pwd.value);
            let willKey = PrivateKey.fromWif(priVal);
            let key = pwd_text_aes.encryptToHex(willKey.toBuffer());
            this.setState({
                modalIsImg: true,
                modalWith: 435,
                modalHeight: 260,
                modalImgVal: key,
                modalTitle: this.state.QRtitle});
        }
        this.state.modalIsShow ? this.setState({modalIsShow: false}) : this.setState({modalIsShow: true});
    }

    unlock(isShort, e) {
        e.preventDefault()
        let {wallet} = this.props;
        let name = e.target.getAttribute("name");
        if (!this.state[name]) {
            WalletUnlockActions.unlock(isShort).then(() => {
                let pubkey = wallet[name].pubkey;
                let prikey = WalletStore.getPrivateKey(pubkey);
                this.setState({[name]: prikey.toWif()});
            })
        } else {
            this.setState(this.state[name] ? {[name]: false} : {[name]: WalletStore.getPrivateKey(wallet[name].pubkey).toWif()});
        }
    }

    generateQR(id, val, size) {
        let imgLists = document.getElementsByName("QR");
        for (let item of imgLists) {
            let id = item.getAttribute("id");
            let val = item.getAttribute("value");
            let size = item.getAttribute("size")
            let QRCode = new QRCode(document.getElementById(id), {
                test: val,
                size: size,

            })
        }

    }

    verificationPwd(e) {
        let pwd_val = this.refs.pwd.refs.pwd.value;
        if (isNaN(pwd_val)) {
            this.setState({pwdTips: this.translate("view_purview.pwd_tips_Num_only")})
        } else if (pwd_val.length != 6) {
            this.setState({pwdTips: this.translate("view_purview.pwd_tips_length_only")})
        } else {
            this.setState({pwdTips: false});
            return true
        }
    }

    generateNewQR(e) {
        e.preventDefault()
        let priVal = this.state.modalVal;
        let pwd_text_aes = Aes.fromSeed(this.refs.pwd.refs.pwd.value);
        let willKey = PrivateKey.fromWif(priVal)
        let key = pwd_text_aes.encryptToHex(willKey.toBuffer())
        if (this.verificationPwd(e)) {
            this.modelToggle()
        } else {
            return false
        }
        setTimeout(() => {
            this.modelToggle("private");
        }, 500);

    }
    render() {
        let {accountList, wallet} = this.props;
        let {accountPubkey} = this.state;

        return (

            <div className="layer-settings">
                <Modal
                    ref="modal"
                    visible={this.state.modalIsShow}
                    onClose={this.modelToggle.bind(this)}
                    width={this.state.modalWith}
                    height={this.state.modalHeight}
                >
                    <div className="layer-modal">

                        <div>
                            {
                                this.state.modalIsImg ?
                                    <div>
                                        <h4>{this.state.modalTitle}</h4>
                                        <dl>
                                            <dt><QRCode size={136} name="QR" id="bigImg"
                                                        value={this.state.modalImgVal}/>
                                            </dt>
                                            <dd>
                                                <button className="button-cancel" type="button"
                                                        onClick={this.modelToggle.bind(this)}>关闭
                                                </button>
                                            </dd>
                                        </dl>
                                    </div> :
                                    <div className="encrypt accountmodal">
                                        <h4>{this.state.modalTitle}</h4>
                                        <span>{this.state.pwdTips ? this.state.pwdTips : this.translate("view_purview.generate_QR_info")}</span>
                                        <Input className="input-570" onChange={this.verificationPwd.bind(this)}
                                               ref="pwd" type="password"
                                               placeholder={this.translate("view_purview.pwd_placeholder")}/>

                                        <div>
                                            <input className="button-short"
                                                   onClick={this.generateNewQR.bind(this)}
                                                   type="button"
                                                   value={this.translate("view_purview.button_ok")}/>
                                            <input className="button-cancel"
                                                   onClick={this.modelToggle.bind(this)} type="button"
                                                   value={this.translate("view_purview.button_cancel")}/>
                                        </div>
                                    </div>

                            }
                        </div>
                    </div>
                </Modal>

                <h3>{this.translate("view_purview.title")}</h3>
                <ul className="layer-purview">
                    <li>
                        <dl>
                            <dt>
                                <h4>{this.translate("view_purview.master_key.title")}</h4>
                                <span>{this.translate("view_purview.master_key.info")}</span>
                            </dt>
                            <dd className="QR">
                                <div onClick={this.modelToggle.bind(this, "img")} value={this.state.accountPubKey}>
                                    <QRCode name="QR"
                                            id="onwer"
                                            value={this.state.accountPubKey}
                                            size={90}/>
                                </div>
                            </dd>
                            <dd>
                                <span>{this.translate("view_purview.public_key")}:</span>
                                <span ref="accountPubKey">{this.state.accountPubKey}</span>
                            </dd>

                        </dl>


                    </li>
                    <li>
                        <dl>
                            <dt>
                                <h4>{this.translate("view_purview.capital_key.title")}</h4>
                                <span>{this.translate("view_purview.capital_key.info")}</span>
                            </dt>
                            <dd className="QR">
                                {this.state.encrypted_active ?
                                    <div>
                                        <QRCode name="QR"
                                                id="active"
                                                value={wallet.encrypted_active.pubkey}
                                                size={90}/>
                                        <span onClick={this.modelToggle.bind(this, "pwd")}
                                              value={this.state.encrypted_active}>
                                          {this.translate("view_purview.button_generate_QR")}
                                    </span>
                                    </div>
                                    :
                                    <div onClick={this.modelToggle.bind(this, "img")}
                                         value={wallet.encrypted_active.pubkey}>
                                        <QRCode name="QR"
                                                id="active"
                                                value={wallet.encrypted_active.pubkey}
                                                size={90}/>
                                    </div>}
                            </dd>
                            <dd>
                                <span>{!this.state.encrypted_active ? this.translate("view_purview.public_key") : this.translate("view_purview.private_key")}:</span>
                                <span>{!this.state.encrypted_active ? wallet.encrypted_active.pubkey : this.state.encrypted_active}</span>
                            </dd>
                            <dd><input ref="showButton" type="button" name="encrypted_active"
                                       value={!this.state.encrypted_active ? this.translate("view_purview.button_view_private_key") : this.translate("view_purview.button_view_public_key")}
                                       onClick={this.unlock.bind(this, false)}/></dd>
                        </dl>

                    </li>
                    <li>
                        <dl>
                            <dt>
                                <h4>{this.translate("view_purview.secondary_key.title")}</h4>
                                <span>{this.translate("view_purview.secondary_key.info")}</span>
                            </dt>
                            <dd className="QR">
                                {this.state.encrypted_secondary ?
                                    <div>
                                        <img name="QR"
                                             id="secondary"
                                             value={wallet.encrypted_secondary.pubkey}
                                             size="90"
                                             onClick={this.modelToggle.bind(this, "img")}/>
                                        <span
                                            onClick={this.modelToggle.bind(this, "pwd")}
                                            value={this.state.encrypted_secondary}>
                                        {this.translate("view_purview.button_generate_QR")}
                                    </span>
                                    </div>
                                    :
                                    <div onClick={this.modelToggle.bind(this, "img")}
                                         value={wallet.encrypted_secondary.pubkey}>
                                        <QRCode name="QR"
                                                id="secondary"
                                                value={wallet.encrypted_secondary.pubkey}
                                                size={90}
                                        />
                                    </div>}
                            </dd>

                            <dd>
                                <span>{!this.state.encrypted_secondary ? this.translate("view_purview.public_key") : this.translate("view_purview.private_key")}:</span>
                                <span>{!this.state.encrypted_secondary ? wallet.encrypted_secondary.pubkey : this.state.encrypted_secondary}</span>
                            </dd>
                            <dd><input ref="showButton" type="button" name="encrypted_secondary"
                                       value={!this.state.encrypted_secondary ? this.translate("view_purview.button_view_private_key") : this.translate("view_purview.button_view_public_key")}
                                       onClick={this.unlock.bind(this, true)}/></dd>
                        </dl>

                    </li>
                    <li>
                        <dl>
                            <dt>
                                <h4>{this.translate("view_purview.memo_key.title")}</h4>
                                <span>{this.translate("view_purview.memo_key.title")}</span>
                            </dt>
                            <dd className="QR">
                                {this.state.encrypted_memo ?
                                    <div>
                                        <img name="QR"
                                             id="memo"
                                             value={wallet.encrypted_memo.pubkey}
                                             size="90"
                                             onClick={this.modelToggle.bind(this, "img")}/>
                                        <span onClick={this.modelToggle.bind(this, "pwd")}
                                              value={this.state.encrypted_memo}>
                                           {this.translate("view_purview.button_generate_QR")}
                                     </span>
                                    </div> :
                                    <div onClick={this.modelToggle.bind(this, "img")}
                                         value={wallet.encrypted_memo.pubkey}>
                                        <QRCode name="QR"
                                                id="memo"
                                                value={wallet.encrypted_memo.pubkey}
                                                size={90}/>
                                    </div>}
                            </dd>
                            <dd>
                                <span>{!this.state.encrypted_memo ? this.translate("view_purview.public_key") : this.translate("view_purview.private_key")}:</span>
                                <span>{!this.state.encrypted_memo ? wallet.encrypted_memo.pubkey : this.state.encrypted_memo}</span>
                            </dd>
                            <dd><input ref="showButton" type="button" name="encrypted_memo"
                                       value={!this.state.encrypted_memo ? this.translate("view_purview.button_view_private_key") : this.translate("view_purview.button_view_public_key")}
                                       onClick={this.unlock.bind(this, true)}/></dd>
                        </dl>

                    </li>
                </ul>
            </div>
        )
    }
}

export default connect(ViewPurview, {
    listenTo(){
        return [WalletStore];
    },
    getProps(){
        return WalletStore.getState();
    }
})