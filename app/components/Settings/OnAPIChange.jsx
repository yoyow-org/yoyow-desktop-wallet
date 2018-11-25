import React from "react"
import BaseComponent from "../BaseComponent"

import AltContainer from "alt-container"
import SettingsStore from "../../stores/SettingsStore"
import OnAPIChangeCompontents from "./OnAPIChangeComponents"
import IntlStore from "../../stores/IntlStore"

class OnAPIChange extends React.Component {
    constructor(props) {
        super(props)
    }

    render() {
        return (
            <AltContainer
                stores={[SettingsStore]}
                inject={{
                    settings:()=>{
                        return SettingsStore.getState().settings;
                    },
                    defaults:()=>{
                        return SettingsStore.getState().defaults;
                    },
                    localesObject:()=>{
                        return IntlStore.getState().localesObject;
                    }
                }}
            >
                <OnAPIChangeCompontents/>

            </AltContainer>
        )
    }
}
export default OnAPIChange