import React from "react";
import ReactDOM from "react-dom";
import {AppContainer} from "react-hot-loader";
import {Router, browserHistory, hashHistory} from "react-router";

import routes from "./Routes";

/**
 * 根据环境变量使用history
 */
const history = __HASH_HISTORY__ ? hashHistory : browserHistory;

const rootEl = document.getElementById("content");
const render = () => {
    ReactDOM.render(
        <AppContainer>
            <Router history={history} routes={routes}/>
        </AppContainer>,
        rootEl
    );
};
render();