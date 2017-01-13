'use strict';

var MD_Utoolkit =  MD_Utoolkit || {};

MD_Utoolkit.namespace = function (name) {

    var parts = name.split('.');
    var ns = this;

    for (var i = 0, len = parts.length; i < len; i++) {
        ns[parts[i]] = ns[parts[i]] || {};
        ns = ns[parts[i]];
    }

    return ns;
};


MD_Utoolkit.namespace('Utils').Selector = (function(win){
    var doc = win.document;

    var getSelected = function () {

        var sel = '';

        if(win.getSelection){
            sel = win.getSelection();
        }else if(doc.getSelection){
            sel = doc.getSelection();
        }else if(doc.selection){
            sel = doc.selection.createRange().text;
        }

        return sel;
    };

    return {
        getSelected: getSelected
    };
})(this);

MD_Utoolkit.namespace('Utils').BEM = (function(win){
    var doc = win.document;

    var $ = function(parent) {
        var baseClassName = parent.classList[0] || '';
        return function(element, modifier) {

            var selector = '.' + baseClassName + '__' + element;

            if (modifier) {
                selector += '--' + modifier;
            }

            return parent.querySelector(selector);
        };
    };
});

MD_Utoolkit.namespace('Utils').DOM = (function(win){
    var doc = win.document;

    var $ = function(selector) {
        return doc.querySelector(selector);
    };
    var $$ = function(selector) {
        return doc.querySelectorAll(selector);
    };

    var BEM = function(parent) {

        var block = parent.classList[0] || '';

        return function(element, modifier) {

            var selector = block + '__' + element;

            if (modifier) {
                selector += '--' + modifier;
            }

            return {
                node: parent.querySelector('.' + selector),
                block: block,
                element: element,
                modifier: modifier,
                selector: selector
            };
        };
    };

    var BEM$ = function(parent) {

        var block = parent.classList[0] || '';

        return function(element, modifier) {

            var selector = block + '__' + element;

            if (modifier) {
                selector += '--' + modifier;
            }

            return {
                node: parent.querySelectorAll('.' + selector),
                block: block,
                element: element,
                modifier: modifier,
                selector: selector
            };
        };
    };

    return {
        $: $,
        $$: $$,
        BEM: BEM,
        BEM$: BEM$
    };
})(this);

MD_Utoolkit.namespace('Utils.DOM').BEM = (function(){

    var BEM = function(parent) {

        var block = parent.classList[0] || '';

        return function(element, modifier) {

            var BEMselector = block + '__' + element;

            if (modifier) {
                BEMselector += '--' + modifier;
            }

            return {
                node: parent.querySelector('.' + BEMselector),
                block: block,
                element: element,
                modifier: modifier,
                BEMselector: BEMselector
            };
        };
    };

    var BEM$ = function(parent) {

        var block = parent.classList[0] || '';

        return function(element, modifier) {

            var BEMselector = block + '__' + element;

            if (modifier) {
                BEMselector += '--' + modifier;
            }

            return {
                node: parent.querySelectorAll('.' + BEMselector),
                block: block,
                element: element,
                modifier: modifier,
                BEMselector: BEMselector
            };
        };
    };

    return {
        $: BEM,
        $$: BEM$
    };
})(this);

MD_Utoolkit.namespace('Utils').ObjUtil = (function(win){
    // https://gomakethings.com/vanilla-javascript-version-of-jquery-extend/
    var extend = function () {

        var extended = {};
        var deep = false;
        var i = 0;
        var length = arguments.length;

        // Check if a deep merge
        if ( Object.prototype.toString.call( arguments[0] ) === '[object Boolean]' ) {
            deep = arguments[0];
            i++;
        }

        // Merge the object into the extended object
        var merge = function (obj) {
            for ( var prop in obj ) {
                if ( Object.prototype.hasOwnProperty.call( obj, prop ) ) {
                    // If deep merge and property is an object, merge properties
                    if ( deep && Object.prototype.toString.call(obj[prop]) === '[object Object]' ) {
                        extended[prop] = extend( true, extended[prop], obj[prop] );
                    } else {
                        extended[prop] = obj[prop];
                    }
                }
            }
        };

        // Loop through each object and conduct a merge
        for ( ; i < length; i++ ) {
            var obj = arguments[i];
            merge(obj);
        }

        return extended;

    };

    return {
        extend: extend,
    };
})(this);



