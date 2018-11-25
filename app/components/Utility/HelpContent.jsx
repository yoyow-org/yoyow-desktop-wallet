
import React from "react";
import BaseComponent from "../BaseComponent";
import counterpart from "counterpart";
import {reduce, zipObject} from "lodash";
import {withRouter} from "react-router";
import Utils from "../../utils/Utils";
import IntlStore from "stores/IntlStore";
import {connect} from "alt-react";

let req = require.context("../../../helpdoc", true, /\.md/);
let HelpData = {};

function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

function split_into_sections(str) {
    let sections = str.split(/\[#\s?(.+?)\s?\]/);
    if (sections.length === 1) return sections[0];
    if (sections[0].length < 4) sections.splice(0, 1);
    sections = reduce(sections, (result, n) => {
        let last = result.length > 0 ? result[result.length - 1] : null;
        if (!last || last.length === 2) {
            last = [n];
            result.push(last);
        }
        else last.push(n);
        return result;
    }, []);
    return zipObject(sections);
}

function adjust_links(str) {
    return str.replace(/\<a\shref\=\"(.+?)\"/gi, (match, text) => {
        if (text.indexOf((__HASH_HISTORY__ ? "#" : "") + "/") === 0) return `<a href="${text}" onclick="_onClickLink(event)"`;
        if (text.indexOf("http") === 0) return `<a href="${text}" rel="noopener noreferrer" target="_blank"`;
        let page = endsWith(text, ".md") ? text.substr(0, text.length - 3) : text;
        let res = `<a href="${__HASH_HISTORY__ ? "#" : ""}/help/${page}" onclick="_onClickLink(event)"`;
        if (text.startsWith("../")) {
            page = text.substr(3);
            res = `<a href="${__HASH_HISTORY__ ? "#" : ""}/${page}" onclick="_onClickLink(event)"`;
        }
        return res;
    });
}

class HelpContent extends BaseComponent {
    static propTypes = {
        path: React.PropTypes.string.isRequired,
        section: React.PropTypes.string
    };

    constructor(props) {
        super(props);
        window._onClickLink = this.onClickLink.bind(this);
    }

    onClickLink(e) {
        e.preventDefault();
        let path = (__HASH_HISTORY__ ? e.target.hash : e.target.pathname).split("/").filter(p => p && p !== "#");
        if (path.length === 0) return false;
        let route = "/" + path.join("/");
        this.props.router.push(route);
        return false;
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.locale != this.props.locale) {
            if (HelpData[nextProps.locale] == undefined) {
                this.__loadLocale(nextProps.locale);
            }
        }
    }
    componentWillMount(){
        let locale = this.props.locale || counterpart.getLocale() || "zh";
        this.__loadLocale(locale);
    }

    __loadLocale(locale) {
        req.keys().filter(a => {
            return a.indexOf(`/${locale}/`) !== -1;
        }).forEach(function (filename) {
            var res = filename.match(/\/(.+?)\/(.+)\./);
            let locale = res[1];
            let key = res[2];
            let help_locale = HelpData[locale];
            if (!help_locale) HelpData[locale] = help_locale = {};
            let content = req(filename);
            help_locale[key] = split_into_sections(adjust_links(content));
        });
    }

    setVars(str) {
        return str.replace(/(\{.+?\})/gi, (match, text) => {
            let key = text.substr(1, text.length - 2);
            let value = this.props[key] !== undefined ? this.props[key] : text;
            if (value.date) value = Utils.formatDate(value.date);
            if (value.time) value = Utils.formatDate(value.time);
            console.log("-- var -->", key, value);
            return value;
        });
    }

    render() {
        let locale = this.props.locale || counterpart.getLocale() || "zh";
        if (!HelpData[locale]) {
            console.error(`missing locale '${locale}' help files, rolling back to 'zh'`);
            locale = "zh";
        }
        let value = HelpData[locale][this.props.path];

        if (!value && locale !== "zh") {
            console.warn(`missing path '${this.props.path}' for locale '${locale}' help files, rolling back to 'zh'`);
            value = HelpData['zh'][this.props.path];
        }
        if (!value && this.props.alt_path) {
            console.warn(`missing path '${this.props.path}' for locale '${locale}' help files, rolling back to alt_path '${this.props.alt_path}'`);
            value = HelpData[locale][this.props.alt_path];
        }
        if (!value && this.props.alt_path && locale != 'zh') {
            console.warn(`missing alt_path '${this.props.alt_path}' for locale '${locale}' help files, rolling back to 'zh'`);
            value = HelpData['zh'][this.props.alt_path];
        }

        if (!value) {
            console.error(`help file not found '${this.props.path}' for locale '${locale}'`);
            return !null;
        }
        if (this.props.section) value = value[this.props.section];
        if (!value) {
            console.error(`help section not found ${this.props.path}#${this.props.section}`);
            return null;
        }
        let helpcss = this.props.helpcss || "help-content";
        return <div style={this.props.style} className={helpcss}
                    dangerouslySetInnerHTML={{__html: this.setVars(value)}}/>;
    }
}

HelpContent = connect(HelpContent, {
    listenTo() {
        return [IntlStore];
    },
    getProps() {
        return {
            locale: IntlStore.getState().currentLocale
        };
    }
});
export default withRouter(HelpContent);

 