
import React from "react";

class Certification extends React.Component {
    constructor() {
        super();

    }

    componentDidMount(){
        var obj = new WxLogin({
            id:"login_container",
            appid: "wx47cfc8763b6caee5",
            scope: "snsapi_login",
            redirect_uri: "http://www.yoyow.org",
            self_redirect:true,
            state: "",
            style: "",
            href: ""
        });
    }

    render() {
        return (<div>
            <div>手机认证</div>
            <div>
                手机：<input type="text" /><input type="button" value="发送验证码"/><br/>
                验证码：<input type="text" /><br/>
                <input type="button" value="提交认证"/>
            </div>
            <br/>
            <div>微信认证</div>
            <hr/>
            <div className="div-flex">
                <div><img/></div>
                <div>name</div>
                <div>状态</div>
                <div>
                    <div id="login_container"><img/></div>
                    <div>扫码绑定</div>
                </div>
            </div>
        </div>);
    }
}

export default Certification;
 