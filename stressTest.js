var stressTest = (function () {
    var baselineName = '__STRESSTESTBASELINE__',
        Object_keys = Object.keys || function (obj) {
            var ret = [];
            for (var i in obj) if (obj.hasOwnProperty(i)) ret.push(i);
            return ret;
        },
        forEach = Array.prototype.forEach || function (func) {
            for (var i = 0, ii = this.length; i < ii; i++) {
                func.call(this, this[i], i, this);
            }
        },
        filter = Array.prototype.filter || function (func) {
            var ret = [];
            forEach.call(this, function (ii) {
                if (func(ii)) ret.push(ii);
            });
            return ret;
        };

    function getChildren(elm) {
        if (typeof elm.length != 'undefined') {
            var all = [], ret = [], hash = {};
            forEach.call(elm, function (ii) {
                Array.prototype.push.apply(all, Array.prototype.slice.call(getChildren(ii), 0));
            });
            forEach.call(all, function (ii) {
                if (!hash[ii]) {
                    hash[ii] = true;
                    ret.push(ii);
                }
            });
            return ret;
        }
        return elm.all ? elm.all : elm.getElementsByTagName("*");
    }

    function getElementsByClassName(elm, className) {
        if (elm.getElementsByClassName) return elm.getElementsByClassName(className);
        var arrElements = getChildren(elm);
        className = className.replace(/\-/g, "\\-");
        var rx = new RegExp("(^|\\s)" + className + "(\\s|$)");
        return filter.call(arrElements, function (ii) {
            return tx.test(ii.className);
        });
    }

    function removeClass(elms, className) {
        var rx = new RegExp("(^|\\s)" + className + "(\\s|$)");
        forEach.call(elms, function (ii) {
            ii.className = (ii.className || '').replace(rx, '');
        });
    }

    function addClass(elms, className) {
        removeClass(elms, className);
        forEach.call(elms, function (ii) {
            ii.className = (ii.className || '') + ' ' + className;
        });
    }

    function bind(elm, name, func) {
        var parts = name.split('.');
        if (!elm.__events) elm.__events = {};
        if (!elm.__events[name]) elm.__events[name] = [];
        elm.__events[name].push(func);
        name = parts[0];
        if (elm.attachEvent) elm.attachEvent(name, func);
        if (elm.addEventListener) elm.addEventListener(name, func, false);
    }

    function unbind(elm, name, func) {
        if (!func && elm.__events && elm.__events[name]) {
            forEach.call(elm.__events[name].splice(0), function (ii) {
                unbind(elm, name, ii);
            });
        } else {
            if (elm.detachEvent) elm.attachEvent(name, func);
            if (elm.removeEventListener) elm.addEventListener(name, func, false);
            if (elm.__events && elm.__events[name]) {
                var i = elm.__events[name].indexOf(func);
                elm.__events[name].splice(i, 1);
            }
        }
    }

    function testClass(times, className, results, finished) {
        var elms = getElementsByClassName(document, className);
        removeClass(elms, className);

        stress(times, function (time) {
            addClass(elms, className);
            if (className === baselineName) results[baselineName] = time;
            else results[className] = {
                length: elms.length,
                children: getChildren(elms).length,
                time: time,
                delta: results[baselineName] - time
            };
            finished(className, time);
        });
    }

    function getAllClasses() {
        var all = {};
        forEach.call(getChildren(document), function (ii) {
            var classes = (ii.className || '').split(' ');
            forEach.call(classes, function (ii) {
                if (ii.length > 0 && !all[ii]) {
                    all[ii] = true;
                }
            });
        });

        return Object_keys(all);
    }

    function stress(times, finish) {
        var total = 0,
            n = 0, current = 0,
            work = function () {
                current = +new Date;
                window.scrollBy(0, n % 2 == 0 ? 100 : -100);
            };

        bind(window, 'scroll.stressTest', function () {
            total += (+new Date) - current;
            n++;
            if (n < times) setTimeout(work, 0);
            else {
                unbind(window, 'scroll.stressTest');
                finish.call(window, total);
            }
        });

        work();
    }

    function exports(times, finishall) {
        if (!times) times = 100;
        if (!finishall) finishall = function (results) {
            var worst = Object_keys(results).sort(function (a, b) {
                return results[b] - results[a];
            }).slice(0, 5);

            forEach.call(worst, function (ii) {
                console.log(ii + " added " + results[ii].delta + "ms");
            });

        };

        var classes = getAllClasses(),
            results = {},
            finish = function (className, time) {
                if (classes.length > 0) {
                    testClass(times, classes.pop(), results, finish);
                } else {
                    finishall(results);
                }
            };

        testClass(times, baselineName, results, finish);
    }

    exports.bookmarklet = function () {
        var num = prompt('How many tests would you like to run?', 10);
        if (num > 0) {
            exports(num, function (results) {
                var log = '', worst = Object_keys(results).sort(function (a, b) {
                    return results[b] - results[a];
                }).slice(0, 5);

                forEach.call(worst, function (ii) {
                    log += ii + "\t" + results[ii].delta + 'ms\n';
                });

                alert(log);
            });
        }
    }

    return exports;
})();