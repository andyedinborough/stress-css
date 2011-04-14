var stressTest = (function () {
    var baselineName = '__STRESSTESTBASELINE__',
    whitespace = /\s+/,
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
    }

    function indexClasses() {
        var all = getChildren(document), ret = {};
        forEach.call(all, function (elm) {
            if (!elm.className) return;
            forEach.call(
                filter.call(elm.className.split(whitespace), function (n) { return n.length > 0; }),
                function (n) {
                    if (!ret[n]) ret[n] = [];
                    ret[n].push(elm);
                });
        });

        return ret;
    }

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

    function bind(elm, name, func) {
        var parts = name.split('.');
        if (!elm.__events) elm.__events = {};
        if (!elm.__events[name]) elm.__events[name] = [];
        elm.__events[name].push(func);
        name = parts[0];
        if (elm.attachEvent) elm.attachEvent('on' + name, func);
        else if (elm.addEventListener) elm.addEventListener(name, func, false);
    }

    function unbind(elm, name, func) {
        if (!func && elm.__events && elm.__events[name]) {
            forEach.call(elm.__events[name].splice(0), function (ii) {
                unbind(elm, name, ii);
            });
        } else {
            name = name.split('.')[0];
            if (elm.detachEvent) elm.detachEvent('on' + name, func);
            else if (elm.removeEventListener) elm.removeEventListener(name, func, false);
            if (elm.__events && elm.__events[name]) {
                var i = elm.__events[name].indexOf(func);
                if (i > -1) elm.__events[name].splice(i, 1);
            }
        }
        elm = null;
    }

    function removeClass(elms, className) {
        forEach.call(elms, function (ii) {
            ii.className = distinct(
                    filter.call(
                        (ii.className || '').split(whitespace),
                        function (jj) { return jj != className; }
                    )
                ).join(' ');
        });
    }

    function distinct(arr) {
        var hash = {};
        forEach.call(arr, function (ii) {
            hash[ii] = true;
        });
        return Object_keys(hash);
    }

    function addClass(elms, className) {
        forEach.call(elms, function (ii) {
            var classes = (ii.className || '').split(' ');
            classes.push(className);
            ii.setAttribute('class', distinct(classes).join(' '));
        });
    }

    function testClass(times, className, state, finished) {
        var elms = state.elms[className] || [];
        removeClass(elms, className);
        stress(state, times, function (time) {
            addClass(elms, className);
            if (className == baselineName) {
                state.baseTime = time;
            } else {
                state.results[className] = {
                    length: elms.length,
                    affected: elms.length + getChildren(elms).length,
                    time: time,
                    delta: time - state.baseTime
                };
            }
            finished(className, time);
        });
    }

    function stress(state, times, finish) {
        var  n = 0, now = +new Date;
        work = function () {
            window.scrollBy(0, n % 2 == 0 ? 100 : -100);
        };
        times *= 2; //each test consists of scrolling down, and then back up
        
        bind(window, 'scroll.stressTest', function () {
            n++;
            if (n < times && !state.cancel) {
                setTimeout(work, 0);
            } else {
                unbind(window, 'scroll.stressTest');
                finish.call(window, (+new Date) - now);
            }
        });

        work();
    }

    function stressTest(times, finish) {
        if (!times) times = 100;

        var state = { elms: indexClasses(), results: {} },
            queue = Object_keys(state.elms),
            testfinish = function (className, time) {
                if (queue.length > 0 && !state.cancel) {
                    testClass(times, queue.shift(), state, testfinish);
                } else {
                    unbind(document, 'keydown.stressTest');
                    if (finish && !state.cancel) finish(state);
                }
            };

        bind(document, 'keydown.stressTest', function (e) {
            if (e.keyCode == 27) state.cancel = true;
        });

        window.scrollTo(0, 0); //the first test scrolls down
        /* just warming up */
        testClass(times, baselineName, state, function () {
            testClass(times, baselineName, state, testfinish);
        });
    }

    stressTest.bookmarklet = function () {
        var num = prompt('How many tests would you like to run (# stress tests per class)?', 5);
        if (num > 0) {
            stressTest(num, function (state) {
                var log = '<table><thead><tr><th>Class</th><th> </th><th>Delta</th><th>Total</th></tr></thead>', 
                    all = Object_keys(state.results),
                    worst = all.sort(function (a, b) {
                        return state.results[a].time - state.results[b].time;
                    }).slice(0, 20);

                forEach.call(worst, function (ii) {
                    log += '<tr><td>Removing <strong>' + ii +
                        '</strong></td><td>' + (state.results[ii].delta < 0 ? '<span style="color:red">saves</span>' : '<span style="color:green">adds</span>') +
                        '</td><td style="text-align:right">' + Math.abs(state.results[ii].delta) + 'ms</td><td style="text-align:right">' + state.results[ii].time + 'ms</td></tr>\n';
                });
 
                var report = document.createElement('div'),
                    style = { position: 'fixed', top: '10px', right: '10px', 'font': '12px monospace', 'z-index': 999999999, background: 'white', padding: '2px', border: 'solid 2px #777' };
                forEach.call(Object_keys(style), function (ii) { try { report.style.setProperty(ii, style[ii]); } catch(x) { } });
                report.innerHTML = log + '</table><p>Classes Tested: ' + all.length + '</p><p>Baseline Time: ' + state.baseTime + 'ms</p>';
                forEach.call(report.getElementsByTagName('td'), function (td) { td.style.padding = '1px'; });
                document.body.appendChild(report);

            });
        }
    }

    return stressTest;
})();