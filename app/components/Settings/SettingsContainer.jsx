import React from "react"
import BaseComponent from "../BaseComponent"
import {Link} from "react-router"
import {Route, IndexRoute} from "react-router";
import SettingsActions from "../../actions/SettingsActions"

class SettingsContainer extends BaseComponent{
    constructor(props){
        super(props)

    }

    render(){

        return(
            <div>

                {this.props.children}
            </div>
        )
    }
}
export default SettingsContainer