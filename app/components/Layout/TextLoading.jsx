
import React from "react";

class TextLoading extends React.Component {
    constructor() {
        super();
        this.state = {progress: 0};
    }

    componentDidMount() {
        this.timer = setInterval(() => {
            let p = this.state.progress;
            p += 1;
            if (p > 7) p = 0;
            this.setState({progress: p});
        }, 70);
    }

    componentWillUnmount() {
        this.timer && clearTimeout(this.timer);
        this.timer = null;
    }

    render() {
        return (
            <span className="text-loading" style={this.props.style}>{this.state.progress}</span>
        );
    }
}

export default TextLoading;
 