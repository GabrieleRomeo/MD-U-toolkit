
var editor = (function(win) {

    'use strict';

    var editorInstance = null;
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


    bov_Utoolkit.namespace('utilities').Caret = (function(){

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

        Caret.prototype.cutRemainingText = function(anchorNode) {

            var selRange;
            var remainingTxt = null;

            if (this.sel.rangeCount) {
                selRange = this.sel.getRangeAt(0);

                if (anchorNode) {
                    var range = selRange.cloneRange();
                    range.selectNodeContents(anchorNode);
                    range.setStart(selRange.endContainer, selRange.endOffset);
                    remainingTxt = range.extractContents();
                    range.deleteContents();
                }
            }

            return remainingTxt.textContent || '';
        };

        return Caret;
    })(this);

    bov_Utoolkit.namespace('utilities').DOM = (function(){

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
         * @return {Function} returns a function which get an element to start with.
         *                    if the element was not provided it uses the document
         *                    object.
         */
        var $1 = function(selector) {
            return function(element) {
                if (element) {
                    return element.querySelector(selector);
                } else {
                    return doc.querySelector(selector);
                }
            };
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
            $1: $1,
            $$: $$,
            getClosest: getClosest
        };
    })(this);

    bov_Utoolkit.namespace('utilities.DOM').BEM = (function(){

        /**
         * Get the closest matching element up the DOM tree.
         * @param  {String} parent  String that specifies the chain of selectors.
         * @return {function(element, modifier)} Returns a function which get a string
                                                 for the element's name and an optional
                                                 modifier's name and returns an object
                                                 containing BEM information and the
                                                 catched HTML Node (if any)
         */
        var BEM = function(parent) {

            var block = parent.classList[0] || '';

            return function(element, modifier /*optional*/) {

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

        /**
         * Get the closest matching element up the DOM tree.
         * @param  {String} parent  String that specifies the chain of selectors.
         * @return {function(element, modifier)} Returns a function which get a string
                                                 for the element's name and an optional
                                                 modifier's name and returns an object
                                                 containing BEM information and the
                                                 catched HTML Node List
         */
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

    bov_Utoolkit.namespace('utilities').obj = (function(){

        // A list of available message severities
        var msgSeverities = {
            'error': 0,
            'warning': 1,
            'info': 2
        };

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

        /**
         * Check if the provided object contains a specific value [recursive]
         * @param  {Object} obj  An Object
         * @param  {Value} value The value you are looking for
         * @return {Boolean} True | False
         */
        function hasValue(obj, value) {
            for (var p in obj) {
                if (Object.prototype.toString.call(obj[p]) === '[object Object]') {
                    return hasValue(obj[p], value);
                }
                if (obj[p] === value) {
                    return true;
                }
            }
            return false;
        }

        /**
         * Check if the provided object contains a specific value [recursive] and
         * return the first associated key that matches (if any). Null otherwise
         * @param  {Object} obj  An Object
         * @param  {Value} value The value of the Key that you are looking for
         * @return {Value| null}
         */
        function getKeyFromValue(obj, value) {
            for (var p in obj) {
                if (Object.prototype.toString.call(obj[p]) === '[object Object]') {
                    return getKeyFromValue(obj[p], value);
                }
                if (obj[p] === value) {
                    return p;
                }
            }
            return false;
        }

        /**
         * Create a new Message Object
         * @constructor
         * @param  {String} message A textual message
         * @param  {Int} severity The message's severity level
         * @param  {Int} line An optional line number
         * @return {Boolean} True | False
         */
        function Message(message, severity, line /*optional*/) {
            this.message = message;
            this.severity = 1;
            this.line = line;


            if ((typeof severity !== 'undefined') && hasValue(msgSeverities, severity)) {
                this.severity = severity;
            }

            this.render = function() {

                var severityL = this.getSeverityLevel();
                var result = '';
                var line = this.getLine();

                result += '<tr>';
                result += '<td><span class="c-info__message c-info__message--';
                result += severityL +'">';
                result += severityL;
                result += '</span></td>';

                if (line) {
                    result += '<td>at line ' + this.getLine() +'</td>';
                } else {
                    result += '<td></td>';
                }

                result += '<td>&#96' + this.getMessage() +'&#96</td>';
                result += '</tr>';

                return result;
            };
        }

        Message.prototype.setMessage = function(message) {
            this.message = message;
        };

        Message.prototype.getMessage = function() {
            return this.message;
        };

        Message.prototype.setLine = function(line) {
            this.line = line;
        };

        Message.prototype.getLine = function() {
            return this.line;
        };

        Message.prototype.setSeverity = function(severity) {
            this.severity = (severity && hasValue(msgSeverities, severity)) ? severity : 1;
        };

        Message.prototype.getSeverity = function() {
            return this.severity;
        };

        Message.prototype.getSeverityLevel = function() {
            return getKeyFromValue(msgSeverities, this.severity);
        };

        return {
            extend: extend,
            hasValue: hasValue,
            getKeyFromValue: getKeyFromValue,
            Message: Message
        };
    })(this);

    bov_Utoolkit.namespace('validator').JSON = (function(){

        var string = '"\\s*[^"]*\\s*"';
        var boolean = '(?:true|false|null)\\b';
        var number = '\\d+(?:\\.\\d*)?(?:[eE][+\\-]?\\d+)?';
        var openA = '(?:^|:|,)(?:\\s*\\[)+';
        var missingColon = '[^\\],](?:]\\s*(?:[\\]{]){1}[,}\\s])';
        var missingProp = '[,{]\\s*[^\\]]:';
        var missingValue = '[,{]\\s*]\\s*:?\\s*[,}]';
        var missingComma = '[:\\]]\\s*(?:]\\s+(?=]))|(}\\s*])';
        var extraComma = ',\\s*}';
        var other = '(?:[^\\]{},:\\s]+)';

        /**
         * Extract the internal structure of a JSON document
         * @param  {String} str  A string representing a JSON document
         * @return {String} Returns a string containing the base structure of the
         *                  the provided JSON document
         */
        function extractStructure(str) {
            var pattern = string + '|' + boolean + '|' + number;
            var reg = new RegExp(pattern, 'g');
            var regA = new RegExp(openA, 'g');

            // Replace each matching type with the ] char
            str = str.replace(reg, ']');
            // Remove the [ char
            str = str.replace(regA, ']');

            return str;
        }


        function lineNumberByIndex(index,string){
            // RegExp
            var line = 0,
                match,
                re = /(^)[\S\s]/gm;
            while ((match = re.exec(string)) !== null) {
                if(match.index > index)
                    break;
                line++;
            }
            return line;
        }

        /**
         * // TODO - Duplicate keys check
         *
         * Validate a JSON document
         * @param  {String} str  A string representing a JSON document
         * @return {Array} Returns an Array containing a list of errors (if any)
         */
        var validateJSON = function(str) {

            var errorList = [];
            var Message = bov_Utoolkit.namespace('utilities').obj.Message;
            var errMsg = '';
            var structure = extractStructure(str).trim();

            var regEx;
            var match;
            var line;

            // Check for obj structure
            // The number of opening bracket must be equal to the closing ones
            var openB  = (structure.match(/{/g) || []).length;
            var closeB = (structure.match(/}/g) || []).length;


            // The base structure contains only spaces
            if ( /^\s*$/.test(structure) ) {
                errorList.push(new Message('Empty JSON document', 1, 0));
                return errorList;
            }

            // Check if the number of both closing and opening brackets is equal
            if (openB > closeB) {
                line = lineNumberByIndex(structure.length -1, structure);
                errMsg = 'Missing closing bracket }. Invalid Object structure';
                errorList.push(new Message(errMsg, 0, line));
            } else if (openB < closeB) {
                errMsg = 'Missing opening bracket {. Invalid Object structure';
                errorList.push(new Message(errMsg, 0));
            }

            // Check for missing colons

            regEx = new RegExp(missingColon, 'g');

            while ((match = regEx.exec(structure)) !== null) {
                line = lineNumberByIndex(regEx.lastIndex - match[0].length, structure);
                errorList.push(new Message('Missing Colon :', 0, line));
            }

            // Check for missing properties
            regEx = new RegExp(missingProp, 'g');

            while ((match = regEx.exec(structure)) !== null) {
                line = lineNumberByIndex(regEx.lastIndex - match[0].length, structure);
                // Since the pattern match includes also the previous { char wich could
                // be located on the previous line, increse the line number by 1
                errorList.push(new Message('Missing Property', 0, line + 1));
            }

            // Check for missing commas
            regEx = new RegExp(missingComma, 'g');

            while ((match = regEx.exec(structure)) !== null) {
                line = lineNumberByIndex(regEx.lastIndex - match[0].length, structure);
                errorList.push(new Message('Missing Comma ,', 0, line));
            }

            // Check for missing values
            regEx = new RegExp(missingValue, 'g');

            while ((match = regEx.exec(structure)) !== null) {
                line = lineNumberByIndex(regEx.lastIndex - match[0].length, structure);
                // Since the pattern match includes also the previous { char wich could
                // be located on the previous line, increse the line number by 1
                errorList.push(new Message('Missing Value', 0, line + 1));
            }

            // Check for extra commas
            regEx = new RegExp(extraComma, 'g');

            while ((match = regEx.exec(structure)) !== null) {
                line = lineNumberByIndex(regEx.lastIndex - match[0].length, structure);
                errorList.push(new Message('Unnecessary Comma ,', 0, line));
            }

            // Check for any extra content
            regEx = new RegExp(other, 'g');

            while ((match = regEx.exec(structure)) !== null) {
                line = lineNumberByIndex(regEx.lastIndex - match[0].length, structure);
                errorList.push(new Message('Invalid content: ' + match[0] +'', 0, line));
            }

            return errorList;
        };

        return {
            validateJSON: validateJSON
        };
    })(this);

    function Editor(element, options) {
        var objUtil = bov_Utoolkit.namespace('utilities').obj;
        // Firefox only
        win.document.execCommand('insertBrOnReturn', false, false);

        this.element = element;
        this.settings = objUtil.extend({}, {
            blockName: 'c-editor',
            highlightActiveLine: false,
            codeEditor: true,
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
            this.DOM = bov_Utoolkit.namespace('utilities.DOM');
            this.storage = sessionStorage;

            this.gutter = this.BEM('gutter').node;
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

        validateJSON: function() {
            var info = this.infoBody;
            var infoNode = info.node;
            var val = bov_Utoolkit.namespace('validator').JSON;
            var errorList = val.validateJSON(this.codeArea.innerText) || [];
            var Message = bov_Utoolkit.namespace('utilities').obj.Message;
            var info = '';
            var elements = '';

            errorList.forEach( function(error) {
                elements += '<div class="g-grid">';
                elements += '<table class="c-info__table">';
                elements += error.render();
                elements += '</table>';
                elements += '</div>';
            });

            // No Errors
            if (errorList.length === 0) {
                info =  'Congrats! No errors found.\n';
                info += 'Your JSON is valid';
                info = new Message(info, 2);
                elements += '<div class="g-grid">';
                elements += '<table class="c-info__table">';
                elements += info.render();
                elements += '</table>';
                elements += '</div>';
            }

            infoNode.innerHTML = elements;

            this.setStickies(errorList);
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
                var severityL = m.getSeverityLevel();
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

        if (element) {
            editorInstance = new Editor(element, options);
        } else {
            window.console.warn('The provided HTML element does not exists');
        }

        return undefined;
    }

    function validateJSON() {
        if (editorInstance) {
            return editorInstance.validateJSON();
        }
    }

    // Public API
    return {
        Editor: buildEditor,
        validateJSON: validateJSON
    };

})(this);

var jsonEdit = document.querySelector('#JSONeditor');
var jsonButt = document.querySelector('#JSONButton');

var jsonEditor = new editor.Editor(jsonEdit);


jsonButt.addEventListener('click', function() {
    if (!this.previousElementSibling.checked) {
        editor.validateJSON();
    }
});

