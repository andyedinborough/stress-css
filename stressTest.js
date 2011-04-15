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
    };
    
    function style(elm, props){
      forEach.call(Object_keys(props), 
        function (ii) { 
          try { 
            elm.style.setProperty(ii, props[ii]); 
          } catch(x) { } 
        }
      );
    }

    function indexElements() {
        var all = getChildren(document), ret = {};
        forEach.call(all, function (elm) {
            if (elm.className) {
              forEach.call(
                  filter.call(elm.className.split(whitespace), function (n) { return n.length > 0; }),
                  function (n) {
                      if (!ret['.'+n]) ret['.'+n] = [];
                      ret['.'+n].push(elm);
                  });
            } else if(elm.id) {
              if (!ret['#'+elm.id]) ret['#'+elm.id] = [];
                ret['#'+elm.id].push(elm);
            }
        });

        return ret;
    } 

    function getChildren(elm) {
        if (typeof elm.length != 'undefined') {
            var all = []; //, ret = [], hash = {};
            forEach.call(elm, function (ii) {
                Array.prototype.push.apply(all, Array.prototype.slice.call(getChildren(ii), 0));
            });
          
            //need a way to make sure the list is distinct
            return all; //ret;
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
            ii.className = distinct(classes).join(' ');
        });
    }
    
    function removeSelector(elms, selector){
      var which = selector.substr(0, 1);
      selector = selector.substr(1);
      if(which === '.') removeClass(selector);
      else if(which === '#') forEach.call(elms, function(elm){ elm.attributes.removeNamedItem('id'); });
    }
    
    function addSelector(elms, selector){
      var which = selector.substr(0, 1);
      selector = selector.substr(1);
      if(which === '.') addClass(selector);
      else if(which === '#') forEach.call(elms, function(elm){ elm.id = selector; });
    }

    function testSelector(times, selector, state, finished) {
        var elms = state.elms[selector] || [];
        removeSelector(elms, selector);
        stress(state, times, function (time) {
            addSelector(elms, selector);
            if (selector == baselineName) {
                state.baseTime = time;
            } else {
                state.results[selector] = {
                    length: elms.length,
                    children: getChildren(elms).length,
                    time: time,
                    delta: time - state.baseTime
                };
            }
            finished(selector, time);
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
                finish((+new Date) - now);
            }
        });

        work();
    }

    function stressTest(times, finish) {
        if (!times) times = 100;

        var state = { elms: indexElements(), results: {} },
            queue = Object_keys(state.elms),
            testfinish = function (className, time) {
                if (queue.length > 0 && !state.cancel) {
                    testSelector(times, queue.shift(), state, testfinish);
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
        testSelector(times, baselineName, state, function () {
            testSelector(times, baselineName, state, testfinish);
        });
    }

    function formatNumber(number, leading, trailing){
      leading = leading || 0;
      trailing = trailing || 2;
      var parts = (number+'.').split('.'); 
      while(parts[0].length<leading) parts[0] = '0' + parts[0];
      if(trailing < 1) parts[1] = '';
      else if(parts[1].length > trailing) parts[1] = parts[1].substr(0, trailing);
      else while(parts[1].length < trailing) parts[1] += '0';                   
      return parts[0] + (parts[1].length > 0 ? ('.' + parts[1]) : '');
    }

    stressTest.bookmarklet = function () {
        if(stressTest.report) stressTest.report.close();
        
        var num = prompt('How many tests would you like to run (# stress tests per selector)?', 5);
        if (num > 0) {
            stressTest(num, function (state) {
                var log = '<table><thead><tr><th>Selector</th><th># Elms.</th><th># Child.</th><th> </th><th>Delta</th><th>Total</th></tr></thead>', 
                    report = document.createElement('div'),
                    close = document.createElement('a'),
                    all = Object_keys(state.results),
                    worst = all.sort(function (a, b) {
                        return state.results[a].time - state.results[b].time;
                    }).slice(0, 20);

                forEach.call(worst, function (ii) {
                    log += '<tr><td>Removing <strong style="font:12px monospace">' + ii +
                        '</strong></td><td style="text-align:right; font:12px monospace">' + state.results[ii].length + '</td><td style="text-align:right; font:12px monospace">' + state.results[ii].children + 
                        '</td><td style="text-align:right">' + (state.results[ii].delta < 0 ? '<span style="color:red">saves</span>' : '<span style="color:green">adds</span>') +
                        '</td><td style="text-align:right; font:12px monospace">' + formatNumber(Math.abs(state.results[ii].delta)/num) + 'ms</td><td style="text-align:right; font:12px monospace">' + 
                        formatNumber(state.results[ii].time/num) + 'ms</td></tr>\n';
                });
                log += '</table><hr/><table><tr><td style="text-align:right">Classes Tested:</td><td style="font:12px monospace">' + all.length + '</td></tr>' +
                  '<tr><td style="text-align:right">Baseline Time:</td><td style="font:12px monospace">' + formatNumber(state.baseTime/num) + 'ms</td></tr>' +
                  '<tr><td style="text-align:right">Num. Tests:</td><td style="font:12px monospace">' + num + '</td></tr>';
                
                if(filter.call(all, function(cn){
                  return state.results[cn].time <= 15;
                }).length) {
                  log += '<tr><td style="color:red; text-align:right;font-weight:bold">Warning:</td><td>Increase the number<br />of tests to get more<br />accurate results</td></tr>';
                }
                
                style(report, { 
                  position: 'fixed', top: '10px', right: '10px', 
                  font: '12px Helvetica,Arials,sans-serif', 'z-index': 999999999, 
                  background: 'white', padding: '2px', 
                  border: 'solid 2px #777' 
                });
                                
                report.innerHTML = log + '</table>';
                forEach.call(
                  report.getElementsByTagName('td'), 
                  function (td) { 
                    style(td, { padding: '1px', 'vertical-align': 'top' }); 
                  }
                );
                
                close.innerHTML = '&#215;';
                style(close, { 
                  position: 'absolute', top: 0, right: 0,
                  'text-decoration': 'none', 'font-weight': 'bold',
                  cursor: 'pointer', color: 'red', 
                  'font-size': '1.3em', 'line-height': '8px' 
                });
                report.close = function(){
                  report.parentNode.removeChild(report);
                  unbind(close, 'click');
                  stressTest.report = null;                             
                };
                bind(close, 'click', report.close);
                
                report.appendChild(close);
                document.body.appendChild(report);   
                stressTest.report = report;                             
            });
        }
    }

    return stressTest;
})();