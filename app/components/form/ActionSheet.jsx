
import React from "react";
import BaseComponent from "../BaseComponent";

class ActionSheet extends BaseComponent {
    constructor(props) {
        super(props);
        this.state = {
            isShowList: false,
            className: props.className
        };
        this.onDocumentClick = this.onDocumentClick.bind(this);
    }

    onDocumentClick(e) {
        this.setState({isShowList: false})
    }

    componentDidUpdate() {
        if (this.state.isShowList) {
            document.addEventListener('click', this.onDocumentClick, false)
        } else {
            document.removeEventListener('click', this.onDocumentClick, false)
        }
    }

    openList(e) {
        e.stopPropagation();
        let flag = !this.state.isShowList;
        this.setState({isShowList: flag});
    }

    render() {
        let {isShowList} = this.state;
        let {viewButton, children,style} = this.props;
        let list = (
            <div ref="options" className="list-select" style={{
                display: isShowList ? 'block' : 'none'
            }}>
                {children}
            </div>
        );
        return (
            <div style={style} className={this.state.className} onClick={this.openList.bind(this)}>
                {viewButton}
                {list}
            </div>
        );
    }
}

export default ActionSheet;
 