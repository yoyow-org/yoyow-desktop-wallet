require("./assets/loader-dev");

if (!window.Intl) {
    require.ensure(["intl"], require => {
        window.Intl = require("intl");
        Intl.__addLocaleData(require("./assets/intl-data/zh.json"));
        require("index-dev.js");
    });
} else {
    require("index-dev.js");
}