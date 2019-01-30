
import React from "react";
import BaseComponent from "./BaseComponent";
import {toPairs} from "lodash";
import HelpContent from "./Utility/HelpContent";

class Help extends BaseComponent {
    constructor(props) {
        super(props);

    }


    render() {
        let path = toPairs(this.props.params).map(p => p[1]).join("/");
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
 