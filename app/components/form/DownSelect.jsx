import React from "react";
import BaseComponent from "../BaseComponent"
import Validation from "../../utils/Validation";
import AccountImage from "../Layout/AccountImage";

class DownSelect extends BaseComponent {
    constructor(props) {
        super(props);
        this.state = {
            data: props.data,
            isShowList: false,
            className: props.className,
            isEdit: props.isEdit,
            selected: null,
            selectInx: 0,
            inputValue: ''
        }
        this.onDocumentClick = this.onDocumentClick.bind(this)
    }

    openList(e) {
        e.stopPropagation();
        let flag = !this.state.isShowList;
        this.setState({isShowList: flag});
        this.__autoComplate();
    }

    onItemClick(item, i, e) {
        let {onChange} = this.props;
        if (onChange) {
            this.setState({
                selectInx: i,
                selected: item,
                inputValue: item.text
            });
            onChange(item);
        }
    }

    onInputChange(e) {
        let {value} = e.target;
        let {onChange} = this.props;
        this.setState({
            isShowList: true,
            inputValue: value
        });
        this.__autoComplate();
        if(onChange)
            onChange(value);
    }

    onDocumentClick(e) {
        this.setState({isShowList: false})
    }

    componentDidMount() {
        if (this.state.isEdit) {
            this.refs.input.removeAttribute("disabled")
        }
    }

    componentDidUpdate() {
        if (this.state.isShowList) {
            document.addEventListener('click', this.onDocumentClick, false)
        } else {
            document.removeEventListener('click', this.onDocumentClick, false)
        }
       if(this.state.isEdit){
            this.refs.input.removeAttribute("readOnly");
       }else{
           this.refs.input.setAttribute("readOnly", "true")
       }
    }

    __autoComplate(){
        let {isEdit, inputValue} = this.state;
        if(isEdit && inputValue.trim() != ''){
            let val = this.refs.input.value;
            let {options} = this.refs;
            let {data} = this.props;
            let obj = options.getElementsByTagName("li");
            for (let i = 0; i < data.length; i++) {
                obj[i].style.display = "none";
                if (data[i].text.indexOf(val) >= 0) {
                    obj[i].style.display = "block"
                }
            }
        }
    }

    render() {
        let {selectInx, selected, isShowList, inputValue} = this.state;
        let {data, defaultObj, placeholder, isContacts, chooseVal} = this.props;
        if (!data) data = [];
        // if (!defaultObj) defaultObj = {};
        let width = this.props.width;
        let list;
        if(defaultObj){
            if(inputValue && inputValue.trim() == '' && defaultObj.text){
                inputValue = defaultObj.text;
            }else if(data && selectInx <= (data.length -1)){
                inputValue = data[selectInx].text;
            }
        }
        if(chooseVal) inputValue = data.find(d => { return d.value == chooseVal }).text;
        if (isContacts) {
            list = (
                <div ref="options" className="list-select" style={{
                    display: isShowList ? 'block' : 'none'
                }}>
                    <ul>
                        {data.map((item, i) => {
                            return (
                                <li key={i} onClick={this.onItemClick.bind(this,item,i)}
                                    title={item.text + '(' + item.remark + ')'}>
                                    <AccountImage className="contact-img" account={item.text}
                                                  size={{width: 24, height: 24}}
                                                  style={{float: 'left', marginTop: '5px'}}/>
                                    <span className="contact-item">{'#' + item.text}</span>
                                    <span
                                        className="contact-remark">{item.remark.length >= 4 ? item.remark.substring(0, 4) + '...' : item.remark}</span>
                                </li>
                            )
                        })}
                    </ul>
                </div>
            )
        } else {
            list = (
                <div ref="options" className="list-select" style={{
                    display: isShowList ? 'block' : 'none'
                }}>
                    <ul>
                        {data.map((item, i) => {
                            return (
                                <li key={i}>
                                    <span onClick={this.onItemClick.bind(this, item, i)}>{item.text}</span>
                                </li>
                            )
                        })}
                    </ul>
                </div>
            )
        }

        return (

            <div style={{width: width}} className={this.state.className} onClick={this.openList.bind(this)}>
                <div>
                    <input ref="input" placeholder={placeholder} value={inputValue}
                           onChange={this.onInputChange.bind(this)} type="text"/>
                </div>
                {list}
            </div>
        )
    }
}

DownSelect.propTypes = {
    data: React.PropTypes.array,
    isEdit: React.PropTypes.bool
}
DownSelect.defaultProps = {
    data: [],
    isEdit: false
}
export default DownSelect;
