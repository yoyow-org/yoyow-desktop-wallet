import React from "react";
import BaseComponent from "../BaseComponent";
import ConfirmActions from "../../actions/layout/ConfirmActions";
import Modal from "./Modal";
class BroInfo extends BaseComponent {

    constructor(props) {
        super(props);
        this.state ={
            modalIsShow: true,
        };

    }


    modelToggle() {
        this.state.modalIsShow ? this.setState({modalIsShow: false}) : this.setState({modalIsShow: true});
    }
    render() {

        return (
            <div className="popup-window">
                <Modal visible={this.state.modalIsShow} width={500}  onClose={this.modelToggle.bind(this)}>
                    <div className="title">{this.translate("BroCheck.tips")}</div>

                    <div className="message-box" width={500}>
                        {this.translate("BroCheck.tips_info")}<a href="https://www.baidu.com/link?url=LtAHHRpQwr7cuJ5g924qe9I_UakFI_yPgKR56YUQUUT2BYApqgtguuwgghmLgyKaGXgMvk7Qs8w625M1VTN3Ip6toIc7aoJ2mMArV7XrQui&wd=&eqid=f079c066000ab0ac000000025a5b4b42">{this.translate("BroCheck.download_addr_text")}</a>
                    </div>
                    <div className="buttons">
                        <button className="button" onClick={this.modelToggle.bind(this)}> {this.translate("BroCheck.val_button")}</button>
                    </div>
                </Modal>
            </div>
        );
    }
}
export default BroInfo