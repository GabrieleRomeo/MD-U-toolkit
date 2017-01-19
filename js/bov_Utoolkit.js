var bov_Utoolkit =  bov_Utoolkit || {};

(function(win) {

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

        /**
         * Get the index of a child node in parent
         * @param  {HTMLNode} childNode An HTML child node
         * @return {Number}
         */
        var getIndexOf = function(childNode) {
            return [].indexOf.call(childNode.parentNode.children, childNode);
        };

        return {
            $: $,
            $1: $1,
            $$: $$,
            getClosest: getClosest,
            getIndexOf: getIndexOf
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

        var handleClickableList = function(options) {
            var DOM = bov_Utoolkit.namespace('utilities.DOM');
            var $ = DOM.$;
            var $$ = DOM.$$;
            var BEM = DOM.BEM.$;

            var elem = BEM($(options.block));
            var listS = elem('list').BEMselector;
            var list = $$('.' + listS);
            var content = options.content ? BEM($(options.content))('content') : elem('content');
            var itemClsName = elem('item').BEMselector;
            var activeItemCls = itemClsName +'--isActive';

            var contentClsName = content.BEMselector ? content.BEMselector :
                                 content.classList[0];
            var activeContentCls = contentClsName +'--isActive';

            var contentList = $$('.' + contentClsName);
            var itemList = $$('.' + itemClsName);

            return {
                list: list,
                itemList: itemList,
                contentList: contentList,
                itemClsName: itemClsName,
                activeItemCls: activeItemCls,
                contentClsName: contentClsName,
                activeContentCls: activeContentCls
            };
        };

        return {
            $: BEM,
            $$: BEM$,
            handleClickableList: handleClickableList
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

        function _lnNumbByInx(index, string){
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
         * Search for a pattern
         * return the first associated key that matches (if any). Null otherwise
         * @constructor
         * @param  {Object} match
         */
        function Match(match) {
            this.mtch = match;
            this.render = function(options) {

                var result = '';
                var opts = options || {};
                var severityL = this.mtch.message.getSeverityLevel();
                var mLength = this.mtch.match.length;
                var mtchA = this.mtch.match;

                result += '<tr>';
                result += '<td><span class="c-info__message c-info__message--';
                result += severityL +'">';
                result += severityL;
                result += '</span></td>';

                if (this.mtch.line && opts.showLine) {
                    result += '<td>at line ' + this.mtch.line +'</td>';
                } else {
                    result += '<td></td>';
                }

                result += '<td>&#96' + this.mtch.message.getMessage() +'&#96</td>';

                if (mLength > 0) {
                    result += '<tr>';
                    result += '<td><span class="c-info__message">';
                    result += 'Full Match</span></td>';
                    result += '<td>' + mtchA.index + ' - ';
                    result +=  mtchA.index + mtchA[0].length +'</td>';
                    result += '<td>' + mtchA[0].replace(/</g, '&lt;') +'</td>';
                    result += '</tr>';

                    for (var i = 1; i < mLength; i++) {
                        result += '<tr>';
                        result += '<td><span class="c-info__message">Group ';
                        result +=  i +'</span></td>';
                        result += '<td></td>';
                        result += '<td>' + mtchA[i] +'</td>';
                        result += '</tr>';
                    }

                    result += '</tr>';
                }

                return result;
            };
        }

        /**
         * Search for a pattern
         * return the first associated key that matches (if any). Null otherwise
         * @constructor
         * @param  {Value} The text of the regular expression
         * @param  {Object} msg A Message object use as message if a match is found
         */
        function Grep(pattern, msg) {
            this.pattern = pattern;
            this.regEx = new RegExp(pattern);
            this.matches = [];
            this.msg = msg || new Message('Match found', 2);
        }

        Grep.prototype.exec = function(c) {
            var match;
            var self = this;

            while ((match = this.regEx.exec(c)) !== null) {
                // Replace the %0 placeholder (if any)
                this.replacePlaceholder(match[0]);
                this.matches.push(new Match({
                    message: self.msg,
                    line: _lnNumbByInx(self.regEx.lastIndex - match[0].length, c),
                    match: match
                }));
            }
        };

        Grep.prototype.test = function(c) {
            var search = this.pattern.search(c);
            if ( search !== -1 ) {
                this.matches.push(new Match({
                    message: self.msg,
                    line: _lnNumbByInx(search, c),
                    match: search
                }));
            }
        };

        Grep.prototype.replacePlaceholder = function(match0) {
            // if the message contains the %0 placeholder, replace it with
            // the first match content
            var message = this.msg.getMessage().replace(/\%0/g, match0);
            this.msg.setMessage(message);
        };

        Grep.prototype.getMatches = function() {
            return this.matches;
        };

        var harvesting = function(pattern, message, content) {

            var grep;
            var results = [];

            if (content.trim().length === 0) {
                results.push(new Match({
                    message: new Message('Empty Document', 1),
                    line: 0,
                    match: []
                }));

                return results;
            }

            grep = new Grep(pattern, message);
            // Execute the Regular expression
            grep.exec(content);

            return grep.getMatches();
        };

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

        /**
         * Given an Object it returs an Array containing the object's elements
         * @param  {Object} obj  An Object
        * @return {Array}
         */
        var toArray = function(obj) {
            return [].slice.call(obj);
        };

        return {
            extend: extend,
            toArray: toArray,
            hasValue: hasValue,
            getKeyFromValue: getKeyFromValue,
            Message: Message,
            harvesting: harvesting
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
})(window);