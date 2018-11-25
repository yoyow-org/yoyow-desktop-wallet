
import React from "react";
import FooterStore from "../../stores/layout/FooterStore";
import FooterActions from "../../actions/layout/FooterActions";
import {connect} from "alt-react";
import NotificationActions from "../../actions/NotificationActions";
import BaseComponent from "../BaseComponent";

class Footer extends BaseComponent {
    constructor() {
        super();
        this.timeval = null;
    }

    __getBlock() {
        FooterActions.getHeadBlock();
    }

    componentWillMount() {
        this.__getBlock();
        this.timeval = setInterval(this.__getBlock, 3000);
    }

    componentWillUnmount() {
        if (this.timeval != null) {
            clearInterval(this.timeval);
            this.timeval = null;
        }
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.connected != this.props.connected) {
            if (nextProps.connected) {
                NotificationActions.success.defer(this.translate("footer.notice_connected"));
            } else {
                NotificationActions.error.defer(this.translate("footer.notice_disconnected"));
            }
        }
    }

    render() {
        let {headBlock, connected} = this.props;
        let block = 0;
        if (headBlock != null) {
            block = headBlock.head_block_number;
        }
        let status = connected ? <span>{this.translate("footer.connected")}</span> : <span className="warning">{this.translate("footer.disconnected")}</span>;
        return <div className="footer">
            <div>
                <div>YOYOW VERSION:{APP_VERSION}</div>
                <div>
                    <span>{this.translate("footer.head_block")}<em>#{block}</em></span>
                    {status}
                </div>
            </div>
        </div>;
    }
}

export default connect(Footer, {
    listenTo() {
        return [FooterStore];
    },
    getProps() {
        return FooterStore.getState();
    }
});