import React from "react"

import SettingsContainer from "./SettingsContainer"

import AltContainer from "alt-container"
import SettingsStore from "../../stores/SettingsStore"


class GlobalSettingsContainer extends React.Component{
    render(){

        return (

            <AltContainer
                stores={[SettingsStore]}
                inject={{
                    settings:()=>{
                        return SettingsStore.getState().settings;
                    },
                    defaults:()=>{
                        return SettingsStore.getState().defaults;
                    }
                }}
            >
                <SettingsContainer/>

            </AltContainer>
        )
    }
}
export default GlobalSettingsContainer
