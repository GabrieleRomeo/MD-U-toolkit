'use strict';

var bov_Utoolkit =  bov_Utoolkit || {};

bov_Utoolkit.namespace = function (name) {

    var parts = name.split('.');
    var ns = this;

    for (var i = 0, len = parts.length; i < len; i++) {
        ns[parts[i]] = ns[parts[i]] || {};
        ns = ns[parts[i]];
    }

    return ns;
};


bov_Utoolkit.namespace('utilities').Caret = (function(win){

    var doc = win.document;

    function Caret() {
        var sel = '';

        if(win.getSelection){
            sel = win.getSelection();
        }else if(doc.getSelection){
            sel = doc.getSelection();
        }else if(doc.selection){
            sel = doc.selection.createRange().text;
        }

        this.sel = sel;
    }

    Caret.prototype.getSelected = function() {
        return this.sel;
    };

    /*
     * Create a new Range representing the starting point of the provided node
     * @param {HTML Node} node - The intended node
     *
     */
    Caret.prototype.moveAtStart = function(node) {

        var newRange = document.createRange();

        newRange.setStart(node, 0);
        // make it at a single point
        newRange.collapse(true);

        //make the cursor caret there
        this.sel.removeAllRanges();
        this.sel.addRange(newRange);

    };

    /*
     * Create a new Range representing the ending point of the provided node
     * @param {HTML Node} node - The intended node
     * @return {Range}
     *
     */
    Caret.prototype.moveAtEnd = function(node) {

        var newRange = document.createRange();

        newRange.setStart(node.firstChild, node.firstChild.textContent.length);
        // make it at a single point
        newRange.collapse(true);

        //make the cursor caret there
        this.sel.removeAllRanges();
        this.sel.addRange(newRange);
    };

    /*
     * Return a Range object representing one of the ranges currently selected
     * @param {number} index - The zero-based index of the range to return
     * @return {Range}
     *
     */
    Caret.prototype.getRangeAt = function(index) {
        return this.sel.getRangeAt(index);
    };

    return Caret;
})(this);

bov_Utoolkit.namespace('utilities').DOM = (function(win){

    var doc = win.document;

    /**
     * Get the closest matching element up the DOM tree.
     * @param  {String} selector  String that specifies the chain of selectors.
     * @return {Node} Returns the first matching node if found, else returns null.
     */
    var $ = function(selector) {
        return doc.querySelector(selector);
    };

    /**
     * Get the closest matching element up the DOM tree.
     * @param  {String} selector  String that specifies the chain of selectors.
     * @return {NodeList} Returns a NodeList collection filled with the matching
                                    elements in source order
     */
    var $$ = function(selector) {
        return doc.querySelectorAll(selector);
    };

    /**
     * Get the closest matching element up the DOM tree.
     * @param  {Element} elem     Starting element
     * @param  {String}  selector Selector to match notwithstanding
     * @return {Boolean|Element}  Returns null if not match found
     */
    var getClosest = function ( elem, selector ) {

        // When elem is a Text node, get its parent node
        if (elem.nodeType === 3) {
            elem = elem.parentNode;
        }

        // Element.matches() polyfill
        if (!Element.prototype.matches) {
            Element.prototype.matches =
                Element.prototype.matchesSelector ||
                Element.prototype.mozMatchesSelector ||
                Element.prototype.msMatchesSelector ||
                Element.prototype.oMatchesSelector ||
                Element.prototype.webkitMatchesSelector ||
                function(s) {
                    var matches = (this.document || this.ownerDocument).querySelectorAll(s),
                        i = matches.length;
                    while (--i >= 0 && matches.item(i) !== this) {}
                    return i > -1;
                };
        }

        // Get closest match
        for ( ; elem && elem !== document; elem = elem.parentNode ) {
            if ( elem.matches( selector ) ) return elem;
        }

        return null;

    };

    return {
        $: $,
        $$: $$,
        getClosest: getClosest
    };
})(this);

