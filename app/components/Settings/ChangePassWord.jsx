import React from "react"
import BaseComponent from "../BaseComponent"
import {Link} from "react-router"
class ChangePassWord extends BaseComponent{
    constructor(props){
        super(props);
    }

    componentDidMount(){
        this.__changeTab();
    }

    componentWillUpdate(){
        this.__changeTab();
    }

    __changeTab(){
        let urlHash = window.location.hash.split('?')[0];
        let {active_tab, second_tab} = this.refs;
        if(urlHash == "#/settings/changeaccountpassword" || urlHash == "#/settings/changepassword"){
            active_tab.classList.add('cur');
            second_tab.classList.remove('cur');
        }else{
            active_tab.classList.remove('cur');
            second_tab.classList.add('cur');
        }
    }

    render(){
        return(
            <div className="layer-settings">
                <h3>{this.translate("change_pass_word.title")}</h3>
                <ul className="nav-changepassword">
                    <li ref="active_tab"><Link to="/settings/changeaccountpassword">{this.translate("change_pass_word.tab_name.account_pwd")}</Link></li>
                    <li ref="second_tab"><Link to="/settings/changewalletpassword">{this.translate("change_pass_word.tab_name.wallet_pwd")}</Link></li>
                </ul>
                {this.props.children}
            </div>

        )
    }
}
export default ChangePassWord