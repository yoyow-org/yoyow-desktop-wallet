import alt from "../altInstance";

var locales = {};
if (__ELECTRON__) {
    ["en"].forEach(locale => {
        locales[locale] = require("json-loader!assets/locales/locale-" + locale + ".json");
    });
}

class IntlActions {
    switchLocale(locale) {
        if (locale === "zh") {
            return {locale};
        }
        if (__ELECTRON__) {
            return {
                locale: locale,
                localeData: locales[locale]
            };
        } else {
            return (dispatch) => {
                fetch("locale-" + locale + ".json").then((reply) => {
                    return reply.json().then(result => {
                        dispatch({
                            locale,
                            localeData: result
                        });
                    });
                }).catch(err => {
                    if (__DEBUG__) console.log("fetch locale error:", err);
                    return (dispatch) => {
                        dispatch({locale: "zh"});
                    };
                });
            };

        }
    }

    getLocale(locale) {
        return locale;
    }
}

export default alt.createActions(IntlActions);