var bov_Utoolkit =  bov_Utoolkit || {};
var objUtil = bov_Utoolkit.namespace('utilities').obj;

var editor = (function(win) {

    'use strict';


    function Editor(element, options) {

        // Firefox only
        win.document.execCommand('insertBrOnReturn', false, false);

        this.element = element;
        this.settings = objUtil.extend({}, {
            blockName: 'c-editor',
            highlightActiveLine: false,
            codeEditor: true,
            showTopMenu: true,
            stickyLine: true,
            sticky: {
                'error': {
                    'bgkcolor': 'rgba(204, 0, 0, 0.58)'
                },
                'warning': {
                    'bgkcolor' : 'rgba(255, 255, 0, 0.8)'
                },
                'info': {
                    'bgkcolor': 'rgb(96, 209, 21)'
                }
            }
        }, options || {});
        this.init();
    }

    Editor.prototype = {
        constructor: Editor,

        init: function () {
            var $ = bov_Utoolkit.namespace('utilities.DOM').BEM.$;
            var Caret = bov_Utoolkit.namespace('utilities').Caret;
            var temp = '';

            this.BEM = $(this.element);
            this.obj = bov_Utoolkit.namespace('utilities').obj;
            this.DOM = bov_Utoolkit.namespace('utilities.DOM');
            // TODO add sessions
            this.storage = sessionStorage;

            this.gutter = this.BEM('gutter').node;
            this.header = this.BEM('header').node;
            this.gutterList = this.BEM('gutterList').node;
            this.codeArea = this.BEM('codeArea').node;
            this.mirrorArea = this.BEM('mirrorArea').node;
            this.footer = this.BEM('footer').node;
            this.contentMain = this.DOM.getClosest(this.element, 'div.c-content__main');
            this.aside = this.contentMain.nextElementSibling;
            this.infoComponent = $(this.DOM.$1('.c-info')(this.aside));
            this.infoBody = this.infoComponent('body');
            this.caret = new Caret();
            this.selector = this.caret.getSelected();

            if (this.settings['height']) {
                this.element.style.height = this.settings['height'] + 'px';
            }

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
                this.codeArea.style.overflow = 'hidden';
                this.removeFormatting();
            }

            if (!this.settings['showTopMenu']) {
                this.header.style.display = 'none';
            }

            // Trigger a click event on the coding Area to activate
            // the editor's tracking system
            this.codeArea.click();
        },

        validateJSON: function() {
            var info = this.infoBody;
            var infoNode = info.node;
            var val = bov_Utoolkit.namespace('validator').JSON;
            var errorList = val.validateJSON(this.codeArea.innerText) || [];
            var Message = bov_Utoolkit.namespace('utilities').obj.Message;
            var Match = bov_Utoolkit.namespace('utilities').obj.Match;
            var info = '';
            var elements = '';

            errorList.forEach( function(error) {
                elements += '<div class="g-grid">';
                elements += '<table class="c-info__table">';
                elements += error.render({showLine: true});
                elements += '</table>';
                elements += '</div>';
            });

            // No Errors
            if (errorList.length === 0) {
                info =  'Congratulations! No errors found.\n';
                info += 'Your JSON is valid';
                info = new Match({
                    message: new Message(info, 2),
                    matches: []
                });
                elements += '<div class="g-grid">';
                elements += '<table class="c-info__table">';
                elements += info.render();
                elements += '</table>';
                elements += '</div>';
            }

            infoNode.innerHTML = elements;

            this.setStickies(errorList);
        },

        harvesting: function(pattern, message, resultEditor) {
            var info = this.infoBody;
            var infoNode = info.node;
            var harvesting = this.obj.harvesting(pattern, message, this.codeArea.innerText);
            var Message = bov_Utoolkit.namespace('utilities').obj.Message;
            var Match = bov_Utoolkit.namespace('utilities').obj.Match;
            var elements = '';

            var resultArea = resultEditor.querySelector('.c-editor__codeArea');
            var linksArr = [];
            var emailsArr = [];


            // No Match Found
            if (harvesting.length === 0) {
                info = new Match({
                    message: new Message('No Link found', 1),
                    matches: []
                });
                elements += '<div class="g-grid">';
                elements += '<table class="c-info__table">';
                elements += info.render();
                elements += '</table>';
                elements += '</div>';
            }

            harvesting.forEach( function(match) {
                elements += '<div class="g-grid">';
                elements += '<table class="c-info__table">';
                elements += match.render({showMatches: true});
                elements += '</table>';
                elements += '</div>';

                if ( match.matches[0] &&
                     match.matches[0].indexOf('@') !== -1 ) {
                    emailsArr.push(match.matches[1]);
                } else {
                    linksArr.push({
                        linkText: match.matches[2],
                        url: match.matches[1]
                    });
                }
            });

            resultArea.innerHTML = JSON.stringify({
                links: linksArr,
                emailAdresses: emailsArr
            });

            infoNode.innerHTML = elements;

            return {
                links: linksArr,
                emailAdresses: emailsArr
            };
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

                var line1;
                var line2;

                var remainingTxt;
                var oldContent;

                var target;
                var docFragment;

                event = event || window.event;
                key = event.keyCode;

                this.focus();

                // ENTER
                if (key === 13) {

                    docFragment = document.createDocumentFragment();

                    // Select the closes parent DIV
                    target = DOM.getClosest(sel.anchorNode, 'div');

                    oldContent = sel.anchorNode.textContent;

                    // Get the text after the current cursor caret's position
                    remainingTxt = self.caret.cutRemainingText(target);

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

        removeFormatting: function() {
            this.codeArea.addEventListener('paste', function(e) {
                e.preventDefault();
                var text = e.clipboardData.getData('text/plain');
                text = text.replace(/</g, '&lt;');
                document.execCommand('insertHTML', false, text);
            });
        },

        handlePaste: function() {
            var self = this;
            var selection = self.selector;

            this.codeArea.addEventListener('paste', function(event) {

                var clipboardData;
                var pastedData;
                var pastedLines;
                var focusElement;
                var anchorNode = self.DOM.getClosest(selection.anchorNode, 'div');
                var fragment = document.createDocumentFragment();
                var remainingTxt = '';

                // Get the text after the current cursor caret's position
                remainingTxt = self.caret.cutRemainingText(anchorNode);

                // Get data from the clipboard
                clipboardData = event.clipboardData || window.clipboardData;
                pastedData = clipboardData.getData('text');
                pastedLines = pastedData.split('\n');

                // When the remaining text it's not empty, add it at the end
                // of the pastedLines Array
                if (remainingTxt.trim() !== '') {
                    pastedLines.push(remainingTxt);
                }

                pastedLines.forEach(function(line, index) {
                    var element = document.createElement('div');
                    var textContent = line.replace(/ /g, '\u00a0');

                    // The FIRST LINE must include the first part of current line
                    // (without the Remaining text) + the clipboard content
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

                self.caret.moveAtEnd(focusElement);

                // Stop data actually being pasted
                event.stopPropagation();
                event.preventDefault();

            }, false);
        },

        scrollGutter: function(offsetTop) {
            offsetTop = offsetTop || this.codeArea.scrollTop;

            this.gutterList.style.bottom = offsetTop + 'px';
        },

        updateGutter: function() {
            var list = [].slice.call(this.codeArea.childNodes);
            var gutterLines = '';
            var baseComponent = this.settings['blockName'];

            list.filter(function(node) {
                return node.tagName === 'DIV';
            }).map(function(node) {
                return node.innerHTML;
            }).forEach(function() {
                gutterLines += '<li class="' + baseComponent +'__gutterLine"></li>';
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

            if (!anchor) {
                return;
            }

            // If the current anchor is of type TextNode, get its parent node
            if (anchor.nodeType === 3) {
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

        setStickies: function(matches) {
            var isStickyActive = this.settings['stickyLine'];
            var stikies = this.settings['sticky'];
            var gutter = this.gutterList;
            var children = gutter.children;

            if (!isStickyActive) {
                // do nothing
                return;
            }

            this._toArray(children).forEach( function(child) {
                // remove previous styles (if any)
                child.style = '';
            });

            matches.forEach( function(m) {
                var line = m.line;
                var severityL = m.message.getSeverityLevel();
                if (line && children[line -1]) {
                    children[line -1].style.backgroundColor = stikies[severityL]['bgkcolor'];
                }
            });
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

    function buildEditor(element, options) {
        var editorInstance = null;

        if (element) {
            editorInstance = new Editor(element, options);
        } else {
            window.console.warn('The provided HTML element does not exists');
        }

        return editorInstance;
    }

    // Public API
    return {
        Editor: buildEditor
    };

})(this);

var jsonEdit = document.querySelector('#JSONeditor');
var jsonButt = document.querySelector('#JSONButton');
var jsonEditor = new editor.Editor(jsonEdit);

var harvestingEdit = document.querySelector('#harvestingEditor');
var harvestingButt = document.querySelector('#harvestingButton');
var harvestingEditor = new editor.Editor(harvestingEdit, {
    codeEditor: false,
    stickyLine: false,
});

var harvestingREdit = document.querySelector('#harvestingResult');
var harvestingResult = new editor.Editor(harvestingREdit, {
    codeEditor: false,
    stickyLine: false,
    showTopMenu: false,
    height: 250
});


var linkPattern = /<a href=["']?(?:mailto:)?([^"']+)["']?>([\w\s]*)<\/a>/gi;
var linkMsg = new objUtil.Message('Link found', 2);


jsonButt.addEventListener('click', function() {
    var self = this;
    if (!this.previousElementSibling.checked) {
        jsonEditor.validateJSON();
        setTimeout(function() {
            self.previousElementSibling.checked = false;
        }, 2000);
    }
});

harvestingButt.addEventListener('click', function() {
    var obj = null;
    var self = this;
    if (!this.previousElementSibling.checked) {
        obj = harvestingEditor.harvesting(linkPattern, linkMsg, harvestingREdit);
        setTimeout(function() {
            self.previousElementSibling.checked = false;
        }, 2000);
        console.log(obj);
    }
});

