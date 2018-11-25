
import alt from "../altInstance";
import BaseStore from "./BaseStore";
import NotificationActions from "../actions/NotificationActions";

class NotificationStore extends BaseStore {
    constructor() {
        super();
        this.bindListeners({
            addNotification: [
                NotificationActions.addNotification,
                NotificationActions.success,
                NotificationActions.warning,
                NotificationActions.error,
                NotificationActions.info
            ]
        });

        this.state = {notification: null};
    }

    addNotification(notification) {
        this.setState({ notification: notification })
    }
}

export default alt.createStore(NotificationStore, "NotificationStore");