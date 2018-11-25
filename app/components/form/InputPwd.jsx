import React from "react";
import BaseComponent from "../BaseComponent"


class InputPwd extends BaseComponent {
    constructor(props) {
        super(props);
    }
    onEntry(e){
        if(e.target.value == ""){
            e.target.style.paddingLeft = "30px";
            e.target.style.background = " url('../../assets/img/pwd.png') 10px center no-repeat";
        }else{
            e.target.style.paddingLeft = "10px";
            e.target.style.background = " none";
        }
        if(this.props.onChange !==null &&this.props.onChange !==undefined){
            this.props.onChange(e);
        }
    }
    render() {
        let {value} = this.props;
        return (
            <input ref="pwd" onChange={this.onEntry.bind(this)} type="password" placeholder={this.props.placeholder} name={this.props.name} className={this.props.className} style={this.props.style} value={value}/>
        )
    }
}


export default InputPwd;
