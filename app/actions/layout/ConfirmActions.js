import alt from "../../altInstance";

class ConfirmActions {
    show(title, msg, onok, oncancel, height, nocancel) {
        return {title, msg, onok, oncancel, height, nocancel};
    }

    alert(msg, title = 'info_title', height = 200){
        return {msg, title, height};
    }

    error(msg, title = 'error_title', height = 200){
        return {msg, title, height};
    }

    reset() {
        return true;
    }
}

let WrappedConfirmActions = alt.createActions(ConfirmActions)
export default WrappedConfirmActions