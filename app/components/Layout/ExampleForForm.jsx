import React from "react";
import Select from "../form/DownSelect"
class ExampleForForm extends React.Component{
    constructor(){
        super()
    }
    onSelectAccount(i){
        console.log(i)
    }
    render(){
        let list = ["测试1","测试2","测试3","测试4","测试5"]
        return(
            <div>
                <dl>
                    <dt>按钮：</dt>
                    <dd>
                        <button className="button" style={{margin:10}}>按钮(100)</button><br/>
                        <button className="button-short" style={{margin:10}}>按钮</button><br/>
                        <button className="button-search" style={{margin:10}}></button><br/>
                        <button className="button-longest" style={{margin:10}}>按钮(300)</button><br/>
                        <button className="button-icon-contact" style={{margin:10}}>新增联系人</button>
                        <button className="button-cancel" style={{margin:10}}>取消</button>
                    </dd>
                </dl>
                <dl>
                    <dt>输入框</dt>
                    <dd>
                        <input type="text" className="input_text" placeholder="测试字体"/><br/>
                        <input type="password" className="input-icon-pwd-400" placeholder="测试字体"/><br/>
                        <input type="text" className="input-265" placeholder="测试字体"/><br/>
                        <input type="password" className="input-icon-pwd-330" placeholder="测试字体"/>
                    </dd>
                </dl>
                <dl>
                    <dt>下拉</dt>
                    <dd>
                        <Select className="selecter" onChange={this.onSelectAccount.bind(this)}
                                data={list}
                                />

                        <Select className="selecter" isEdit={true}
                                data={list}
                                />
                    </dd>
                </dl>
            </div>
        )
    }
}
export default ExampleForForm