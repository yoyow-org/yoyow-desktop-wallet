import React from "react";
import BaseComponent from "../BaseComponent";
import AltContainer from "alt-container";
import ConfirmStore from "../../stores/layout/ConfirmStore";
import ConfirmActions from "../../actions/layout/ConfirmActions";
import Modal from "./Modal";

class Confirm extends BaseComponent {

    constructor(props) {
        super(props);
        this.state = this.initState();
        this.close = this.close.bind(this);
    }

    initState() {
        return {show: false};
    }

    componentWillReceiveProps(props) {
        if (props.show !== undefined) {
            let show = props.show ? true : false;
            this.setState({show: show});
        }
    }

    reset() {
        ConfirmActions.reset();
    }

    close() {
        ConfirmActions.reset();
    }

    okClick(e) {
        this.close();
        if (this.props.onOK) {
            this.props.onOK();
        }
        //this.reset();
    }

    cancelClick(e) {
        this.close();
        if (this.props.onCancel) {
            this.props.onCancel();
        }
        //this.reset();
    }

    render() {
        let {title, msg, height, showCancelButton} = this.props;
        title = title ? this.translate(['dialog',title]) : '';
        return (
            <div className="popup-window">
                <Modal visible={this.state.show} onClose={this.close.bind(this)} height={height}>
                    <div className="title">{title}</div>

                    <div className="message-box">
                        {msg}
                    </div>
                    <div className="buttons">
                        <input onClick={this.okClick.bind(this)} className="button-short" type="button"
                               value={this.translate("button.ok")}/>
                        {!showCancelButton ? null :
                            <input onClick={this.cancelClick.bind(this)} className="button-cancel m-l-20" type="button"
                                   value={this.translate("button.cancel")}/>
                        }
                    </div>
                </Modal>
            </div>
        );
    }
}

class ConfirmContainer extends React.Component {
    render() {
        return (
            <AltContainer store={ConfirmStore}>
                <Confirm/>
            </AltContainer>
        )
    }
}
export default ConfirmContainer