bov_Utoolkit.namespace('utilities.DOM').BEM = (function(){

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

bov_Utoolkit.namespace('utilities').obj = (function(win){
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
        var objUtil = bov_Utoolkit.namespace('utilities').obj;
        this.element = element;
        this.settings = objUtil.extend({}, {
            blockName: '.c-codeEditor',
            highlightActiveLine: false,
            codeEditor: true
        }, options || {});
        this.init();
    }

    CodeEditor.prototype = {
        constructor: CodeEditor,

        init: function () {
            var $ = bov_Utoolkit.namespace('utilities.DOM').BEM.$;
            var Caret = bov_Utoolkit.namespace('utilities').Caret;
            var temp = '';

            this.BEM = $(this.element);
            this.DOM = bov_Utoolkit.namespace('utilities.DOM');
            this.storage = sessionStorage;

            this.gutter = this.BEM('gutter').node;
            this.gutterList = this.BEM('gutterList').node;
            this.codeArea = this.BEM('codeArea').node;
            this.mirrorArea = this.BEM('mirrorArea').node;
            this.footer = this.BEM('footer').node;
            this.caret = new Caret();
            this.selector = this.caret.getSelected();

            // Activate the Code Editor only when it is required
            if (this.settings['codeEditor']) {
                this.codeArea.style.whiteSpace = 'nowrap';
                this.observe();
                this.handleScroll();
                this.handleMouseLeave();
                this.handleKeyDown();
                this.handleKeyUp();
                this.handleClick();
                this.handlePaste();
            } else {
                // Hide the Gutter by setting its background color the same
                // as the Code Area and change their widths
                temp = this._getComputed(this.codeArea);
                this.gutter.style.backgroundColor = temp('background-color');
                this.gutter.style.width = '10px';
                this.codeArea.style.width = 'calc(100% - 10px)';
            }

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
                        self._addEmptyLine(this);
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
            var DOM = this.DOM;

            this.codeArea.addEventListener('keydown', function(event) {

                var key;

                var selRange = sel.getRangeAt(0);
                var cloneRange;
                var line1;
                var line2;

                var remainingTxt;
                var contentLength;
                var oldContent;

                var target;
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

                    remainingTxt = cloneRange.toString();


                    // Select the closes parent DIV
                    target = DOM.getClosest(sel.anchorNode, 'div');

                    oldContent = sel.anchorNode.textContent;

                    // The cursor caret is within an empty DIV
                    if (oldContent.length === 0) {

                        line1 = self._newLine(document.createElement('BR'));
                        line2 = self._newLine(document.createElement('BR'));

                    } else if (oldContent.length === remainingTxt.length) {

                        // The caret is positioned at the beginning of the line
                        // For example :
                        //                  |text inside the code area

                        line1 = self._newLine(document.createElement('BR'));
                        line2 = self._newLine(document.createTextNode(oldContent));

                    } else {

                        // The caret is positioned somewhere between the current
                        // text line
                        // For example :
                        //                  text |inside the code area

                        // Delete the second part of the string after the caret'
                        // position.
                        // Its content has been saved inside the remainingTxt variable
                        cloneRange.deleteContents();


                        line1 = self._newLine(document.createTextNode(sel.anchorNode.textContent));

                        if (remainingTxt.length !== 0) {
                            // When the caret is positioned somewhere between the
                            // text, add the remaining text to the line 2
                            line2 = self._newLine(document.createTextNode(remainingTxt));
                        } else {
                            // When the caret is positioned at the end of the text
                            // add a new line break
                            line2 = self._newLine(document.createElement('BR'));
                        }

                    }

                    docFragment.appendChild(line1);
                    docFragment.appendChild(line2);

                    // Replace the anchor node with the new HTML fragment
                    target.parentNode.replaceChild(docFragment, target);

                    //make the caret there
                    self.caret.moveAtStart(line2);

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
                    self._addEmptyLine(this);
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
                var focusElement;

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

                focusElement = fragment.childNodes[fragment.childElementCount-1];

                // Replace the current node with the new HTML fragment
                anchorNode.parentNode.replaceChild(fragment, anchorNode);

                self.caret.moveAtStart(focusElement);

            }, false);
        },

        scrollGutter: function(offsetTop) {
            offsetTop = offsetTop || this.codeArea.scrollTop;

            this.gutterList.style.bottom = offsetTop + 'px';
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

            this.gutterList.innerHTML = gutterLines;
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

            var gutter = this.gutterList;
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

        _addEmptyLine: function(target) {

            var newLine = this._newLine(document.createElement('BR'));

            target.appendChild(newLine);

            //make the cursor there
            this.caret.moveAtStart(newLine);
        },

        /**
         * Create a new line
         *
         * @param {Value} content The content for the new Line
         *
         * @returns {HTMLElement}
         *
         */

        _newLine: function(content) {

            var div = document.createElement('DIV');

            div.setAttribute('class', 'codeLine');
            div.setAttribute('style', 'padding-left: 3px');

            if (content) {
                div.appendChild(content);
            }

            return div;
        },

        _getComputed: function(element) {
            return function(property) {
                return window.getComputedStyle(element, null).getPropertyValue(property);
            };
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

