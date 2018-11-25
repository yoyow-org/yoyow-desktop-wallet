
import React from "react";
import WalletStore from "../../stores/WalletStore";
import {connect} from "alt-react";
import AccountImage from "./AccountImage";
import counterpart from "counterpart";



class LeftMenu extends React.Component {
    constructor() {
        super();
        this.state = {
            isShow: false,
            size:{height:80,width:80}
        }
    }

    componentDidMount() {
        this.__listenRouterChange();
    }

    componentWillUpdate(){
        this.__listenRouterChange();
    }

    __selectParent(target, menus){
        let href = target.childNodes[0].getAttribute('href');
        let level = target.getAttribute('data-level');
        let parent = null;
        for (let menu of menus){
            if(target.getAttribute('data-parent') == menu.childNodes[0].getAttribute('data-ref')){
                parent = menu;
            }
        }
        let selected = [target];
        if(parent != null) selected = selected.concat(this.__selectParent(parent, menus));
        return selected;
    }

    __listenRouterChange(){
        let urlHash = window.location.hash.split('?')[0];
        let {menusRoot} = this.refs;
        let menus = menusRoot.getElementsByTagName('li');
        let currentMenu = null; // 当前路由下所影响的菜单项
        let parentMenu = []; // 带子项的菜单项
        let classCurMenu = [];
        let classOpenMenu = [];

        // 初始化遍历
        for (let menu of menus){
            let href = menu.childNodes[0].getAttribute('href');
            if (menu.classList.contains('cur')){
                classCurMenu.push(menu);
            }
            if (menu.classList.contains('open')){
                classOpenMenu.push(menu);
            }
            // 当前路由与菜单匹配 或与该菜单的寄生参数匹配
            if(urlHash == href){
                currentMenu = this.__selectParent(menu, menus);
            }else{
                let parasite = menu.getAttribute('data-parasite').split(',');
                for(let p of parasite){
                    if(urlHash == p){
                        currentMenu = this.__selectParent(menu, menus);
                    }
                }
            }

            if (menu.getElementsByTagName('li').length > 0){
                parentMenu.push(menu);
            }
        }

        // 仅当前路由与展示的菜单项匹配的情况，才操作菜单项样式
        if(currentMenu){

            for(let menu of classCurMenu)
                menu.classList.remove('cur');

            for(let menu of classOpenMenu)
                menu.classList.remove('open');

            // 为选中的菜单项加cur
            // 目前既定为 2级菜单
            // 仅父菜单选中情况
            if(currentMenu && currentMenu.length == 1){
                let menu = currentMenu[0];
                let inx = menu.getAttribute('data-default-inx');
                let childMenus = menu.getElementsByTagName('li');
                menu.classList.add('cur');
                if(childMenus[inx]) childMenus[inx].classList.add('cur');
            }else{
                for(let menu of currentMenu){
                    menu.classList.add('cur');
                }
            }

            // 若当前路由的菜单项是带子项的，则展开
            for(let menu of parentMenu){
                menu.getElementsByTagName('ul')[0].style.display = 'none';
                if(menu.classList.contains('cur')){
                    menu.classList.add('open');
                    menu.getElementsByTagName('ul')[0].style.display = 'block';
                }
                // 若当前路由的父节点为一个有子项的菜单，则将当前菜单的href 赋值 给父菜单的href，否则重置父菜单 href
                let menu_a = menu.childNodes[0];
                if(currentMenu[0].getAttribute('data-parent') == menu_a.getAttribute('data-ref')){
                    menu_a.href = urlHash;
                }else{
                    menu_a.href = menu_a.getAttribute('data-ref');
                }
            }
        }

    }

    staticHidden(e){
        let curMenus = this.refs[e.target.getAttribute('data-ref')];
        if(!curMenus) return;
        let curParentMenu = curMenus.parentNode;
        if(curParentMenu.classList.contains('cur')){
            if(curParentMenu.classList.contains('open')){
                curParentMenu.classList.remove('open');
                curMenus.style.display = 'none';
            }else{
                curParentMenu.classList.add('open');
                curMenus.style.display = 'block';
            }
        }
    }

    __recursionMenus(menus, parent = menus.href, level = 0){
        let ref = level == 0 ? 'menusRoot' : parent;
        level ++;
        return (
            <ul ref={ref}>
                {
                    menus.children.map((menu, inx) => {
                        let href = `${parent}${menu.href}`;
                        let parasite = [];
                        if(menu.parasite && menu.parasite.length > 0){
                            for(let i=0; i<menu.parasite.length; i++){
                                parasite[i] = `${parent}${menu.parasite[i]}`;
                            }
                            parasite = parasite.join(',');
                        }
                        return (
                            <li className={menu.class + ((menu.children && menu.children.length > 0) ? ' parent_menu' : '')}
                                onClick={((menu.children && menu.children.length > 0) ? this.staticHidden.bind(this) : null)}
                                data-level={level}
                                data-parent={parent}
                                data-default-inx={menu.defaultInx ? menu.defaultInx : 0}
                                data-parasite={parasite ? parasite : ''}
                                key={`menu-${menu.href}-${inx}`}>
                                <a data-ref={href} href={href}>{menu.text}</a>
                                {

                                    (menu.children && menu.children.length > 0) ? this.__recursionMenus(menu, href, level) : ''
                                }
                            </li>
                        )
                    })
                }
            </ul>
        );
    }

    render() {
        let {wallet} = this.props;
        let menuSource = {
            href: '#',
            children:[
                { text: counterpart.translate("left_menu.assets"), href: '/balance', class: 'user', parasite: ['/'] },
                { text: counterpart.translate("left_menu.contacts"), href: '/contacts', class: 'contact' },
                { text: counterpart.translate("left_menu.recent_activity"), href: '/history', class: 'activity' },
                { text:counterpart.translate("left_menu.vote"), href: '/vote', class: 'vote' },
                // { text: counterpart.translate("left_menu.transfer"), href: '/transfer',  class: 'transfer' },
                { text: counterpart.translate("left_menu.erc20"), href: '/ERC20Gateway', class: 'gateway' },
                // { text: '见证人', href: '/witness', class: 'activity' },
                { text: counterpart.translate("left_menu.settings"), href: '/settings', class: 'set',
                    children: [
                        { text: counterpart.translate("left_menu.account"), href: '/account', parasite: ['/viewpurview'] },
                        { text: counterpart.translate("left_menu.change_password"), href: '/changepassword', parasite: ['/changeaccountpassword', '/changewalletpassword'] },
                        { text: counterpart.translate("left_menu.backup"), href: '/backup-account'},
                        { text: counterpart.translate("left_menu.restore_import"), href: '/import-account'},
                        { text: counterpart.translate("left_menu.access_point"),    href: '/onapichange'},
                    ]
                },
                { text: counterpart.translate("left_menu.help"), href: '/help', class: 'help' }
            ]
        };
        return (
            <div className="menu_left">
                <div className="info_user">
                    <AccountImage account={wallet.yoyow_id} size={this.state.size}/>
                    <p>#{wallet.yoyow_id}</p>
                </div>
                <div className="menu_list">
                    {this.__recursionMenus(menuSource)}
                </div>
            </div>);
    }
}

export default connect(LeftMenu, {
    listenTo() {
        return [WalletStore];
    },
    getProps() {
        return WalletStore.getState();
    }
});
 