document.addEventListener('DOMContentLoaded', function (e) {

    // Firefox only
    document.execCommand('insertBrOnReturn', false, false);

    function CodeEditor(element, options) {
        var objUtil = MD_Utoolkit.namespace('Utils').ObjUtil;
        this.element = element;
        this.settings = objUtil.extend({}, {
            blockName: '.c-codeEditor',
            highlightActiveLine: false
        }, options || {});
        this.init();
    }

    CodeEditor.prototype = {
        constructor: CodeEditor,

        init: function () {
            var $ = MD_Utoolkit.namespace('Utils.DOM').BEM.$;

            this.BEM = $(this.element);
            this.storage = sessionStorage;

            this.gutter = this.BEM('gutterList').node;
            this.codeArea = this.BEM('codeArea').node;
            this.mirrorArea = this.BEM('mirrorArea').node;
            this.footer = this.BEM('footer').node;
            this.selector = MD_Utoolkit.namespace('Utils').Selector.getSelected();

            this.observe();
            this.handleScroll();
            this.handleMouseLeave();
            this.handleKeyDown();
            this.handleKeyUp();
            this.handleClick();
            this.handlePaste();

            // Trigger a click event on the coding Area to activate
            // the editor's tracking system
            this.codeArea.click();
        },

        observe: function() {
            var self = this;
            var MutationObserver = window.MutationObserver       ||
                                   window.WebKitMutationObserver ||
                                   window.MozMutationObserver;

            var observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    if (mutation.type === 'childList') {
                        self.updateGutter();
                        self.scrollGutter();
                        self.highlightLine();
                    }
                });
            });

            observer.observe(self.codeArea, {
                childList: true,
                characterData: true
            });

        },

        handleMouseLeave: function() {
            var self = this;

            this.codeArea.addEventListener('mouseleave', function() {
                // Update visual information
                self.highlightLine();
                self.updateFooterInfo();
            });
        },

        handleScroll: function() {
            var self = this;

            this.codeArea.addEventListener('scroll', function() {
                // The code area is scrolling
                self.scrollGutter(this.scrollTop);
            });
        },

        handleKeyUp: function() {
            var self = this;

            this.codeArea.addEventListener('keyup', function(event) {
                var key;
                var list = [].slice.call(this.childNodes);

                event = event || window.event;
                key = event.keyCode;

                // Backspace - Remove
                if (key === 8) {

                    list = list.filter(function(node) {
                        return node.tagName === 'DIV';
                    });
                    if (list.length === 0) {
                        self._addChild(this);
                    }
                }

                // Update visual information
                self.highlightLine();
                self.updateFooterInfo();
            });
        },

        handleKeyDown: function() {
            var self = this;
            var sel = this.selector;

            this.codeArea.addEventListener('keydown', function(event) {
                var key;

                var selRange = sel.getRangeAt(0);
                var cloneRange;
                var newRange;

                var secondP;
                var newElem;
                var contentLength;
                var firstElem;

                var target;
                var replaceNode;
                var focusElement;
                var docFragment;

                event = event || window.event;
                key = event.keyCode;

                this.focus();

                // ENTER
                if (key === 13) {
                    docFragment = document.createDocumentFragment();



                    // Take a snapshot of the original selection range
                    cloneRange = selRange.cloneRange();

                    contentLength = sel.anchorNode.length;


                    cloneRange.setStart(sel.anchorNode, sel.anchorOffset);
                    cloneRange.setEnd(sel.anchorNode, contentLength);

                    secondP = cloneRange.toString();


                    newElem = document.createElement('div');
                    firstElem = document.createElement('div');


                    if (secondP.length > 0) {
                        newElem.textContent = secondP;
                    } else {
                        newElem.appendChild(document.createElement('br'));
                    }


                    target = sel.anchorNode;

                    if (target.parentElement === this) {

                        firstElem = document.createElement('div');
                        firstElem.textContent = sel.anchorNode.textContent;

                        if (sel.anchorNode.textContent.length === 0) {
                            firstElem.appendChild(document.createElement('br'));
                        }

                        docFragment.appendChild(firstElem);
                        docFragment.appendChild(newElem);

                        focusElement = newElem;

                        replaceNode = sel.anchorNode;

                    } else {

                        target = target.parentElement;
                        replaceNode = sel.anchorNode.parentNode;

                        if (secondP.length === contentLength) {
                            var empty = self._emptyDIV();

                            firstElem = document.createElement('div');
                            firstElem.textContent = sel.anchorNode.textContent;

                            docFragment.appendChild(empty);
                            docFragment.appendChild(firstElem);

                            focusElement = firstElem;

                        } else {
                            // The caret is positioned at least between two characthers

                            // Delete the second part of the string after the caret
                            // because its content has been saved inside the secondP
                            // variable
                            cloneRange.deleteContents();

                            firstElem = document.createElement('div');
                            firstElem.textContent = sel.anchorNode.textContent;

                            docFragment.appendChild(firstElem);
                            docFragment.appendChild(newElem);

                            focusElement = newElem;
                            //target.parentNode.insertBefore(newElem, target.nextSibling);
                        }
                    }

                    // Replace the anchor node with the new HTML fragment
                    target.parentNode.replaceChild(docFragment, replaceNode);

                    /*create a new range*/
                    newRange = document.createRange();
                    //
                    newRange.setStart(focusElement, 0);
                    // make it at a single point
                    newRange.collapse(true);

                    //make the cursor there
                    sel.removeAllRanges();
                    sel.addRange(newRange);

                    // Scroll the code Area
                    this.scrollTop = this.scrollHeight;

                    // Move to the left if necessary
                    this.scrollLeft = 0;

                    event.preventDefault();
                }

                // Tab
                if (key === 9 && event.shiftKey) {
                    document.execCommand ( 'styleWithCSS', true, null );
                    document.execCommand ( 'outdent', true, null );
                    event.preventDefault();
                } else if (key === 9) {
                    document.execCommand('insertHTML', false, '&#160;&#160;&#160;&#160;');
                    event.preventDefault();
                }

            }, false);
        },

        handleClick: function() {
            var self = this;

            this.codeArea.addEventListener('click', function() {
                var children = this.children;
                var length = children.length;

                this.focus();

                if (length === 0) {
                    self._addChild(this);
                }

                // Update visual information
                self.highlightLine();
                self.updateFooterInfo();
            });
        },

        handlePaste: function() {
            var self = this;
            var selection = self.selector;

            this.codeArea.addEventListener('paste', function(event) {
                var clipboardData;
                var pastedData;
                var pastedLines;
                var selRange;

                var anchorNode = selection.anchorNode;


                var fragment = document.createDocumentFragment();
                var other = '';


                if (anchorNode.nodeType === 3) {
                    anchorNode = anchorNode.parentNode;
                }

                if (selection.rangeCount) {
                    selRange = selection.getRangeAt(0);

                    if (anchorNode) {
                        var range = selRange.cloneRange();
                        range.selectNodeContents(anchorNode);
                        range.setStart(selRange.endContainer, selRange.endOffset);
                        other = range.extractContents();
                        range.deleteContents();
                    }
                }
console.log(anchorNode.textContent);
                // Stop data actually being pasted
                event.stopPropagation();
                event.preventDefault();

                clipboardData = event.clipboardData || window.clipboardData;
                pastedData = clipboardData.getData('text');

                pastedLines = pastedData.split('\n');

                if (other.textContent.trim() !== '') {
                    pastedLines.push(other.textContent);
                }

                pastedLines.forEach(function(line, index) {
                    var element = document.createElement('div');
                    var textContent = line.replace(/ /g, '\u00a0');

                    if (index === 0) {
                        element.textContent = anchorNode.textContent + textContent;
                    } else {
                        element.textContent = line.replace(/ /g, '\u00a0');
                    }


                    if (element.textContent.trim() !== '') {
                        fragment.appendChild(element);
                    }
                });

                if (range.commonAncestorContainer === this) {
                    anchorNode.appendChild(fragment);
                } else {
                    anchorNode.parentNode.replaceChild(fragment, anchorNode);
                    //self._insterAfter(fragment, anchorNode);
                }


            }, false);
        },

        scrollGutter: function(offsetTop) {
            offsetTop = offsetTop || this.codeArea.scrollTop;

            this.gutter.style.bottom = offsetTop + 'px';
        },

        updateGutter: function() {
            var list = [].slice.call(this.codeArea.childNodes);
            var gutterLines = '';

            list.filter(function(node) {
                return node.tagName === 'DIV';
            }).map(function(node) {
                return node.innerHTML;
            }).forEach(function() {
                gutterLines += '<li class="c-codeEditor__gutterLine"></li>';
            });

            this.gutter.innerHTML = gutterLines;
        },

        updateFooterInfo: function() {
            var line = 'Line ' + parseInt(this.getLineNumber() + 1);
            var offsets = this.getCaretOffsets();
            var column = 'Column ' + offsets.anchor;
            var selection = ' characthers selected';
            var selectionWidth = 0;
            var info = line + ', ' + column;

            if (offsets.focus < offsets.anchor) {
                selectionWidth = offsets.anchor - offsets.focus;
            } else if (offsets.focus > offsets.anchor) {
                selectionWidth = offsets.focus - offsets.anchor;
            }

            if (selectionWidth > 0) {
                info = selectionWidth + selection;
            }

            this.footer.innerHTML = info;
        },

        getLineNumber: function() {
            var selObj = this.selector;
            var anchor = selObj.anchorNode;
            var parent;

            // If the current anchor is of type TextNode, get its parent node
            if(anchor && anchor.nodeType === 3) {
                anchor = anchor.parentElement;
            }

            parent = anchor.parentNode;

            return Array.prototype.indexOf.call(parent.children, anchor);
        },

        getCaretOffsets: function() {
            var selObj = this.selector;
            var offsets = {
                anchor: 0,
                focus: 0
            };

            if (selObj) {
                offsets['anchor'] = selObj.anchorOffset || 0;
                offsets['focus'] = selObj.focusOffset || 0;
            }

            return offsets;
        },

        highlightLine: function(index /* optional */) {

            var gutter = this.gutter;
            var children = gutter.children;

            // active Gutter Line (if any)
            var activeGLine = this.BEM('gutterLine', 'isActive');
            var activeSelector = activeGLine.BEMselector;

            var line;

            // Remove the active Gutter line (if any)
            if (activeGLine.node) {
                activeGLine.node.classList.remove(activeSelector);
            }

            // When the index was not provided
            // try to get it from the Caret position
            if (!index) {
                index = this.getLineNumber();
            }

            if (index < 0) {
                index = 0;
            }

            // children.length is zero based, but lines start from 1
            if ((index + 1) > children.length) {
                index = children.length - 1;
            }

            // Highlight Gutter line
            line = gutter.children[index];

            if (line && !line.classList.contains(activeSelector)) {
                line.classList.add(activeSelector);
            }

            // Update footer Info
            this.updateFooterInfo();
        },

        _insterAfter: function(newNode, referenceNode) {
            referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
        },

        _addChild: function(target) {
            var emptyDIV = this._emptyDIV();
            var sel = window.getSelection ? window.getSelection() : document.selection.createRange();
            var range = document.createRange();

            target.appendChild(emptyDIV);
            range.setStart(emptyDIV, 0);
            range.collapse(true);

            //make the cursor there
            sel.removeAllRanges();
            sel.addRange(range);
        },

        _emptyDIV: function() {
            var div = document.createElement('DIV');
            div.appendChild(document.createElement('BR'));
            return div;
        },

        _toArray: function(obj) {
            return [].slice.call(obj);
        },
    };

    (function(e) {
        var list = [].slice.call(document.querySelectorAll('.c-codeEditor'));
        list.forEach(function(editor) {
           var c = new CodeEditor(editor);
        });
    })(e);
});
