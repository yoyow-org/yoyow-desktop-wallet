
import React from "react";
import BaseComponent from "./BaseComponent";
import {pairs} from "lodash";
import HelpContent from "./Utility/HelpContent";

class Help extends BaseComponent {
    constructor(props) {
        super(props);

    }


    render() {
        let path = pairs(this.props.params).map(p => p[1]).join("/");
        return <div>
            <div className="menu_left">
                <HelpContent path="toc" helpcss="help-meun"/>
            </div>
            <div className="content-layer">
                <HelpContent path={path || "wallet"}/>
            </div>
        </div>;
    }
}

export default Help;
 