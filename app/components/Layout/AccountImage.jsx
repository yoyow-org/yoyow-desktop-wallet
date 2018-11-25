
import React, {PropTypes} from "react";
import BaseComponent from "../BaseComponent";
import Identicon from "./Identicon";

class AccountImage extends BaseComponent {
    constructor(props) {
        super(props);
    }

    render() {
        let {account, image, style} = this.props;
        let {height, width} = this.props.size;
        let custom_image = image ?
            <img src={image} height={height + "px"} width={width + "px"}/> :
            <Identicon id={account} account={account} size={this.props.size}/>;

        return (
            <div style={style} className="account-image">
                {custom_image}
            </div>
        );
    }
}

AccountImage.defaultProps = {
    src: "",
    account: "",
    size: {height: 80, width: 80},
    style: {}
};

AccountImage.propTypes = {
    src: PropTypes.string,
    account: PropTypes.string,
    size: PropTypes.object.isRequired,
    style: PropTypes.object
};
export default AccountImage;
 