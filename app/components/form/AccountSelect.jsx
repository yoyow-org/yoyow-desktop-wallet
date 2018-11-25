import React from "react";
import BaseComponent from "../BaseComponent"
import AccountImage from "../Layout/AccountImage";

class AccountSelect extends BaseComponent {
    constructor(props) {
        super(props);
        this.state = {
            value: props.value,
            data: props.data,
            isShowList: false,
            className: ""
        }
        this.onDocumentClick = this.onDocumentClick.bind(this)
    }

    openList(e) {
        let flag = !this.state.isShowList;
        this.setState({isShowList: flag});
        flag ? this.setState({className: "open"}) : this.setState({className: ""})
    }

    onItemClick(i, e) {
        let oldVal = this.state.value;
        this.setState({value: i});
        if (this.props.onChange !== null && oldVal !== i) {
            this.props.onChange(i)
        }
    }
    onDocumentClick(e) {
        this.setState({isShowList: false,className:""})
    }
    componentDidUpdate() {
        if (this.state.isShowList) {
            document.addEventListener('click', this.onDocumentClick, false)
        } else {
            document.removeEventListener('click', this.onDocumentClick, false)
        }
    }
    render() {
        let {accountList, currentUid} = this.props;
        let list = this.state.isShowList === false ? null : (
            <div className="select-input-account">
                <ul>
                    {accountList.map((item, i) => {
                        return (<li key={i}>
                            <span onClick={this.onItemClick.bind(this, item)}>
                                <AccountImage account={item} size={{width: 14, height: 14}} style={{width:"14px",height:"14px",float:"left",top:"15px"}}/>
                                {item}
                                </span>
                        </li>)
                    })}
                </ul>
            </div>
        )
        return (
            <div className="select-input" onClick={this.openList.bind(this)}>
                <div>
                    <span className={this.state.className}>
                        <AccountImage account={currentUid} size={{width: 30, height: 30}} style={{width:"30px",height:"30px",float:"left"}}/>
                        {currentUid}
                        </span>
                </div>
                {list}
            </div>
        )
    }
}

AccountSelect.propTypes = {
    data: React.PropTypes.array,
    value: React.PropTypes.string
}
AccountSelect.defaultProps = {
    data: [],
    value: ""
}
export default AccountSelect