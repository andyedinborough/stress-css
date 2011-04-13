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
        };

    function testClass(times, className, results, finished) {
        var elms = $('.' + className).removeClass(className);
        stress(times, function (time) {
            elms.addClass(className);
            if (className === baselineName) results[baselineName] = time;
            else results[className] = {
                length: elms.length,
                affected: elms.length + elms.children().length,
                time: time,
                delta: results[baselineName] - time
            };
            finished(className, time);
        });
    }

    function getAllClasses() {
        var all = {};
        $('[class]').each(function () {
            var classes = $(this).attr('class').split(' ');
            forEach.call(classes, function (ii) {
                if (ii.length > 0 && !all[ii]) {
                    all[ii] = true;
                }
            });
        });

        return Object_keys(all);
    }

    function stress(times, finish) {
        var win = $(window),
            total = 0,
            n = 0, current = 0,
            work = function () {
                current = +new Date;
                window.scrollBy(0, n % 2 == 0 ? 100 : -100);
            };

        win.bind('scroll.stressTest', function () {
            total += (+new Date) - current;
            n++;
            if (n < times) setTimeout(work, 0);
            else {
                win.unbind('scroll.stressTest');
                finish.call(window, total);
            }
        });

        work();
    }

    return function (times, finishall) {
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
})();