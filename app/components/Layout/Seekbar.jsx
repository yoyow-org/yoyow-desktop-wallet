import React from "react";
import BaseComponent from "../BaseComponent"
import globalParams from "../../utils/GlobalParams";
import Validation from "../../utils/Validation";

class Seekbar extends BaseComponent {
    constructor() {
        super();
        this.state = {
            dropOn: false,
            startX: 0,
            endX: 0,
            pointX: 0,// point 移动量
            runX: 0, // 拖动条 移动量
            pointSize: 20 // point 大小
        }
    }

    componentWillReceiveProps(nextProps) {
        let {isInput, amount, total, width} = nextProps;
        if(isInput){
            let {pointSize} = this.state;
            let halfPF = pointSize / 2;
            let run = parseFloat(amount);
            if(!Validation.isNumber(run)){
                run = 0;
            }
            width = width - halfPF;
            run = run / total * width;
            if(isNaN(run) || run < 10) run = 10;
            this.setState({
                pointX: run - halfPF,
                runX: run + halfPF
            });
        }
    }

    handleMouseDown(e) {
        e.preventDefault();
        e.stopPropagation();
        let {point} = this.refs;
        let finalX = e.clientX - this.__offsetLeft(point);
        this.setState({
            dropOn: true,
            startX: e.clientX,
        });
        this.countChange(finalX, true);
    }

    handleMouseUp(e) {
        let {pointX} = this.state;
        this.setState({
            dropOn: false,
            startX: 0,
            endX: pointX
        });
    }

    handleMasterMove(e){
        let {dropOn, startX, endX, pointX} = this.state;
        if (dropOn) {
            let diff = e.clientX - startX - pointX + endX;
            let finalX = pointX + diff;
            this.countChange(finalX);
        }
    }

    handleMasterClick(e){
        let {point} = this.refs;
        let finalX = e.clientX - this.__offsetLeft(point);
        this.countChange(finalX, true);
    }

    countChange(finalX, isClick = false){
        let {pointSize} = this.state;
        let {width, total} = this.props;
        let halfPS = pointSize / 2;
        width = width - halfPS;
        if(finalX > width) finalX = width;
        if(finalX < halfPS) finalX = halfPS;
        if(finalX >= halfPS && finalX <= width){
            let stateObj = {
                pointX: finalX - halfPS,
                runX: finalX + halfPS
            };
            if(isClick){
                stateObj.endX = finalX;
            }
            this.setState(stateObj);
            if(this.props.onChange){
                if(finalX <= halfPS){
                    finalX = 0;
                }
                let percent = finalX/width;
                let count = Math.round(percent * total * global.walletConfig.retain_count)  / global.walletConfig.retain_count;
                this.props.onChange(count, percent);
            }
        }
    }

    __offsetLeft(dom){
        let offsetLeft = 0;
        let parent = dom.offsetParent;
        if(parent){
            offsetLeft = parent.offsetLeft + this.__offsetLeft(parent);
        }
        return offsetLeft;
    }

    render() {

        let {runX, pointX} = this.state;
        let {width, className} = this.props;
        className = className ? className : '';
        return (
            <div className={'seekbar '+className}
                 style={{
                width: width + 'px'
            }}
                onMouseMove={this.handleMasterMove.bind(this)}
                onMouseUp={this.handleMouseUp.bind(this)}
                onClick={this.handleMasterClick.bind(this)}
            >
                <div className="seek-run" style={{
                    width: runX
                }}>

                </div>
                <div ref="point" className="seek-point" data-run={pointX} style={{
                    left: pointX
                }}
                     onMouseDown={this.handleMouseDown.bind(this)}
                >
                    <i className="seek-point-core"></i>
                </div>
            </div>
        );
    }
}


export default Seekbar;