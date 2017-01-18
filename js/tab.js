'use strict';

var bov_Utoolkit =  bov_Utoolkit || {};

(function() {

    var DOM = bov_Utoolkit.namespace('utilities.DOM');
    var $ = DOM.$;
    var $1 = DOM.$1;
    var $$ = DOM.$$;

    // Handle Side Navigation
    (function() {
        var cSideSelectors = {
            block: 'c-sideNav',
            elements: {
                list:    'c-sideNav__list',
                item:    'c-sideNav__item',
                content: 'c-tab',
            },
            modifier: {
                active: 'isActive'
            }
        };

        var ele = cSideSelectors['elements'];
        var cSideNavList = $('.' + ele['list']);
        var active = cSideSelectors['modifier']['active'];
        var activeItemCls = ele['item'] + '--' + active;
        var activeContentCls = ele['content'] + '--' + active;
        var contentList = $$('.' + ele['content']);

        cSideNavList.addEventListener('click', function(event) {
            var target = event.target;
            var index;
            var activeI = $('.' + activeItemCls);
            var activeC = $('.' + activeContentCls);

            if (!target.classList.contains(ele['item'])) {
                target = DOM.getClosest(target, '.' + ele['item']);
            }

            if (target.classList.contains(ele['item']) && activeI !== target) {
                index = DOM.getIndexOf(target);
                // Remove current active elements
                activeI.classList.remove(activeItemCls);
                activeC.classList.remove(activeContentCls);
                // Set new active elements
                target.classList.add(activeItemCls);
                contentList[index].classList.add(activeContentCls);
            }
        }, false);
    })();

    // Handle Tab Navigation
    (function() {
        var cTabSelectors = {
            block: 'c-tab',
            elements: {
                list:    'c-tab__list',
                item:    'c-tab__item',
                content: 'c-tab__content',
            },
            modifier: {
                active: 'isActive'
            }
        };

        var ele = cTabSelectors['elements'];
        var cTabLists = $$('.' + ele['list']);
        var active = cTabSelectors['modifier']['active'];
        var itemClsName = ele['item'];
        var contentClsName = ele['content'];
        var activeItemCls = ele['item'] + '--' + active;
        var activeContentCls = ele['content'] + '--' + active;
        var contentList = $$('.' + ele['content']);

        cTabLists.forEach( function(element) {
            element.addEventListener('click', function(event) {
                var target = event.target;
                var index;
                var block = cTabSelectors['block'];
                var parent = DOM.getClosest(target, '.' + block);
                var activeI = $1('.' + activeItemCls)(parent);
                var activeC = $1('.' + activeContentCls)(parent);

                contentList = parent.querySelectorAll('.' + contentClsName);

                if (!target.classList.contains(itemClsName)) {
                    target = DOM.getClosest(target, '.' + itemClsName);
                }

                if (target.classList.contains(itemClsName) && activeI !== target) {
                    index = DOM.getIndexOf(target);
                    // Remove current active elements
                    activeI.classList.remove(activeItemCls);
                    activeC.classList.remove(activeContentCls);
                    // Set new active elements
                    target.classList.add(activeItemCls);
                    contentList[index].classList.add(activeContentCls);
                }
            }, false);
        });
    })();

})();