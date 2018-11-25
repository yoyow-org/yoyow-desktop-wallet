
import alt from "../altInstance";
import BaseStore,{STORAGE_KEY} from "./BaseStore";
import IntlActions from "../actions/IntlActions";
import SettingsActions from "../actions/SettingsActions";
import counterpart from "counterpart";
import ls from "../../lib/localStorage";

var locale_zh = require("json-loader!assets/locales/locale-zh");
let sk = new ls(STORAGE_KEY);

counterpart.registerTranslations("zh", locale_zh);
counterpart.setFallbackLocale("zh");

import {addLocaleData} from "react-intl";
import zh from "react-intl/locale-data/zh";
import en from "react-intl/locale-data/en";

addLocaleData(zh);
addLocaleData(en);

class IntlStore extends BaseStore {
    constructor() {
        super();
        this.currentLocale = sk.has("settings_v1") ? sk.get("settings_v1").locale : "zh";

        this.locales = ["zh"];
        this.localesObject = {zh: locale_zh};

        this.bindListeners({
            onSwitchLocale: IntlActions.switchLocale,
            onGetLocale: IntlActions.getLocale,
            onClearSettings: SettingsActions.clearSettings
        });
    }

    hasLocale(locale) {
        return this.locales.indexOf(locale) !== -1;
    }

    getCurrentLocale() {
        return this.currentLocale;
    }

    onSwitchLocale({locale, localeData}) {
        switch (locale) {
            case "zh":
                counterpart.registerTranslations("zh", this.localesObject.zh);
                break;

            default:
                counterpart.registerTranslations(locale, localeData);
                break;
        }

        counterpart.setLocale(locale);
        this.currentLocale = locale;
    }

    onGetLocale(locale) {
        if (this.locales.indexOf(locale) === -1) {
            this.locales.push(locale);
        }
    }

    onClearSettings() {
        this.onSwitchLocale({locale: "zh"});
    }
}

export default alt.createStore(IntlStore, "IntlStore");